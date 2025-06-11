import { convertAll, downloadAll } from "../helpers";
import { leningrad } from "./download";

const items = await leningrad("Archive.org Color", ".");
await downloadAll(items);

console.log("converting images");
await convertAll(items.map(i => i.path));

