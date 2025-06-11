import { render } from "preact";
import { dir, indexToPage, nFolioPages, sources } from "../leningrad/download";
import { useEffect, useState } from "preact/hooks";

function minMax(n: number, min: number, max: number) {
	return Math.min(Math.max(n, min), max);
}

function Img(props: { prefix: string; number: number; class: string }) {
	const page = indexToPage(props.number);

	return (
		<img
			class={`w-1/2 object-contain ${props.class}`}
			src={`${props.prefix}/${page.number.toString().padStart(3, "0")}${page.side}.webp`}
			alt={`Page ${page.number} side ${page.side}`}
		/>
	);
}

function ImgSources(props: { number: number }) {
	const page = indexToPage(props.number);

	return (
		<span dir="ltr">
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

function Book(props: { prefix: string; nImages: number }) {
	// Assume "1a" is cover page.
	const [number, setNumber] = useState(0);
	const pagePrefix = `${props.prefix}/folio`;

	useEffect(() => {
		function onKeyDown(ev: KeyboardEvent) {
			let offset = 0;
			if (ev.key === "ArrowLeft") {
				offset = dir === "rtl" ? 1 : -1;
			} else if (ev.key === "ArrowRight") {
				offset = dir === "rtl" ? -1 : 1;
			}
			offset *= 2;
			setNumber((old) => minMax(old + offset, 0, nFolioPages));
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<>
			<div class="flex h-dvh overflow-auto" dir={dir}>
				<Img class="object-left" prefix={pagePrefix} number={number - 1} />
				<Img class="object-right" prefix={pagePrefix} number={number} />
			</div>
			<div class="w-full absolute bottom-0 grid grid-cols-2 bg-black/50 text-white p-2 rounded-md">
				<ImgSources number={number - 1} />
				<ImgSources number={number} />
				<div class="w-full col-span-2 flex" dir="ltr">
					<input
						class="grow"
						type="range"
						dir={dir}
						value={number}
						min={0}
						max={nFolioPages}
						step={2}
						onChange={(ev) => setNumber(+ev.currentTarget.value)}
					/>
					<input
						type="number"
						value={number}
						min={0}
						max={nFolioPages}
						step={2}
						onChange={(ev) => setNumber(+ev.currentTarget.value)}
					/>
					{`/ ${nFolioPages}`}
				</div>
			</div>
		</>
	);
}

function App() {
	return <Book prefix="leningrad" nImages={nFolioPages} />;
}

render(<App />, document.body);
