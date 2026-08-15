import { isAbsolute } from "node:path";
import type { BlueprintSpec, CompatibilityFinding, EvidenceRecord, ModuleDefinition } from "./blueprint-types.ts";

const ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const PATH_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const SECRET_FIELD = /^(token|password|secret|private[_-]?key|api[_-]?key)$/i;
const PRIMARY_EVIDENCE = new Set(["official_docs", "official_repository", "package_metadata", "local_rule"]);

export class BlueprintValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid BlueprintSpec:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "BlueprintValidationError";
    this.issues = issues;
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function requiredString(value: unknown, path: string, issues: string[]): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`${path} must be a non-empty string`);
    return false;
  }
  return true;
}

function requiredArray(value: unknown, path: string, issues: string[]): value is unknown[] {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array`);
    return false;
  }
  return true;
}

function validateIds(items: unknown, path: string, issues: string[]): Set<string> {
  const ids = new Set<string>();
  if (!requiredArray(items, path, issues)) return ids;
  items.forEach((item, index) => {
    const value = record(item);
    if (!value || !requiredString(value.id, `${path}[${index}].id`, issues)) return;
    if (!ID.test(value.id)) issues.push(`${path}[${index}].id must use lowercase stable-id syntax`);
    if (ids.has(value.id)) issues.push(`${path} contains duplicate id: ${value.id}`);
    ids.add(value.id);
  });
  return ids;
}

function validateStringList(value: unknown, path: string, issues: string[], allowEmpty = true): string[] {
  if (!requiredArray(value, path, issues)) return [];
  const result: string[] = [];
  value.forEach((item, index) => {
    if (requiredString(item, `${path}[${index}]`, issues)) result.push(item);
  });
  if (!allowEmpty && result.length === 0) issues.push(`${path} must contain at least one value`);
  return result;
}

function validateReferences(values: unknown, known: Set<string>, path: string, label: string, issues: string[]): void {
  for (const value of validateStringList(values, path, issues)) {
    if (!known.has(value)) issues.push(`${path} references unknown ${label}: ${value}`);
  }
}

function validateModulePath(module: Record<string, unknown>, index: number, issues: string[]): void {
  const path = module.path;
  const field = `modules[${index}].path`;
  if (!requiredString(path, field, issues)) return;
  if (isAbsolute(path) || path.includes("\\")) issues.push(`${field} must be a relative POSIX-style path`);
  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === ".." || !PATH_SEGMENT.test(segment) || WINDOWS_RESERVED.test(segment))) {
    issues.push(`${field} contains an unsafe path segment`);
  }
}

function scanSecretFields(value: unknown, path: string, issues: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSecretFields(item, `${path}[${index}]`, issues));
    return;
  }
  const object = record(value);
  if (!object) return;
  for (const [key, child] of Object.entries(object)) {
    const childPath = path ? `${path}.${key}` : key;
    if (SECRET_FIELD.test(key) && typeof child === "string" && child.trim() !== "") {
      issues.push(`${childPath} must contain a configuration name, not a secret value`);
    }
    scanSecretFields(child, childPath, issues);
  }
}

function validateEvidence(evidence: unknown, issues: string[]): Map<string, EvidenceRecord> {
  const result = new Map<string, EvidenceRecord>();
  if (!Array.isArray(evidence)) return result;
  evidence.forEach((item, index) => {
    const value = record(item);
    if (!value || typeof value.id !== "string") return;
    for (const field of ["subject", "versionRange", "retrievedAt", "claim"] as const) requiredString(value[field], `evidence[${index}].${field}`, issues);
    if (!requiredString(value.sourceType, `evidence[${index}].sourceType`, issues)) return;
    if (!value.url && !value.localReference) issues.push(`evidence[${index}] requires url or localReference`);
    result.set(value.id, value as unknown as EvidenceRecord);
  });
  return result;
}

function validateFindingEvidence(findings: unknown, evidence: Map<string, EvidenceRecord>, issues: string[]): void {
  if (!Array.isArray(findings)) return;
  findings.forEach((item, index) => {
    const finding = record(item) as unknown as CompatibilityFinding | undefined;
    if (!finding) return;
    const evidenceIds = validateStringList(finding.evidenceIds, `findings[${index}].evidenceIds`, issues);
    evidenceIds.forEach((id) => {
      if (!evidence.has(id)) issues.push(`findings[${index}].evidenceIds references unknown evidence: ${id}`);
    });
    if (finding.status === "verified_compatible") {
      const primary = evidenceIds.some((id) => PRIMARY_EVIDENCE.has(evidence.get(id)?.sourceType ?? ""));
      if (!primary) issues.push(`findings[${index}] verified_compatible requires primary evidence`);
    }
  });
}

export function validateBlueprintSpec(input: unknown): BlueprintSpec {
  const issues: string[] = [];
  const root = record(input);
  if (!root) throw new BlueprintValidationError(["root must be an object"]);
  if (root.schemaVersion !== 1) issues.push("schemaVersion must equal 1");

  const project = record(root.project);
  if (!project) issues.push("project must be an object");
  else for (const field of ["id", "name", "description", "problem"] as const) requiredString(project[field], `project.${field}`, issues);

  const requirementIds = validateIds(root.requirements, "requirements", issues);
  const technologyIds = validateIds(root.technologies, "technologies", issues);
  const deploymentIds = validateIds(root.deployments, "deployments", issues);
  const moduleIds = validateIds(root.modules, "modules", issues);
  const interfaceIds = validateIds(root.interfaces, "interfaces", issues);
  const dataFlowIds = validateIds(root.dataFlows, "dataFlows", issues);
  validateIds(root.evidence, "evidence", issues);
  validateIds(root.findings, "findings", issues);
  validateIds(root.unresolved, "unresolved", issues);

  if (Array.isArray(root.requirements)) root.requirements.forEach((item, index) => {
    const value = record(item);
    if (!value) return;
    requiredString(value.title, `requirements[${index}].title`, issues);
    requiredString(value.description, `requirements[${index}].description`, issues);
    validateStringList(value.acceptanceCriteria, `requirements[${index}].acceptanceCriteria`, issues, false);
  });

  if (Array.isArray(root.technologies)) root.technologies.forEach((item, index) => {
    const value = record(item);
    if (!value) return;
    requiredString(value.name, `technologies[${index}].name`, issues);
    requiredString(value.category, `technologies[${index}].category`, issues);
    validateReferences(value.deploymentIds, deploymentIds, `technologies[${index}].deploymentIds`, "deployment", issues);
    validateReferences(value.dependencyIds, technologyIds, `technologies[${index}].dependencyIds`, "technology", issues);
    if (typeof value.runtimeId === "string" && !technologyIds.has(value.runtimeId)) issues.push(`technologies[${index}].runtimeId references unknown technology: ${value.runtimeId}`);
    if (!record(value.capabilities)) issues.push(`technologies[${index}].capabilities must be an object`);
  });

  if (Array.isArray(root.deployments)) root.deployments.forEach((item, index) => {
    const value = record(item);
    if (!value) return;
    requiredString(value.name, `deployments[${index}].name`, issues);
    requiredString(value.type, `deployments[${index}].type`, issues);
    validateReferences(value.technologyIds, technologyIds, `deployments[${index}].technologyIds`, "technology", issues);
  });

  if (Array.isArray(root.modules)) root.modules.forEach((item, index) => {
    const value = record(item);
    if (!value) return;
    requiredString(value.name, `modules[${index}].name`, issues);
    validateModulePath(value, index, issues);
    validateStringList(value.responsibilities, `modules[${index}].responsibilities`, issues, false);
    validateReferences(value.technologyIds, technologyIds, `modules[${index}].technologyIds`, "technology", issues);
    validateReferences(value.requirementIds, requirementIds, `modules[${index}].requirementIds`, "requirement", issues);
    validateReferences(value.dependencyIds, moduleIds, `modules[${index}].dependencyIds`, "module", issues);
    validateReferences(value.interfaceIds, interfaceIds, `modules[${index}].interfaceIds`, "interface", issues);
    validateReferences(value.dataFlowIds, dataFlowIds, `modules[${index}].dataFlowIds`, "data flow", issues);
    if (Array.isArray(value.tests)) value.tests.forEach((test, testIndex) => {
      const testValue = record(test);
      if (testValue) validateReferences(testValue.requirementIds, requirementIds, `modules[${index}].tests[${testIndex}].requirementIds`, "requirement", issues);
    });
  });

  if (Array.isArray(root.interfaces)) root.interfaces.forEach((item, index) => {
    const value = record(item);
    if (!value) return;
    if (typeof value.moduleId !== "string" || !moduleIds.has(value.moduleId)) issues.push(`interfaces[${index}].moduleId references unknown module: ${String(value.moduleId)}`);
    validateReferences(value.consumerModuleIds, moduleIds, `interfaces[${index}].consumerModuleIds`, "module", issues);
    validateReferences(value.requirementIds, requirementIds, `interfaces[${index}].requirementIds`, "requirement", issues);
    for (const field of ["name", "transport", "request", "response", "authentication", "idempotency", "versioning"] as const) requiredString(value[field], `interfaces[${index}].${field}`, issues);
  });

  const nodeIds = new Set([...technologyIds, ...deploymentIds, ...moduleIds, ...interfaceIds]);
  if (Array.isArray(root.dataFlows)) root.dataFlows.forEach((item, index) => {
    const value = record(item);
    if (!value) return;
    for (const field of ["fromId", "toId"] as const) if (typeof value[field] !== "string" || !nodeIds.has(value[field] as string)) issues.push(`dataFlows[${index}].${field} references unknown node: ${String(value[field])}`);
    validateReferences(value.requirementIds, requirementIds, `dataFlows[${index}].requirementIds`, "requirement", issues);
  });

  const evidence = validateEvidence(root.evidence, issues);
  validateFindingEvidence(root.findings, evidence, issues);
  scanSecretFields(root, "", issues);

  if (issues.length) throw new BlueprintValidationError(issues);
  return input as BlueprintSpec;
}

export function validateModulePaths(modules: ModuleDefinition[]): void {
  const issues: string[] = [];
  modules.forEach((module, index) => validateModulePath(module as unknown as Record<string, unknown>, index, issues));
  if (issues.length) throw new BlueprintValidationError(issues);
}
