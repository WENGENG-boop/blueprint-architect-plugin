import type { CapabilityValue, CorrectionKind, FindingStatus } from "./blueprint-types.ts";

export type CapabilityOperator = "equals" | "not_equals" | "includes" | "exists" | "less_than" | "greater_than_or_equal";

export interface CapabilityEntity {
  id: string;
  selector: string;
  capabilities: Record<string, CapabilityValue>;
}

export interface CapabilityContext {
  entities: CapabilityEntity[];
}

export interface CapabilityClause {
  selector: string;
  capability: string;
  operator: CapabilityOperator;
  value: CapabilityValue;
}

export interface RuleCorrection {
  id: string;
  kind: CorrectionKind;
  description: string;
}

export interface CapabilityRule {
  id: string;
  severity: "info" | "warning" | "error";
  all: CapabilityClause[];
  any: CapabilityClause[];
  result: {
    status: Exclude<FindingStatus, "verified_compatible">;
    issue: string;
    impact: string;
    corrections: RuleCorrection[];
  };
}

export interface CapabilityRuleSet {
  version: 1;
  rules: CapabilityRule[];
}

export interface RuleFinding {
  ruleId: string;
  severity: CapabilityRule["severity"];
  status: CapabilityRule["result"]["status"];
  affectedIds: string[];
  issue: string;
  impact: string;
  corrections: RuleCorrection[];
}

const OPERATORS = new Set<CapabilityOperator>(["equals", "not_equals", "includes", "exists", "less_than", "greater_than_or_equal"]);
const STATUSES = new Set(["conditional", "conflict", "insufficient_input", "unverified"]);
const CORRECTION_KINDS = new Set<CorrectionKind>(["configuration", "adapter", "version", "isolation", "replacement"]);
const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${path} must be a non-empty string`);
}

function parseClause(input: unknown, path: string): CapabilityClause {
  if (!isRecord(input)) throw new Error(`${path} must be an object`);
  requireString(input.selector, `${path}.selector`);
  requireString(input.capability, `${path}.capability`);
  requireString(input.operator, `${path}.operator`);
  if (!OPERATORS.has(input.operator as CapabilityOperator)) throw new Error(`${path}.operator is not supported: ${input.operator}`);
  if (!("value" in input)) throw new Error(`${path}.value is required`);
  return input as unknown as CapabilityClause;
}

export function parseCapabilityRules(input: string): CapabilityRuleSet {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("capability-rules.yaml must use JSON-compatible YAML syntax");
  }
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.rules)) throw new Error("capability rules require version 1 and a rules array");
  const ids = new Set<string>();
  const rules = parsed.rules.map((item, index) => {
    const path = `rules[${index}]`;
    if (!isRecord(item)) throw new Error(`${path} must be an object`);
    requireString(item.id, `${path}.id`);
    if (ids.has(item.id)) throw new Error(`duplicate capability rule id: ${item.id}`);
    ids.add(item.id);
    if (!new Set(["info", "warning", "error"]).has(String(item.severity))) throw new Error(`${path}.severity is invalid`);
    const all = Array.isArray(item.all) ? item.all.map((clause, clauseIndex) => parseClause(clause, `${path}.all[${clauseIndex}]`)) : [];
    const any = Array.isArray(item.any) ? item.any.map((clause, clauseIndex) => parseClause(clause, `${path}.any[${clauseIndex}]`)) : [];
    if (all.length === 0 && any.length === 0) throw new Error(`${path} requires all or any clauses`);
    if (!isRecord(item.result)) throw new Error(`${path}.result must be an object`);
    requireString(item.result.status, `${path}.result.status`);
    if (!STATUSES.has(item.result.status)) throw new Error(`${path}.result.status cannot claim verified compatibility`);
    requireString(item.result.issue, `${path}.result.issue`);
    requireString(item.result.impact, `${path}.result.impact`);
    if (!Array.isArray(item.result.corrections)) throw new Error(`${path}.result.corrections must be an array`);
    const corrections = item.result.corrections.map((correction, correctionIndex) => {
      const correctionPath = `${path}.result.corrections[${correctionIndex}]`;
      if (!isRecord(correction)) throw new Error(`${correctionPath} must be an object`);
      requireString(correction.id, `${correctionPath}.id`);
      requireString(correction.kind, `${correctionPath}.kind`);
      requireString(correction.description, `${correctionPath}.description`);
      if (!CORRECTION_KINDS.has(correction.kind as CorrectionKind)) throw new Error(`${correctionPath}.kind is invalid`);
      return correction as unknown as RuleCorrection;
    });
    return { ...item, all, any, result: { ...item.result, corrections } } as unknown as CapabilityRule;
  });
  return { version: 1, rules };
}

function compare(actual: CapabilityValue | undefined, clause: CapabilityClause): boolean {
  switch (clause.operator) {
    case "exists": return (actual !== undefined) === Boolean(clause.value);
    case "equals": return actual === clause.value;
    case "not_equals": return actual !== undefined && actual !== clause.value;
    case "includes": return Array.isArray(actual) ? actual.includes(String(clause.value)) : typeof actual === "string" && actual.includes(String(clause.value));
    case "less_than": return typeof actual === "number" && typeof clause.value === "number" && actual < clause.value;
    case "greater_than_or_equal": return typeof actual === "number" && typeof clause.value === "number" && actual >= clause.value;
  }
}

function matchClause(context: CapabilityContext, clause: CapabilityClause): string[] {
  return context.entities
    .filter((entity) => entity.selector === clause.selector && compare(entity.capabilities[clause.capability], clause))
    .map((entity) => entity.id);
}

export function evaluateCapabilityRules(context: CapabilityContext, ruleSet: CapabilityRuleSet): RuleFinding[] {
  const findings: RuleFinding[] = [];
  for (const rule of ruleSet.rules) {
    const allMatches = rule.all.map((clause) => matchClause(context, clause));
    if (allMatches.some((matches) => matches.length === 0)) continue;
    const anyMatches = rule.any.map((clause) => matchClause(context, clause));
    if (anyMatches.length > 0 && anyMatches.every((matches) => matches.length === 0)) continue;
    const affectedIds = [...new Set([...allMatches.flat(), ...anyMatches.flat()])].sort();
    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      status: rule.result.status,
      affectedIds,
      issue: rule.result.issue,
      impact: rule.result.impact,
      corrections: rule.result.corrections,
    });
  }
  return findings.sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] || left.ruleId.localeCompare(right.ruleId));
}

export function capabilityContext(entries: Record<string, Record<string, CapabilityValue>>): CapabilityContext {
  return {
    entities: Object.entries(entries).map(([selector, capabilities]) => ({ id: selector, selector, capabilities })),
  };
}
