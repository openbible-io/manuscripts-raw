import sharp, { type ResizeOptions } from "sharp";
import { open, unlink } from "node:fs/promises";
import PQueue from "p-queue";
import pRetry from "p-retry";
import { availableParallelism } from "node:os";
import { basename, join } from "node:path";

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
	opts.timeout ??= 30_000;

	const file = await open(path, "w");
	const resp = await fetch(url, {
		signal: AbortSignal.timeout(opts.timeout!),
	});

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

interface QueueOptions {
	retries?: number;
	timeout?: number;
	concurrency?: number;
}

async function doAllWithProgress<T>(
	items: T[],
	fn: (t: T) => Promise<void>,
	opts: QueueOptions = {},
) {
	if (!items.length) return;

	opts.retries ??= 0;
	opts.timeout ??= 60_000;
	opts.concurrency ??= availableParallelism();

	const queue = new PQueue({ concurrency: opts.concurrency });

	const bar = new ProgressBar(items.length);
	for (const item of items) {
		queue.add(() => pRetry(() => fn(item), { retries: opts.retries }));
	}

	queue.on("completed", () => bar.tick());
	return new Promise((res, rej) => {
		queue.on("error", rej); // fail fast
		queue.on("idle", res);
	});
}

export async function downloadAll(
	items: { url: string; path: string }[],
	opts?: QueueOptions,
) {
	return doAllWithProgress(
		items,
		(i) => download(i.url, i.path, { bar: false, timeout: opts?.timeout }),
		opts,
	);
}

async function convertImg(
	inPath: string,
	outDir: string,
	keep: boolean,
	thumbnail: ResizeOptions,
) {
	const img = sharp(inPath);
	const out = join(outDir, basename(inPath).replace(/\..*/, ".webp"));
	await img.toFile(out);

	if (thumbnail.width || thumbnail.height) {
		await img
			.resize(thumbnail)
			.toFile(out.replace(/\..*/, "-small.webp"));
	}

	if (!keep) await unlink(inPath);
}

export async function convertAll(
	paths: string[],
	outDir: string,
	keep: boolean,
	thumbnail: ResizeOptions,
) {
	return doAllWithProgress(paths, (p) =>
		convertImg(p, outDir, keep, thumbnail),
	);
}

async function resizeImg(inPath: string, outPath: string, opts: ResizeOptions) {
	const img = sharp(inPath);
	await img.resize(opts).toFile(outPath);
}

export async function resizeAll(
	paths: { in: string; out: string }[],
	opts: ResizeOptions,
) {
	return doAllWithProgress(paths, (p) => resizeImg(p.in, p.out, opts));
}
