import { join } from "node:path";
import { mkdir, readdir, rmdir } from "node:fs/promises";
import { convertAll, downloadAll, resizeAll } from "./helpers";
import * as documents from "./documents";
import { decodePage, type Document } from "./types";
import { Command, program, Option } from "@commander-js/extra-typings";

// .option("--keep", "", false)

const sharedOpts = [
	new Option("-d, --documents <document...>", "documents to download").default(
		Object.keys(documents),
	),
	new Option(
		"-s, --sections <sections...>",
		"sections of those documents to download (default: all)",
	),
];

program.addCommand(
	new Command("download")
		.addOption(sharedOpts[0])
		.addOption(sharedOpts[1])
		.action(download),
);
program.addCommand(
	new Command("convert")
		.description("convert ALL images in directory to webp")
		.addOption(sharedOpts[0])
		.addOption(sharedOpts[1])
		.option("-k, --keep", "keep source images", false)
		.option(
			"-t, --thumbnail <string>",
			"thumbnail {width}x{height} (set to 0 to skip)",
			"0x256",
		)
		.action(convert),
);

program.parse();

async function download(opts: { documents: string[]; sections?: string[] }) {
	for (const docId of opts.documents) {
		if (!(docId in documents)) {
			console.warn("skipping unknown", docId);
			continue;
		}
		const doc: Document = documents[docId as keyof typeof documents];
		const sections: string[] = opts.sections ?? Object.keys(doc.sections);

		for (const section of sections) {
			const pages = doc.sections[section];
			const padding = Math.ceil(Math.log10(pages.length));
			const prefix = join(docId, "tmp", section);
			await mkdir(prefix, { recursive: true });

			const items = [];
			for (const page of pages) {
				const source = Object.values(doc.sources).find(
					(s) => section in s.sections && s.sections[section].includes(page),
				);
				if (!source) {
					console.warn("no source for section", section, "page", page);
					continue;
				}

				const { number, side } = decodePage(page);
				items.push({
					url: source.imageUrl(section, page),
					path: join(
						prefix,
						`${number.toString().padStart(padding, "0")}${side}.jpg`,
					),
				});
			}

			console.log(docId, section);
			await mkdir(join(docId, section), { recursive: true });
			await downloadAll(items, { concurrency: 100 });
		}
	}
}

async function convert(opts: {
	documents: string[];
	sections?: string[];
	keep: boolean;
	thumbnail: string;
}) {
	for (const docId of opts.documents) {
		if (!(docId in documents)) {
			console.warn("skipping unknown", docId);
			continue;
		}
		const doc: Document = documents[docId as keyof typeof documents];
		const sections: string[] = opts.sections ?? Object.keys(doc.sections);

		for (const section of sections) {
			const prefix = join(docId, "tmp", section);
			const outDir = join(docId, section);
			const files = (await readdir(prefix)).map((f) => join(prefix, f));

			console.log(docId, section);
			const [width, height] = opts.thumbnail
				.split("x")
				.map(s => Number.parseInt(s))
				.map((i) => (Number.isSafeInteger(i) && i !== 0 ? i : undefined));
			await convertAll(files, outDir, opts.keep, { width, height });
			if (!opts.keep) await rmdir(prefix);
		}
	}
}
