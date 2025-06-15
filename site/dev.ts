import { serve } from "bun";
import homepage from "./index.html";

async function imageHandler(req: Request) {
	const path = new URL(req.url).pathname.replace("/img/", "");
	const file = Bun.file(path);
	if (!(await file.exists())) return new Response("", { status: 404 });
	return new Response(file);
}

const server = serve({
	hostname: "0.0.0.0",
	// Bun only allows prefix routing and doesn't support custom routing to HTML
	// imports, so we have to give it all the prefixes...
	routes: {
		"/*": homepage,
		"/img/*": imageHandler,
	},
	development: true,
});

console.log(`Listening on ${server.url}`);
