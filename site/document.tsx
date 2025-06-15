import * as documents from "../documents";
import type { Page } from "../types";

function padPage(nPages: number, page: Page): string {
	const padding = Math.ceil(Math.log10(nPages));
	return page.padStart(padding + 1, "0");
}

export function Document({ docId }: { docId: string }) {
	if (!(docId in documents))
		throw Error(`document "${docId}" not in [${Object.keys(documents)}]`);

	const doc = documents[docId as keyof typeof documents];

	return (
		<div>
			<h1 class="text-2xl">{doc.title}</h1>
			{Object.entries(doc.sections).map(([sectionId, section]) => (
				<div key={sectionId}>
					<h2 class="text-xl">
						{sectionId} ({section.length} pages)
					</h2>
					<div class="flex h-128 overflow-auto" dir={doc.dir}>
						{section.map((s) => (
							<a key={s} class="flex" href={`/${docId}/${sectionId}/${s}`}>
								<img
									class="max-w-fit"
									src={`/img/${docId}/${sectionId}/${padPage(section.length, s)}-small.webp`}
									alt={`${doc.title} ${sectionId} page ${s}`}
								/>
							</a>
						))}
					</div>
				</div>
			))}
			<h2 class="text-xl">Upstream sources</h2>
			<ul>
				{Object.entries(doc.sources).map(([srcId, source]) => (
					<li key={srcId}>
						<span>
							<a href={source.url} target="_blank" rel="noreferrer">
								{srcId}
							</a>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
