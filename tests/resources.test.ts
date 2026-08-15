import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const references = join(root, "plugins", "blueprint-architect-plugin", "skills", "blueprint-architect", "references");

test("module roles are valid structured YAML without fixed directories", async () => {
  const value = JSON.parse(await readFile(join(references, "module-types.yaml"), "utf8"));
  assert.equal(value.version, 2);
  assert.ok(Array.isArray(value.module_roles));
  assert.ok(value.module_roles.some((module: { id: string }) => module.id === "domain"));
  for (const module of value.module_roles) {
    assert.ok(Array.isArray(module.required_sections));
    assert.equal(module.default_directories, undefined);
  }
});

test("capability rules are valid structured YAML", async () => {
  const value = JSON.parse(await readFile(join(references, "capability-rules.yaml"), "utf8"));
  assert.equal(value.version, 1);
  assert.ok(value.rules.length >= 6);
  for (const rule of value.rules) {
    assert.ok(Array.isArray(rule.all));
    assert.ok(Array.isArray(rule.any));
    assert.ok(["conditional", "conflict", "insufficient_input", "unverified"].includes(rule.result.status));
    assert.ok(Array.isArray(rule.result.corrections));
  }
});
