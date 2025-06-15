import * as documents from "../documents";

export const Documents = () => (
	<div class="flex gap-2 p-4">
		{Object.entries(documents).map(([docId, doc]) => (
			<a
				key={doc.title}
				href={`/${docId}`}
				class="p-2 bg-(image:--src)"
				style={{
					width: doc.cover.width,
					height: doc.cover.height,
					"--src": `url(/img/${docId}/${doc.cover.src})`,
				}}
			>
				<h2 class="text-xl font-semibold backdrop-blur-[2px] rounded-xl text-center mt-12">
					{doc.title}
				</h2>
			</a>
		))}
	</div>
);
