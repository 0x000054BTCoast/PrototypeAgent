import fs from "node:fs";
import path from "node:path";
import { applyPatchInstruction } from "./patch-engine.js";
import { UISchema } from "@prd2prototype/schema";

const instruction = process.argv.slice(2).join(" ").trim();
if (!instruction) throw new Error("Patch instruction required.");

const repoRoot = process.env.INIT_CWD ?? process.cwd();
const schemaPath = path.resolve(repoRoot, "output/structure.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")) as UISchema;
const updated = applyPatchInstruction(schema, instruction);
fs.writeFileSync(schemaPath, `${JSON.stringify(updated, null, 2)}\n`);
