import { serve } from "bun";
import homepage from "./index.html";

const server = serve({
	hostname: "0.0.0.0",
	routes: {
		"/": homepage,
	},
	development: true,
	async fetch(req) {
		const path = new URL(req.url).pathname.replace("/", "");
		const file = Bun.file(path);
		return new Response(file);
	},
});

console.log(`Listening on ${server.url}`);
