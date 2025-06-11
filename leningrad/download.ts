import { join } from "node:path";
import { mkdir } from "node:fs/promises";

// There's only one good facsimilie: West Semitic Research Project from 1990.
// 989 images were photographed in 3 weeks. Fun story of photography:
// https://library.biblicalarchaeology.org/sidebar/lens-on-leningrad-photographing-the-codex/

// The folio was given latin page numbers from 1A to 491B. They're lightly
// written in the outer top corners.
type Side = "a" | "b";
type Page = { number: number; side: Side };

// We'll use 0-982
export const nFolioPages = 491 * 2; // == 982
export function indexToPage(index: number): Page {
	return { number: Math.floor(index / 2) + 1, side: index % 2 ? "b" : "a" };
}

// USC has published two versions of the image set
// - 989 Color images with varying resolutions
// - 985 Black and white images with uniform resolution
//
// ...but only low-resolution ones are available for download:
// https://digitallibrary.usc.edu/asset-management/2A3BF1R6A84LS?&WS=SearchResults&Flat=FP

// Sefaria is the source most people use, but has cropped images
export function sefariaUrl(index: number) {
	let res = "https://manuscripts.sefaria.org/leningrad-color/BIB_LENCDX_F";
	const page = indexToPage(index);
	res += page.number.toString().padStart(3, "0");
	res += page.side.toUpperCase();
	res += ".jpg";
	return res;
}

// Archive.org has a high-resolution color set of Biblical images, but:
// - It's missing front-matter
// - The non-Biblical pages are copies from Sefaria
export const archive = {
	color: {
		server: "https://ia904509.us.archive.org",
		id: "Leningrad_Codex_Color_Images",
		file: "Leningrad_Codex_Color",
		zip: "1",
		offset: 0,
	},
	black_white: {
		server: "https://ia600808.us.archive.org",
		id: "Leningrad_Codex",
		file: "Leningrad",
		zip: "14",
		offset: 5,
	},
};
type Archive = typeof archive.color;

export function archiveOrgUrl(page: number, opts?: Archive) {
	opts ??= archive.color;

	const { id, file } = opts;

	let res = opts.server;
	res += `/BookReader/BookReaderImages.php?zip=/${opts.zip}/items/`;
	res += `${id}/${file}_jp2.zip`;
	res += `&file=${file}_jp2/${file}_`;
	res += (page + opts.offset).toString().padStart(4, "0");
	res += ".jp2";
	res += `&id=${id}&scale=1&rotate=0`;

	return res;
}

export const sources = {
	"Archive.org Black+White": {
		url: `https://archive.org/details/${archive.black_white.id}`,
		imageUrl: (index: number) => archiveOrgUrl(index, archive.black_white),
	},
	"Archive.org Color": {
		url: `https://archive.org/details/${archive.color.id}`,
		imageUrl: (index: number) => archiveOrgUrl(index, archive.color),
	},
	"Sefaria.org Cropped": {
		url: sefariaUrl(0),
		imageUrl: sefariaUrl,
	},
};

export async function leningrad(
	source: keyof typeof sources,
	prefix: string = source,
) {
	const src = sources[source];
	console.log("downloading", source, "to", prefix);
	await mkdir(join(prefix, "f"), { recursive: true });

	const items = [];

	for (let i = 0; i < nFolioPages; i++) {
		const page = indexToPage(i);
		const fname = `${page.number.toString().padStart(3, "0")}${page.side}.jpg`;
		const outpath = join(prefix, "f", fname);
		items.push({ url: src.imageUrl(i), path: outpath });
	}

	return items;
}

export const dir = "rtl";
