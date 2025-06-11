import sharp from "sharp";
import { open, unlink, rename } from "node:fs/promises";
import PQueue from "p-queue";
import pRetry from "p-retry";

function formatBytes(bytes: number): string {
	const table = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const idx = Math.floor(Math.log10(bytes || 1) / 3);
	const sig = bytes / 1000 ** idx;

	return `${sig.toFixed(2)} ${table[idx]}`;
}

export class ProgressBar {
	progress = 0;
	total = 0;
	lastTick = new Date().getTime();
	numberFmt: (n: number) => string;

	constructor(total?: number, numberFmt = (n: number) => n.toString()) {
		if (total) this.total = total;
		this.numberFmt = numberFmt;
		console.log(this.toString());
	}

	tick(amount = 1) {
		this.progress += amount;
		if (process?.stdout?.isTTY) {
			process.stdout.cursorTo(0);
			process.stdout.moveCursor(0, -1);
			process.stdout.clearLine(0);
			process.stdout.write(this.toString());
			process.stdout.write("\n");
		} else {
			const now = new Date().getTime();
			if (now - this.lastTick > 1000) {
				console.log(this.toString());
				this.lastTick = now;
			}
		}
	}

	toString(): string {
		return `${this.numberFmt(this.progress)} / ${this.numberFmt(this.total)} (${((this.progress * 100) / this.total).toFixed(2)}%)`;
	}
}

export async function download(
	url: string,
	path: string,
	opts: { bar?: boolean; timeout?: number } = {},
) {
	opts.bar ??= true;
	opts.timeout ??= 10_000;

	const file = await open(path, "w");
	const resp = await fetch(url, { signal: AbortSignal.timeout(opts.timeout) });

	const total = resp.headers.get("content-length") ?? "0";
	const bar = opts.bar
		? new ProgressBar(Number.parseInt(total), formatBytes)
		: undefined;
	if (!resp.body) throw Error("no response body");
	if (!resp.ok) throw Error(`${resp.status}: ${url}`);
	const reader = resp.body.getReader();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		bar?.tick(value.length);
		await file.write(value);
	}
	await file.close();
}

export async function downloadAll(items: { url: string; path: string }[]) {
	const queue = new PQueue({ concurrency: 100 });

	const bar = new ProgressBar(items.length);
	for (const thing of items) {
		queue.add(() =>
			pRetry(() => download(thing.url, thing.path, { bar: false }), { retries: 5 }),
		);
	}

	queue.on("completed", () => bar.tick());
	return new Promise((res) => queue.on("idle", res));
}

export async function convertImg(imgPath: string) {
	const tmp = `${imgPath}.webp`;
	await sharp(imgPath).toFile(tmp);
	await unlink(imgPath);
	await rename(tmp, imgPath.replace(/\..*/, ".webp"));
}

export async function convertAll(paths: string[]) {
	const queue = new PQueue();

	const bar = new ProgressBar(paths.length);
	for (const path of paths) {
		queue.add(() => convertImg(path));
	}

	queue.on("completed", () => bar.tick());
	return new Promise((res) => queue.on("idle", res));
}
