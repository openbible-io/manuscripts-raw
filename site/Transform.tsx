import { type Signal, useComputed, useSignal } from "@preact/signals";
import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import rotationUrl from "./rotate.svg";

const rotationCursor = `url(${rotationUrl}) 8 8, pointer`;

export default function classnames(
	...classes: (JSX.HTMLAttributes["class"] | boolean | undefined | null)[]
) {
	return classes.filter(Boolean).join(" ") ?? "";
}

interface TransformProps
	extends Omit<
		JSX.HTMLAttributes<HTMLDivElement>,
		"style" | "onPointerDown" | "onPointerUp" | "onPointerMove"
	> {
	transform: Signal<string>;
	isPanning?(ev: PointerEvent): boolean;
	cursorElement?: HTMLElement;
}

export function Transform({
	isPanning = (ev) => [1, 2, 4].some((b) => ev.buttons & b),
	cursorElement = document.body,
	transform,
	...rest
}: TransformProps) {
	const pos = useSignal(new DOMPoint());

	function pointer(ev: PointerEvent) {
		if (ev.type === "pointerup") cursorElement.style.cursor = "";
		if (!isPanning(ev)) return;

		const posOld = pos.value;
		pos.value = new DOMPoint(ev.pageX, ev.pageY);

		if (ev.type === "pointerdown") {
			cursorElement.style.cursor = "grabbing";
		} else {
			const dx = pos.value.x - posOld.x;
			const dy = pos.value.y - posOld.y;

			const m = new DOMMatrix(transform.value);
			m.e += dx;
			m.f += dy;
			transform.value = m.toString();
		}
		ev.preventDefault();
	}

	useEffect(() => {
		function resetCursor(ev: KeyboardEvent | PointerEvent) {
			if (!ev.shiftKey) cursorElement.style.cursor = "";
		}
		function onKeyDown(ev: KeyboardEvent) {
			if (ev.shiftKey) cursorElement.style.cursor = rotationCursor;
		}

		document.addEventListener("pointerup", resetCursor);
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", resetCursor);
		return () => {
			document.removeEventListener("pointerup", resetCursor);
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("keyup", onKeyDown);
		};
	}, [cursorElement]);

	function wheel(ev: WheelEvent) {
		const x = ev.pageX;
		const y = ev.pageY;
		const dir = ev.deltaY > 0 ? 1 : -1;
		const m = new DOMMatrix(transform.value);

		const newTransform = new DOMMatrix().translateSelf(x, y);
		if (ev.shiftKey) {
			const amount = dir * 0.5;
			newTransform.rotateSelf(amount)
		} else {
			const amount = 1 - dir * 0.05;
			newTransform.scaleSelf(amount)
		}
		m.preMultiplySelf(newTransform.translateSelf(-x, -y));
		transform.value = m.toString();
		ev.preventDefault();
	}

	const style = useComputed(
		() => `transform-origin:top left;transform: ${transform}`,
	);

	return (
		<div
			onPointerDown={pointer}
			onPointerMove={pointer}
			onWheel={wheel}
			class="overflow-hidden"
		>
			<div style={style} {...rest} />
		</div>
	);
}
