import fs from "node:fs";
import path from "node:path";
import { applyPatchInstruction } from "./patch-engine.js";
import { UISchema } from "./types.js";

const instruction = process.argv.slice(2).join(" ").trim();
if (!instruction) {
  throw new Error("Patch instruction required.");
}

const schemaPath = path.resolve("output/structure.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")) as UISchema;
const updated = applyPatchInstruction(schema, instruction);
fs.writeFileSync(schemaPath, `${JSON.stringify(updated, null, 2)}\n`);
