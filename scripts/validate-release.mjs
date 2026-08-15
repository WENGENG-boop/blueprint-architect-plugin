import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const marketplacePath = resolve(root, ".agents/plugins/marketplace.json");
const pluginRoot = resolve(root, "plugins/blueprint-architect-plugin");
const pluginPath = resolve(pluginRoot, ".codex-plugin/plugin.json");
const skillRoot = resolve(pluginRoot, "skills/blueprint-architect");

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function validateSkill() {
  const skill = await readFile(resolve(skillRoot, "SKILL.md"), "utf8");
  const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) throw new Error("SKILL.md is missing YAML frontmatter");
  const keys = [...frontmatter[1].matchAll(/^([a-z_]+):/gm)].map((match) => match[1]);
  if (keys.join(",") !== "name,description") throw new Error("Skill frontmatter must contain only name and description");
  if (!frontmatter[1].includes("name: blueprint-architect")) throw new Error("Skill name is invalid");
  for (const file of ["references/analyze-prd.md", "references/capability-rules.yaml", "references/evidence-policy.md", "references/module-types.yaml", "templates/v2-module-template.md", "scripts/blueprint-types.ts", "scripts/validate-blueprint.ts", "scripts/capability-engine.ts", "scripts/compatibility-graph.ts", "scripts/generate-structure.ts"]) {
    await readFile(resolve(skillRoot, file));
  }
  process.stdout.write("Skill release validation passed.\n");
}

async function validatePlugin() {
  const marketplace = await json(marketplacePath);
  const manifest = await json(pluginPath);
  if (marketplace.name !== "blueprint-architect") throw new Error("Marketplace name is invalid");
  const entry = marketplace.plugins?.find((plugin) => plugin.name === "blueprint-architect-plugin");
  if (!entry || entry.source?.path !== "./plugins/blueprint-architect-plugin") throw new Error("Marketplace plugin source is invalid");
  if (manifest.name !== "blueprint-architect-plugin" || manifest.version !== "0.2.0") throw new Error("Plugin manifest identity is invalid");
  if (manifest.skills !== "./skills/") throw new Error("Plugin skill path is invalid");
  process.stdout.write("Plugin release validation passed.\n");
}

const mode = process.argv[2];
if (mode === "skill") await validateSkill();
else if (mode === "plugin") await validatePlugin();
else throw new Error("Use: validate-release.mjs <skill|plugin>");
