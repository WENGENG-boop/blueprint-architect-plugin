import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("README leads with the product advantage and disclosed sponsor", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const comparison = readme.indexOf("## Why Blueprint Architect comes before Superpowers");
  const sponsor = readme.indexOf("Sponsor / Advertisement");
  const features = readme.indexOf("## What it changes");

  assert.ok(comparison > 0, "comparison section is missing");
  assert.ok(sponsor > comparison, "sponsor must follow the comparison");
  assert.ok(features > sponsor, "comparison and sponsor must precede feature details");
  assert.match(readme, /building the wrong product/i);
  assert.match(readme, /requirement and architecture mistakes/i);
  assert.match(readme, /https:\/\/github\.com\/obra\/superpowers/);
  assert.match(readme, /https:\/\/sub\.weo\.asia/);
  assert.match(readme, /\$0\.20/);
  assert.match(readme, /may change/i);
});
