import { access, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export interface ProjectConfig {
  name: string;
  description: string;
  techStack: Record<string, string | undefined>;
  outputDir: string;
}

export interface GenerationResult {
  targetDir: string;
  manifest: string[];
}

const PROJECT_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateProjectName(name: string): string {
  if (!PROJECT_NAME.test(name)) {
    throw new Error("Project name must use lowercase letters, digits, and single hyphens only.");
  }
  return name;
}

export function resolveProjectTarget(outputDir: string, name: string): string {
  const validatedName = validateProjectName(name);
  const outputRoot = resolve(outputDir);
  const target = resolve(outputRoot, validatedName);
  if (dirname(target) !== outputRoot) {
    throw new Error("Resolved project target must be a direct child of the output directory.");
  }
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

function selectedStack(techStack: ProjectConfig["techStack"]): string {
  const values = Object.entries(techStack)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `${key}: ${value}`);
  return values.length ? values.join("\n") : "No technology choices were supplied.";
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

function moduleReadme(moduleName: string, responsibility: string): string {
  return `# ${moduleName}\n\n> Blueprint status: planned.\n\n## Responsibilities\n\n${responsibility}\n\n## Interfaces\n\nDocument public contracts before implementation.\n\n## Edge cases\n\nRecord confirmed failure modes and recovery behavior.\n\n## Implementation checklist\n\n- [ ] Define interfaces.\n- [ ] Implement confirmed behavior.\n- [ ] Add deterministic tests.\n- [ ] Run checks and record evidence.\n`;
}

async function writeProject(stageDir: string, config: ProjectConfig): Promise<void> {
  const directories = [
    "app",
    "components",
    "lib",
    "public",
    "tests/unit",
    "tests/integration",
    "types",
  ];
  for (const directory of directories) await mkdir(join(stageDir, directory), { recursive: true });

  const packageJson = {
    name: config.name,
    version: "0.1.0",
    private: true,
    scripts: { test: "vitest", lint: "eslint ." },
  };
  await writeFile(join(stageDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  await writeFile(join(stageDir, ".gitignore"), "node_modules/\n.env*\n!.env.example\ncoverage/\ndist/\n", "utf8");
  await writeFile(join(stageDir, ".env.example"), "# Add only variables required by the confirmed blueprint.\n", "utf8");
  await writeFile(
    join(stageDir, "README.md"),
    `# ${config.name}\n\n${config.description}\n\n## Confirmed technology choices\n\n${selectedStack(config.techStack)}\n\n## Status\n\nThis directory is a project blueprint. Implementation, tests, review, and deployment remain unchecked until performed.\n`,
    "utf8",
  );
  await writeFile(join(stageDir, "app", "README.md"), moduleReadme("Application", "Own routes, layouts, and request entry points."), "utf8");
  await writeFile(join(stageDir, "components", "README.md"), moduleReadme("Components", "Own reusable presentation and interaction components."), "utf8");
  await writeFile(join(stageDir, "lib", "README.md"), moduleReadme("Domain and integrations", "Own business rules and external-service adapters."), "utf8");
  await writeFile(join(stageDir, "tests", "README.md"), moduleReadme("Tests", "Own deterministic unit and integration verification."), "utf8");
}

export async function generateProjectStructure(config: ProjectConfig): Promise<GenerationResult> {
  const outputRoot = resolve(config.outputDir);
  const targetDir = resolveProjectTarget(outputRoot, config.name);
  await mkdir(outputRoot, { recursive: true });
  if (await pathExists(targetDir)) throw new Error(`Target already exists: ${targetDir}`);

  const stageDir = await mkdtemp(join(outputRoot, ".blueprint-staging-"));
  try {
    await writeProject(stageDir, config);
    const manifest = await listFiles(stageDir);
    for (const required of ["README.md", "package.json", "app/README.md", "tests/README.md"]) {
      if (!manifest.includes(required)) throw new Error(`Generated manifest is missing ${required}`);
    }
    await rename(stageDir, targetDir);
    return { targetDir, manifest };
  } catch (error) {
    await rm(stageDir, { recursive: true, force: true });
    throw error;
  }
}

async function runCli(): Promise<void> {
  const [name, stackJson = "{}", outputDir = process.cwd()] = process.argv.slice(2);
  if (!name) throw new Error("Usage: generate-structure.ts <project-name> [tech-stack-json] [output-directory]");
  const result = await generateProjectStructure({
    name,
    description: "Generated from a confirmed Blueprint Architect plan.",
    techStack: JSON.parse(stackJson) as Record<string, string>,
    outputDir,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCli();
}
