import { render } from "preact";
import { dir, indexToPage, nFolioPages, sources } from "../leningrad/download";
import { useEffect, useRef, useState } from "preact/hooks";
import classnames, { Transform } from "./Transform";
import { useSignal } from "@preact/signals";

function minMax(n: number, min: number, max: number) {
	return Math.min(Math.max(n, min), max);
}

function Img(props: { prefix: string; number: number; class: string }) {
	const page = indexToPage(props.number);
	let src = props.prefix;
	src += "/";
	src += page.number.toString().padStart(3, "0");
	src += page.side;
	src += ".webp";

	return (
		<div>
			<img
				class={`grow object-contain ${props.class}`}
				src={src}
				alt={`Page ${page.number} side ${page.side}`}
			/>
		</div>
	);
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

function Book(props: { prefix: string; nImages: number }) {
	// Assume "1a" is cover page.
	const [number, setNumber] = useState(0);
	const step = useSignal(2);
	const pagePrefix = `${props.prefix}/folio`;
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onKeyDown(ev: KeyboardEvent) {
			let offset = 0;
			if (ev.key === "ArrowLeft") {
				offset = dir === "rtl" ? 1 : -1;
			} else if (ev.key === "ArrowRight") {
				offset = dir === "rtl" ? -1 : 1;
			}
			offset *= step.value;
			setNumber((old) => minMax(old + offset, 0, nFolioPages));
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [step]);

	// Set step
	useEffect(() => {
		const r = ref.current;
		if (!r) return;
		const observer = new ResizeObserver(() => {
			let newStep = 0;
			const imgs = r.getElementsByTagName("img");
			for (let i = 0; i < imgs.length; i++) {
				console.log(imgs[i].offsetParent)
				if (imgs[i].offsetParent) newStep += 1;
			}
			step.value = newStep;
		});
		observer.observe(r);
		return () => observer.disconnect();
	}, [step]);

	return (
		<div ref={ref}>
			<Transform class="flex items-center h-dvh" dir={dir}>
				<Img class="object-left" prefix={pagePrefix} number={number - 1} />
				<Img
					class="object-right hidden md:inline-block"
					prefix={pagePrefix}
					number={number}
				/>
			</Transform>
			<div
				class="w-full absolute bottom-0 grid grid-cols-2 bg-black/50 text-white p-2 rounded-md"
				dir={dir}
			>
				<ImgSources class="md:col-span-1 col-span-2" number={number - 1} />
				<ImgSources class="hidden md:inline" number={number} />
				<div class="w-full col-span-2 flex" dir="ltr">
					<input
						class="grow"
						type="range"
						dir={dir}
						value={number}
						min={0}
						max={nFolioPages}
						step={step}
						onInput={(ev) => setNumber(+ev.currentTarget.value)}
					/>
					<input
						type="number"
						value={number}
						min={0}
						max={nFolioPages}
						step={step}
						onChange={(ev) => setNumber(+ev.currentTarget.value)}
					/>
					{`/ ${nFolioPages}`}
				</div>
			</div>
		</div>
	);
}

function App() {
	return <Book prefix="leningrad" nImages={nFolioPages} />;
}

render(<App />, document.body);
