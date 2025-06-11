import { render } from "preact";
import { dir, indexToPage, nFolioPages, sources } from "../leningrad/download";
import { useState } from "preact/hooks";

function Img(props: { prefix: string; number: number }) {
	// Assume "1a" is cover page.
	const page = indexToPage(props.number);

	return (
		<img
			class="h-full"
			src={`${props.prefix}/${page.number.toString().padStart(3, "0")}${page.side}.webp`}
			alt={`Page ${page.number} side ${page.side}`}
		/>
	);
}

function ImgSources(props: { number: number }) {
	return (
		<ul class="flex justify-evenly">
			{Object.entries(sources).map(([name, source]) => (
				<li key={name}>
					<a href={source.imageUrl((props.number - 1) * 2)}>{name}</a>
				</li>
			))}
		</ul>
	);
}

function Book(props: { prefix: string; nImages: number }) {
	const [number, setNumber] = useState(0);
	const pagePrefix = `${props.prefix}/f`;

	return (
		<div class="grid grid-cols-2 h-full grid-rows-[1fr_1fr_repeat(2,1rem)]" dir={dir}>
			<Img prefix={pagePrefix} number={number - 1} />
			<Img prefix={pagePrefix} number={number} />
			<ImgSources number={number - 1} />
			<ImgSources number={number} />
			<div class="col-span-2" />
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
	);
}

function App() {
	return (
		<div class="w-full h-dvh">
			<Book prefix="leningrad" nImages={nFolioPages} />
		</div>
	);
}

render(<App />, document.body);
