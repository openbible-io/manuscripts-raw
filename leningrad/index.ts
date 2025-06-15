// There's only one good facsimilie: West Semitic Research Project from 1990.
// 989 images were photographed in 3 weeks:
// https://library.biblicalarchaeology.org/sidebar/lens-on-leningrad-photographing-the-codex/
import { type Page, type Document, type Section, decodePage } from "../types";

// The folio was given latin page numbers from 1A to 491B. They're lightly
// written once per-page in the top left corner.
const nFolioPages = 491 * 2; // == 982

const archiveOrg = {
	color: {
		server: "https://ia904509.us.archive.org",
		id: "Leningrad_Codex_Color_Images",
		file: "Leningrad_Codex_Color",
		zip: "1",
	},
	black_white: {
		server: "https://ia600808.us.archive.org",
		id: "Leningrad_Codex",
		file: "Leningrad",
		zip: "14",
		offsets: {
			folio: 5,
		},
	},
};
type Archive = {
	server: string;
	id: string;
	file: string;
	zip: string;
	offsets?: Record<Section, number>;
};

function archiveOrgUrl(section: Section, page: Page, opts: Archive) {
	const { id, file } = opts;
	const { number, side } = decodePage(page);
	const index =
		(number - 1) * 2 + (side === "a" ? 0 : 1) + (opts.offsets?.[section] ?? 0);

	let res = opts.server;
	res += `/BookReader/BookReaderImages.php?zip=/${opts.zip}/items/`;
	res += `${id}/${file}_jp2.zip`;
	res += `&file=${file}_jp2/${file}_`;
	res += index.toString().padStart(4, "0");
	res += ".jp2";
	res += `&id=${id}&scale=1&rotate=0`;

	return res;
}

const folio = [...Array(nFolioPages).keys()].map(
	(i) => `${Math.floor(i / 2) + 1}${i % 2 ? "b" : "a"}` as Page,
);

export const leningrad: Document = {
	title: "Leningrad Codex",
	cover: {
		src: "cover/1a-small.webp",
		width: 223,
		height: 256,
	},
	sources: {
		Color: {
			url: `https://archive.org/details/${archiveOrg.color.id}`,
			sections: {
				// The non-Biblical pages are copies from Sefaria
				folio,
			},
			imageUrl(section: Section, page: Page) {
				return archiveOrgUrl(section, page, archiveOrg.color);
			},
		},
		// Most popular but some bad croppings
		Cropped: {
			url: "https://www.sefaria.org/texts/Tanakh",
			sections: {
				folio,
			},
			imageUrl(section: Section, page: Page) {
				if (section !== "folio") return "";

				let res =
					"https://manuscripts.sefaria.org/leningrad-color/BIB_LENCDX_F";
				res += page.padStart(4, "0").toUpperCase();
				res += ".jpg";
				return res;
			},
		},
		// Official source but only offers lowres images with weird URLs.
		// Uses orangelogic.com and custom ID system.
		// Uses session token to make some signed S3 requests.
		// I'm too lazy to reverse engineer it.
		USC: {
			url: "https://digitallibrary.usc.edu/asset-management/2A3BF1R6A84LS?&WS=SearchResults&Flat=FP",
			sections: {
				// cover: ["1a", "1b", "2a", "2b", "3a"],
				// folio,
			},
			imageUrl: () => "",
		},
		"Black+White": {
			url: `https://archive.org/details/${archiveOrg.black_white.id}`,
			sections: {
				cover: ["1a", "1b", "2a", "2b", "3a"],
				folio,
			},
			imageUrl(section: Section, page: Page) {
				return archiveOrgUrl(section, page, archiveOrg.black_white);
			},
		},
	},
	sections: {
		// Can't find photographs of 3b. 3a reads "B19 A".
		// Not a big deal since it's a flyleaf page added by a library.
		cover: ["1a", "1b", "2a", "2b", "3a", "3b"],
		folio,
	},
	dir: "rtl",
};
