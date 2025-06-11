import { mkdir } from "node:fs/promises";
import { convertAll, downloadAll, resizeAll } from "../helpers";
import { leningrad } from "./download";

const items = await leningrad("Color", ".");

await downloadAll(items, { retries: 5, timeout: 10_000, concurrency: 100 });
const converted = await convertAll(items.map((i) => i.path));

await mkdir("folio-small", { recursive: true });
await resizeAll(
	converted.map((c) => ({ in: c, out: c.replace("folio", "folio-small") })),
	{ height: 256 },
);
