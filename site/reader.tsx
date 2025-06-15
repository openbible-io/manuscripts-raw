import { useEffect, useRef, useState } from "preact/hooks";
import classnames, { Transform } from "./Transform";
import { useSignal } from "@preact/signals";
import type { Page, Section, Sections } from "../types";
import { decodePage } from "../types";
import * as documents from "../documents";

function minMax(n: number, min: number, max: number) {
	return Math.min(Math.max(n, min), max);
}

function ImgSources(props: { number: number; class?: string }) {
	const page = indexToPage(props.number);

	return (
		<span dir="ltr" class={classnames("overflow-hidden", props.class)}>
			<span class="pr-4">
				Page {page.number}
				{page.side} sources:
			</span>
			<ul class="inline-flex">
				{Object.entries(sources).map(([name, source]) => (
					<li key={name} class="pr-2">
						<a href={source.imageUrl((props.number - 1) * 2)}>{name}</a>
					</li>
				))}
			</ul>
		</span>
	);
}

function nToPage(sections: Sections, n: number): { section: Section, page: Page } {
	const entries = Object.entries(sections);
	let [section, pages] = entries[0]
	for ([section, pages] of entries) {
		if (n < pages.length) break;
		n -= pages.length;
	}
	return { section, page: pages[n] };
}

function pageToN(sections: Sections, section: Section, page: Page): number | undefined {
	let res = 0;
	for (const [sectionId, pages] of Object.entries(sections)) {
		if (section === sectionId) {
			const idx = pages.indexOf(page);
			if (idx === -1) return;
			return res + idx;
		}
		res += pages.length;
	}
	return res;
}

function Img(props: { docId: keyof typeof documents; section: string; page: Page; class?: string }) {
	const sections = documents[props.docId];
	const padding = Math.ceil(Math.log10(sections[props.section].length));
	const { number, side } = decodePage(props.page);

	let src = `/${props.docId}/${props.section}`;
	src += "/";
	src += number.toString().padStart(padding, "0");
	src += side;
	src += ".webp";

	return (
		<div class={classnames("grow", props.class)}>
			<img src={src} alt={`Page ${number} side ${side}`} />
		</div>
	);
}

export function Reader({ docId, sectionId, pageId }: { docId: string, sectionId: string, pageId: Page }) {
	const doc = documents[docId as keyof typeof documents];
	const nPages = Object.values(doc.sections).reduce((acc, cur) => acc + cur.length, 0);

	if (!(sectionId in doc.sections)) {
		return <div>
			<h1>404</h1>
			section {sectionId} not found in {docId}
		</div>
	}

	const page = pageToN(doc.sections, sectionId, pageId);
	if (!page) {
		return <div>
			<h1>404</h1>
			page {page} not found in {sectionId} of {docId}
		</div>
	}

	const [number, setNumber] = useState(page);
	const transform = useSignal(new DOMMatrix().toString());
	const step = useSignal(1);
	const ref = useRef<HTMLDivElement>(null);


	useEffect(() => {
		function onKeyDown(ev: KeyboardEvent) {
			let offset = 0;
			if (ev.key === "ArrowLeft") {
				offset = doc.dir === "rtl" ? 1 : -1;
			} else if (ev.key === "ArrowRight") {
				offset = doc.dir === "rtl" ? -1 : 1;
			}
			offset *= step.value;
			setNumber((old) => minMax(old + offset, 0, nPages));
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [step, doc.dir, nPages]);

	// useEffect(() => {
	// 	const r = ref.current;
	// 	if (!r) return;
	// 	const observer = new ResizeObserver(() => {
	// 		let newStep = 0;
	// 		const imgs = r.getElementsByTagName("img");
	// 		for (let i = 0; i < imgs.length; i++) {
	// 			if (imgs[i].offsetParent) newStep += 1;
	// 		}
	// 		step.value = newStep;
	// 	});
	// 	observer.observe(r);
	// 	return () => observer.disconnect();
	// }, [step]);
					// <ImgSources class="col-span-2" number={number} />

	return (
		<div ref={ref}>
			<Transform
				transform={transform}
				class="flex items-center h-dvh"
				dir={doc.dir}
			>
				<Img docId={docId} section={sectionId} page={pageId} />
			</Transform>
			<div class="absolute top-0 right-0 text-white">
				<div class="h-12 bg-black/50 p-2 rounded-md m-2">
					<button
						type="button"
						class="h-full"
						onMouseDown={() => (transform.value = new DOMMatrix().toString())}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							height="100%"
							viewBox="0 0 24 24"
						>
							<title>Home</title>
							<path
								fill="currentColor"
								d="M6 19h3v-6h6v6h3v-9l-6-4.5L6 10zm-2 2V9l8-6l8 6v12h-7v-6h-2v6zm8-8.75"
							/>
						</svg>
					</button>
				</div>
			</div>
			<div class="absolute bottom-0 text-white w-full" dir={doc.dir}>
				<div class="grid grid-cols-2 bg-black/50 p-2 rounded-md">
					<div class="w-full col-span-2 flex" dir="ltr">
						<input
							class="grow"
							type="range"
							dir={doc.dir}
							value={number}
							min={0}
							max={nPages}
							step={step}
							onInput={(ev) => setNumber(+ev.currentTarget.value)}
						/>
						<input
							type="number"
							value={number}
							min={0}
							max={nPages}
							step={step}
							onChange={(ev) => setNumber(+ev.currentTarget.value)}
						/>
						{`/ ${nPages}`}
					</div>
				</div>
			</div>
		</div>
	);
}

