export type CapabilityValue = string | number | boolean | string[];
export type Capabilities = Record<string, CapabilityValue>;

export type FindingStatus =
  | "verified_compatible"
  | "conditional"
  | "conflict"
  | "insufficient_input"
  | "unverified";

export type CorrectionKind = "configuration" | "adapter" | "version" | "isolation" | "replacement";
export type EvidenceSourceType = "official_docs" | "official_repository" | "package_metadata" | "community" | "local_rule";

export interface ProjectDefinition {
  id: string;
  name: string;
  description: string;
  problem: string;
  goals: string[];
  nonGoals: string[];
  assumptions: string[];
  constraints: string[];
}

export interface RequirementDefinition {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  capabilities: Capabilities;
}

export interface TechnologyDefinition {
  id: string;
  name: string;
  category: string;
  version?: string;
  runtimeId?: string;
  deploymentIds: string[];
  dependencyIds: string[];
  capabilities: Capabilities;
  source: "confirmed" | "assumed" | "provisional";
  confidence: "high" | "medium" | "low";
}

export interface DeploymentDefinition {
  id: string;
  name: string;
  type: string;
  technologyIds: string[];
  capabilities: Capabilities;
  constraints: string[];
}

export interface TestObligation {
  id: string;
  kind: "unit" | "integration" | "contract" | "end-to-end" | "security" | "operational";
  description: string;
  requirementIds: string[];
}

export interface ModuleDefinition {
  id: string;
  name: string;
  path: string;
  responsibilities: string[];
  ownedData: string[];
  technologyIds: string[];
  requirementIds: string[];
  dependencyIds: string[];
  interfaceIds: string[];
  dataFlowIds: string[];
  failureModes: string[];
  security: string[];
  privacy: string[];
  configuration: string[];
  tests: TestObligation[];
}

export interface InterfaceDefinition {
  id: string;
  name: string;
  moduleId: string;
  consumerModuleIds: string[];
  transport: string;
  method?: string;
  path?: string;
  request: string;
  response: string;
  errors: string[];
  authentication: string;
  idempotency: string;
  versioning: string;
  requirementIds: string[];
  capabilities: Capabilities;
}

export interface DataFlowDefinition {
  id: string;
  name: string;
  fromId: string;
  toId: string;
  description: string;
  data: string[];
  requirementIds: string[];
}

export interface EvidenceRecord {
  id: string;
  sourceType: EvidenceSourceType;
  url?: string;
  localReference?: string;
  subject: string;
  versionRange: string;
  retrievedAt: string;
  claim: string;
  supports: string[];
  contradicts: string[];
}

export interface CompatibilityCorrection {
  id: string;
  kind: CorrectionKind;
  description: string;
  affectedIds: string[];
  migrationCost: "low" | "medium" | "high";
  operationalOwner: string;
  risks: string[];
  restoresRequirementIds: string[];
}

export interface CompatibilityFinding {
  id: string;
  edgeId: string;
  status: FindingStatus;
  affectedIds: string[];
  issue: string;
  impact: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
  corrections: CompatibilityCorrection[];
}

export interface UnresolvedItem {
  id: string;
  description: string;
  affectedIds: string[];
  requiredFrom: string;
}

export interface BlueprintSpec {
  schemaVersion: 1;
  project: ProjectDefinition;
  requirements: RequirementDefinition[];
  technologies: TechnologyDefinition[];
  deployments: DeploymentDefinition[];
  modules: ModuleDefinition[];
  interfaces: InterfaceDefinition[];
  dataFlows: DataFlowDefinition[];
  evidence: EvidenceRecord[];
  findings: CompatibilityFinding[];
  unresolved: UnresolvedItem[];
}

export interface GenerationResult {
  targetDir: string;
  manifest: string[];
}
