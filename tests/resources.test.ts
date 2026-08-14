import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const references = join(root, "plugins", "blueprint-architect-plugin", "skills", "blueprint-architect", "references");

test("compatibility matrix is valid structured YAML", async () => {
  const value = JSON.parse(await readFile(join(references, "compatibility-matrix.yaml"), "utf8"));
  assert.equal(value.version, 1);
  assert.ok(Array.isArray(value.rules));
  assert.ok(value.rules.length >= 3);
  for (const rule of value.rules) {
    assert.equal(typeof rule.id, "string");
    assert.ok(["info", "warning", "error"].includes(rule.severity));
    assert.ok(Array.isArray(rule.corrections));
  }
});

test("module types are valid structured YAML", async () => {
  const value = JSON.parse(await readFile(join(references, "module-types.yaml"), "utf8"));
  assert.equal(value.version, 1);
  assert.ok(Array.isArray(value.module_types));
  assert.ok(value.module_types.some((module: { id: string }) => module.id === "application"));
  for (const module of value.module_types) assert.ok(Array.isArray(module.required_sections));
});
