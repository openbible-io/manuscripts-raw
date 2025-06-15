// Where new page numbering starts.
export type Section = string;

// Front or back
export type Side = "a" | "b";
/** Prefer numbers printed on pages if possible */
export type Page = `${number}${Side}`;
export function decodePage(page: Page): { number: number, side: Side } {
	return {
		number: Number.parseInt(page),
		side: page[page.length - 1] as Side,
	};
}
export type Sections = Record<Section, Page[]>;

export type Sources = Record<
	string,
	{
		url: string;
		sections: Sections;
		imageUrl(section: Section, page: Page): string;
	}
>;

export type Document = {
	title: string;
	cover: {
		src: string;
		width: number;
		height: number;
	};
	/** In order of preference */
	sources: Sources;
	/** In order */
	sections: Sections;
	dir: "ltr" | "rtl";
};
