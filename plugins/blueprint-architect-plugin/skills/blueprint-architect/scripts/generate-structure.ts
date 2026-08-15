import { access, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import type { BlueprintSpec, CompatibilityFinding, EvidenceRecord, GenerationResult, InterfaceDefinition, ModuleDefinition } from "./blueprint-types.ts";
import { validateBlueprintSpec } from "./validate-blueprint.ts";

const PROJECT_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateProjectName(name: string): string {
  if (!PROJECT_NAME.test(name)) throw new Error("Project name must use lowercase letters, digits, and single hyphens only.");
  return name;
}

export function resolveProjectTarget(outputDir: string, name: string): string {
  const validatedName = validateProjectName(name);
  const outputRoot = resolve(outputDir);
  const target = resolve(outputRoot, validatedName);
  if (dirname(target) !== outputRoot) throw new Error("Resolved project target must be a direct child of the output directory.");
  return target;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function listFiles(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, fullPath)));
    else files.push(relative(root, fullPath).split(sep).join("/"));
  }
  return files.sort();
}

function lines(values: string[], empty = "None confirmed."): string {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : empty;
}

function checkedStatus(status: CompatibilityFinding["status"]): string {
  return {
    verified_compatible: "Verified compatible",
    conditional: "Conditional",
    conflict: "Conflict",
    insufficient_input: "Insufficient input",
    unverified: "Unverified",
  }[status];
}

function renderRoot(spec: BlueprintSpec): string {
  const technologies = spec.technologies.map((technology) => `${technology.name}${technology.version ? ` ${technology.version}` : ""} — ${technology.category} (${technology.source}, ${technology.confidence} confidence)`);
  return `# ${spec.project.name}\n\n> Blueprint status: planned. Implementation, tests, review, and deployment remain unchecked until supported by evidence.\n\n${spec.project.description}\n\n## Fundamental problem\n\n${spec.project.problem}\n\n## Goals\n\n${lines(spec.project.goals)}\n\n## Non-goals\n\n${lines(spec.project.nonGoals)}\n\n## Constraints\n\n${lines(spec.project.constraints)}\n\n## Confirmed and provisional technologies\n\n${lines(technologies)}\n\n## Module tree\n\n${lines(spec.modules.map((module) => `\`${module.path}/\` — ${module.name}`))}\n\n## Compatibility summary\n\n${lines(spec.findings.map((finding) => `**${checkedStatus(finding.status)}** — ${finding.issue} (\`${finding.edgeId}\`)`))}\n\n## Implementation checklist\n\n- [ ] Resolve every conflict and insufficient-input finding.\n- [ ] Confirm every conditional constraint and unverified edge.\n- [ ] Implement modules according to their documented boundaries.\n- [ ] Implement and version public contracts before consumers.\n- [ ] Run the mapped tests and record evidence.\n`;
}

function renderModule(module: ModuleDefinition): string {
  return `# ${module.name}\n\n> Blueprint status: planned. Module ID: \`${module.id}\`.\n\n## Responsibilities\n\n${lines(module.responsibilities)}\n\n## Owned data\n\n${lines(module.ownedData)}\n\n## Interfaces and contracts\n\n${lines(module.interfaceIds.map((id) => `\`${id}\``))}\n\n## Data flows\n\n${lines(module.dataFlowIds.map((id) => `\`${id}\``))}\n\n## Dependencies\n\n### Modules\n\n${lines(module.dependencyIds.map((id) => `\`${id}\``))}\n\n### Technologies\n\n${lines(module.technologyIds.map((id) => `\`${id}\``))}\n\n## Failure modes\n\n${lines(module.failureModes)}\n\n## Security\n\n${lines(module.security)}\n\n## Privacy\n\n${lines(module.privacy)}\n\n## Configuration names\n\n${lines(module.configuration.map((name) => `\`${name}\``))}\n\n## Requirement traceability\n\n${lines(module.requirementIds.map((id) => `\`${id}\``))}\n\n## Test obligations\n\n${lines(module.tests.map((test) => `\`${test.id}\` [${test.kind}] — ${test.description}; requirements: ${test.requirementIds.join(", ")}`))}\n\n## Implementation checklist\n\n- [ ] Define the documented public boundaries.\n- [ ] Implement the confirmed responsibilities and invariants.\n- [ ] Handle every documented failure mode.\n- [ ] Complete the mapped test obligations.\n`;
}

function renderInterface(boundary: InterfaceDefinition): string {
  return `# ${boundary.name}\n\nInterface ID: \`${boundary.id}\`\n\n## Ownership and consumers\n\n- Owner: \`${boundary.moduleId}\`\n${lines(boundary.consumerModuleIds.map((id) => `Consumer: \`${id}\``))}\n\n## Transport\n\n- Transport: ${boundary.transport}\n- Method: ${boundary.method ?? "Not applicable"}\n- Path: ${boundary.path ?? "Not applicable"}\n\n## Request\n\n${boundary.request}\n\n## Response\n\n${boundary.response}\n\n## Errors\n\n${lines(boundary.errors)}\n\n## Authentication\n\n${boundary.authentication}\n\n## Idempotency\n\n${boundary.idempotency}\n\n## Versioning\n\n${boundary.versioning}\n\n## Requirement traceability\n\n${lines(boundary.requirementIds.map((id) => `\`${id}\``))}\n`;
}

function renderDecisions(spec: BlueprintSpec): string {
  return `# Architecture decisions\n\n## Assumptions\n\n${lines(spec.project.assumptions)}\n\n## Technologies\n\n${spec.technologies.map((technology) => `### ${technology.name}\n\n- ID: \`${technology.id}\`\n- Category: ${technology.category}\n- Version: ${technology.version ?? "Unresolved"}\n- Source: ${technology.source}\n- Confidence: ${technology.confidence}\n- Capabilities: ${Object.entries(technology.capabilities).map(([key, value]) => `\`${key}=${Array.isArray(value) ? value.join("|") : String(value)}\``).join(", ") || "None declared"}`).join("\n\n")}\n`;
}

function renderCompatibility(findings: CompatibilityFinding[]): string {
  return `# Compatibility report\n\n${findings.map((finding) => `## ${checkedStatus(finding.status)}: ${finding.id}\n\n- Edge: \`${finding.edgeId}\`\n- Affected: ${finding.affectedIds.map((id) => `\`${id}\``).join(", ")}\n- Confidence: ${finding.confidence}\n- Issue: ${finding.issue}\n- Impact: ${finding.impact}\n- Evidence: ${finding.evidenceIds.length ? finding.evidenceIds.map((id) => `\`${id}\``).join(", ") : "None"}\n\n### Corrections\n\n${lines(finding.corrections.map((item) => `**${item.kind}** — ${item.description}; cost: ${item.migrationCost}; owner: ${item.operationalOwner}; risks: ${item.risks.join("; ") || "None recorded"}`))}`).join("\n\n")}\n`;
}

function renderEvidence(evidence: EvidenceRecord[]): string {
  return `# Evidence index\n\n${evidence.length ? evidence.map((record) => `## ${record.subject}\n\n- ID: \`${record.id}\`\n- Source type: ${record.sourceType}\n- Source: ${record.url ?? record.localReference}\n- Version range: ${record.versionRange}\n- Retrieved: ${record.retrievedAt}\n- Claim: ${record.claim}\n- Supports: ${record.supports.join(", ") || "None"}\n- Contradicts: ${record.contradicts.join(", ") || "None"}`).join("\n\n") : "No evidence records were supplied."}\n`;
}

function renderTraceability(spec: BlueprintSpec): string {
  const rows = spec.requirements.map((requirement) => {
    const modules = spec.modules.filter((module) => module.requirementIds.includes(requirement.id)).map((module) => module.id);
    const interfaces = spec.interfaces.filter((boundary) => boundary.requirementIds.includes(requirement.id)).map((boundary) => boundary.id);
    const tests = spec.modules.flatMap((module) => module.tests).filter((test) => test.requirementIds.includes(requirement.id)).map((test) => test.id);
    return `| \`${requirement.id}\` | ${requirement.title} | ${modules.join(", ") || "None"} | ${interfaces.join(", ") || "None"} | ${tests.join(", ") || "None"} |`;
  });
  return `# Requirement traceability\n\n| Requirement | Title | Modules | Interfaces | Tests |\n|---|---|---|---|---|\n${rows.join("\n")}\n`;
}

function renderDeployment(spec: BlueprintSpec): string {
  return `# Deployment architecture\n\n${spec.deployments.map((deployment) => `## ${deployment.name}\n\n- ID: \`${deployment.id}\`\n- Type: ${deployment.type}\n- Technologies: ${deployment.technologyIds.join(", ") || "None"}\n- Constraints: ${deployment.constraints.join("; ") || "None"}\n- Capabilities: ${Object.entries(deployment.capabilities).map(([key, value]) => `\`${key}=${Array.isArray(value) ? value.join("|") : String(value)}\``).join(", ") || "None"}`).join("\n\n")}\n`;
}

async function writeText(stageDir: string, relativePath: string, content: string): Promise<void> {
  const target = join(stageDir, ...relativePath.split("/"));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

function plannedManifest(spec: BlueprintSpec): string[] {
  return [
    "README.md",
    "architecture/compatibility.md",
    "architecture/decisions.md",
    "architecture/deployment.md",
    "architecture/evidence.md",
    "architecture/traceability.md",
    "blueprint.manifest.json",
    "blueprint.spec.json",
    ...spec.modules.map((module) => `${module.path}/README.md`),
    ...spec.interfaces.map((boundary) => `interfaces/${boundary.id}.md`),
  ].sort();
}

async function writeBlueprint(stageDir: string, spec: BlueprintSpec): Promise<string[]> {
  const manifest = plannedManifest(spec);
  await writeText(stageDir, "README.md", renderRoot(spec));
  await writeText(stageDir, "architecture/decisions.md", renderDecisions(spec));
  await writeText(stageDir, "architecture/compatibility.md", renderCompatibility(spec.findings));
  await writeText(stageDir, "architecture/evidence.md", renderEvidence(spec.evidence));
  await writeText(stageDir, "architecture/traceability.md", renderTraceability(spec));
  await writeText(stageDir, "architecture/deployment.md", renderDeployment(spec));
  for (const module of spec.modules) await writeText(stageDir, `${module.path}/README.md`, renderModule(module));
  for (const boundary of spec.interfaces) await writeText(stageDir, `interfaces/${boundary.id}.md`, renderInterface(boundary));
  await writeText(stageDir, "blueprint.spec.json", `${JSON.stringify(spec, null, 2)}\n`);
  await writeText(stageDir, "blueprint.manifest.json", `${JSON.stringify({ schemaVersion: 1, files: manifest }, null, 2)}\n`);
  return manifest;
}

export async function generateBlueprint(specInput: BlueprintSpec, outputDir: string): Promise<GenerationResult> {
  const spec = validateBlueprintSpec(specInput);
  const projectName = validateProjectName(spec.project.id);
  await mkdir(resolve(outputDir), { recursive: true });
  const outputRoot = await realpath(resolve(outputDir));
  const targetDir = resolveProjectTarget(outputRoot, projectName);
  if (await pathExists(targetDir)) throw new Error(`Target already exists: ${targetDir}`);

  const stageDir = await mkdtemp(join(outputRoot, ".blueprint-staging-"));
  try {
    const expected = await writeBlueprint(stageDir, spec);
    const actual = await listFiles(stageDir);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Generated manifest mismatch: expected ${expected.join(", ")}; received ${actual.join(", ")}`);
    await rename(stageDir, targetDir);
    return { targetDir, manifest: actual };
  } catch (error) {
    await rm(stageDir, { recursive: true, force: true });
    throw error;
  }
}

async function runCli(): Promise<void> {
  const [specPath, outputDir = process.cwd()] = process.argv.slice(2);
  if (!specPath || !(await pathExists(resolve(specPath)))) throw new Error("Legacy generator arguments are no longer supported; provide a BlueprintSpec JSON file.");
  const input = JSON.parse(await readFile(resolve(specPath), "utf8")) as unknown;
  const result = await generateBlueprint(validateBlueprintSpec(input), outputDir);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await runCli();
