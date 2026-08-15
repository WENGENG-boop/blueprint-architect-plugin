import type {
  BlueprintSpec,
  CompatibilityCorrection,
  CompatibilityFinding,
  EvidenceRecord,
  FindingStatus,
  TechnologyDefinition,
} from "./blueprint-types.ts";
import { evaluateCapabilityRules, type CapabilityContext, type CapabilityEntity, type CapabilityRuleSet, type RuleFinding } from "./capability-engine.ts";

export interface CompatibilityEdge {
  id: string;
  sourceId: string;
  relationship: string;
  targetId: string;
  versionSensitive: boolean;
}

export interface CompatibilityReport {
  edges: CompatibilityEdge[];
  findings: CompatibilityFinding[];
  findingsByEdge: Map<string, CompatibilityFinding>;
  uncoveredEdges: string[];
}

const PRIMARY_SOURCES = new Set(["official_docs", "official_repository", "package_metadata"]);
const STATUS_PRIORITY: Record<FindingStatus, number> = {
  conflict: 0,
  insufficient_input: 1,
  unverified: 2,
  conditional: 3,
  verified_compatible: 4,
};
const CORRECTION_PRIORITY = { configuration: 0, adapter: 1, version: 2, isolation: 3, replacement: 4 } as const;

function edgeId(sourceId: string, relationship: string, targetId: string): string {
  return `edge-${sourceId}-${relationship}-${targetId}`;
}

function versionSensitive(technology: TechnologyDefinition | undefined): boolean {
  return Boolean(technology?.version || technology?.capabilities["version-sensitive"] === true);
}

export function buildCompatibilityEdges(spec: BlueprintSpec): CompatibilityEdge[] {
  const technologies = new Map(spec.technologies.map((technology) => [technology.id, technology]));
  const edges = new Map<string, CompatibilityEdge>();
  const add = (sourceId: string, relationship: string, targetId: string, sensitive = false) => {
    const id = edgeId(sourceId, relationship, targetId);
    edges.set(id, { id, sourceId, relationship, targetId, versionSensitive: sensitive });
  };

  for (const technology of spec.technologies) {
    for (const dependencyId of technology.dependencyIds) add(technology.id, "depends", dependencyId, versionSensitive(technology) || versionSensitive(technologies.get(dependencyId)));
    if (technology.runtimeId) add(technology.id, "runs", technology.runtimeId, versionSensitive(technology) || versionSensitive(technologies.get(technology.runtimeId)));
    for (const deploymentId of technology.deploymentIds) add(technology.id, "deploy", deploymentId, versionSensitive(technology));
  }
  for (const module of spec.modules) {
    for (const technologyId of module.technologyIds) add(module.id, "uses", technologyId, versionSensitive(technologies.get(technologyId)));
    for (const dependencyId of module.dependencyIds) add(module.id, "depends", dependencyId);
    for (const interfaceId of module.interfaceIds) add(module.id, "exposes", interfaceId);
  }
  for (const boundary of spec.interfaces) {
    add(boundary.id, "owned-by", boundary.moduleId);
    for (const consumerId of boundary.consumerModuleIds) add(consumerId, "consumes", boundary.id);
  }
  for (const flow of spec.dataFlows) add(flow.fromId, "flows", flow.toId);
  return [...edges.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function capabilityEntities(spec: BlueprintSpec): CapabilityEntity[] {
  const entities: CapabilityEntity[] = [];
  for (const technology of spec.technologies) {
    entities.push({ id: technology.id, selector: `technology:${technology.category}`, capabilities: technology.capabilities });
    if (technology.capabilities["connection-lifecycle"] !== undefined) entities.push({ id: technology.id, selector: "technology:database-client", capabilities: technology.capabilities });
    if (technology.capabilities["state-location"] !== undefined) entities.push({ id: technology.id, selector: "technology:session-store", capabilities: technology.capabilities });
  }
  for (const deployment of spec.deployments) entities.push({ id: deployment.id, selector: "deployment", capabilities: deployment.capabilities });
  for (const requirement of spec.requirements) entities.push({ id: requirement.id, selector: "requirement", capabilities: requirement.capabilities });
  for (const boundary of spec.interfaces) if (boundary.capabilities["streaming-protocol"] !== undefined) entities.push({ id: boundary.id, selector: "interface:stream", capabilities: boundary.capabilities });
  return entities;
}

function findEdgeForRule(rule: RuleFinding, edges: CompatibilityEdge[]): string {
  const affected = new Set(rule.affectedIds);
  const matching = edges.find((edge) => affected.size === 2 && affected.has(edge.sourceId) && affected.has(edge.targetId));
  return matching?.id ?? `rule-${rule.ruleId}-${rule.affectedIds.join("+") || "global"}`;
}

function ruleCorrection(rule: RuleFinding, edge: CompatibilityEdge | undefined, index: number): CompatibilityCorrection {
  const correction = rule.corrections[index];
  return {
    id: `${rule.ruleId}-${correction.id}`,
    kind: correction.kind,
    description: correction.description,
    affectedIds: rule.affectedIds,
    migrationCost: correction.kind === "configuration" ? "low" : correction.kind === "adapter" || correction.kind === "version" ? "medium" : "high",
    operationalOwner: "Architecture owner",
    risks: [`Correction must be validated against ${edge?.id ?? rule.ruleId}.`],
    restoresRequirementIds: [],
  };
}

function primaryEvidenceFor(edge: CompatibilityEdge, evidenceIds: string[], evidence: Map<string, EvidenceRecord>): boolean {
  return evidenceIds.some((id) => {
    const record = evidence.get(id);
    return record !== undefined && PRIMARY_SOURCES.has(record.sourceType) && record.supports.includes(edge.id);
  });
}

function hasContradiction(edge: CompatibilityEdge, evidence: EvidenceRecord[]): boolean {
  return evidence.some((record) => record.contradicts.includes(edge.id));
}

function normalizeFinding(finding: CompatibilityFinding, edge: CompatibilityEdge | undefined, evidence: Map<string, EvidenceRecord>, allEvidence: EvidenceRecord[]): CompatibilityFinding {
  let status = finding.status;
  const contradiction = edge ? hasContradiction(edge, allEvidence) : false;
  if (status === "verified_compatible" && (!edge || !primaryEvidenceFor(edge, finding.evidenceIds, evidence))) status = "unverified";
  if (status === "verified_compatible" && contradiction) status = "conditional";
  return {
    ...finding,
    status,
    confidence: status === "unverified" ? "low" : contradiction ? "medium" : finding.confidence,
    corrections: [...finding.corrections].sort((left, right) => CORRECTION_PRIORITY[left.kind] - CORRECTION_PRIORITY[right.kind] || left.id.localeCompare(right.id)),
  };
}

function mergeFinding(existing: CompatibilityFinding, incoming: CompatibilityFinding): CompatibilityFinding {
  const status = STATUS_PRIORITY[incoming.status] < STATUS_PRIORITY[existing.status] ? incoming.status : existing.status;
  const corrections = new Map(existing.corrections.map((correction) => [correction.id, correction]));
  for (const correction of incoming.corrections) {
    if (![...corrections.values()].some((current) => current.kind === correction.kind)) corrections.set(correction.id, correction);
  }
  return {
    ...existing,
    status,
    affectedIds: [...new Set([...existing.affectedIds, ...incoming.affectedIds])].sort(),
    evidenceIds: [...new Set([...existing.evidenceIds, ...incoming.evidenceIds])].sort(),
    corrections: [...corrections.values()].sort((left, right) => CORRECTION_PRIORITY[left.kind] - CORRECTION_PRIORITY[right.kind] || left.id.localeCompare(right.id)),
    issue: existing.issue || incoming.issue,
    impact: existing.impact || incoming.impact,
  };
}

export function evaluateCompatibility(spec: BlueprintSpec, ruleSet: CapabilityRuleSet): CompatibilityReport {
  const edges = buildCompatibilityEdges(spec);
  const edgeMap = new Map(edges.map((edge) => [edge.id, edge]));
  const evidence = new Map(spec.evidence.map((record) => [record.id, record]));
  const findings = new Map<string, CompatibilityFinding>();

  for (const finding of spec.findings) {
    const normalized = normalizeFinding(finding, edgeMap.get(finding.edgeId), evidence, spec.evidence);
    findings.set(finding.edgeId, normalized);
  }

  const context: CapabilityContext = { entities: capabilityEntities(spec) };
  for (const rule of evaluateCapabilityRules(context, ruleSet)) {
    const id = findEdgeForRule(rule, edges);
    const edge = edgeMap.get(id);
    const incoming: CompatibilityFinding = {
      id: `finding-${rule.ruleId}`,
      edgeId: id,
      status: rule.status,
      affectedIds: rule.affectedIds,
      issue: rule.issue,
      impact: rule.impact,
      evidenceIds: [],
      confidence: "high",
      corrections: rule.corrections.map((_, index) => ruleCorrection(rule, edge, index)),
    };
    findings.set(id, findings.has(id) ? mergeFinding(findings.get(id)!, incoming) : incoming);
  }

  for (const edge of edges) {
    if (findings.has(edge.id)) continue;
    findings.set(edge.id, {
      id: `finding-unverified-${edge.id.slice(5)}`,
      edgeId: edge.id,
      status: "unverified",
      affectedIds: [edge.sourceId, edge.targetId],
      issue: "No deterministic rule and primary evidence establish this relationship.",
      impact: "Compatibility must be verified before implementation or deployment.",
      evidenceIds: [],
      confidence: "low",
      corrections: [],
    });
  }

  const finalFindings = [...findings.values()]
    .map((finding) => normalizeFinding(finding, edgeMap.get(finding.edgeId), evidence, spec.evidence))
    .sort((left, right) => left.edgeId.localeCompare(right.edgeId) || left.id.localeCompare(right.id));
  const findingsByEdge = new Map(finalFindings.map((finding) => [finding.edgeId, finding]));
  const uncoveredEdges = edges.filter((edge) => !findingsByEdge.has(edge.id)).map((edge) => edge.id);
  return { edges, findings: finalFindings, findingsByEdge, uncoveredEdges };
}
