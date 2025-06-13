import { useComputed, useSignal } from "@preact/signals";
import type { JSX } from "preact";
import { useEffect } from "preact/hooks";

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
	isPanning?(ev: PointerEvent): boolean;
	cursorElement?: HTMLElement;
}

export function Transform({
	isPanning = (ev) => [1, 2, 4].some((b) => ev.buttons & b),
	cursorElement = document.body,
	...rest
}: TransformProps) {
	const transform = useSignal(new DOMMatrix().toString());
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
		function onPointerUp() {
			cursorElement.style.cursor = "";
		}

		document.addEventListener("pointerup", onPointerUp);
		return () => document.removeEventListener("pointerup", onPointerUp);
	}, [cursorElement]);

	function wheel(ev: WheelEvent) {
		const x = ev.pageX;
		const y = ev.pageY;
		const dir = ev.deltaY > 0 ? 1 : -1;
		const amount = 1 - dir * 0.05;
		const m = new DOMMatrix(transform.value);

		m.scaleSelf(amount);
		m.e = x - (x - m.e) * amount;
		m.f = y - (y - m.f) * amount;
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
