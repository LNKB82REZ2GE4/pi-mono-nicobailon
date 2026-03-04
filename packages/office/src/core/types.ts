/**
 * Core types for The Office package.
 */

// =============================================================================
// Thinking / model policy
// =============================================================================

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export interface ModelFallbackChoice {
	provider?: string;
	model: string;
	thinking?: ThinkingLevel;
}

export interface RoleRoutingPolicy {
	role: string;
	fallbacks: ModelFallbackChoice[];
}

// =============================================================================
// Context modes
// =============================================================================

export type ContextMode = "fresh" | "branched";

export interface BranchedContext {
	gitBranch?: string;
	gitStatus?: string;
	fileSummary?: string;
	decisions?: string[];
	openQuestions?: string[];
	conversationSummary?: string;
}

// =============================================================================
// Spawn modes
// =============================================================================

export type SpawnMode = "subprocess" | "rpc";

// =============================================================================
// Agent and office model
// =============================================================================

export interface AgentConfig {
	id: string;
	name: string;
	role: string;
	model: string;
	provider?: string;
	thinking?: ThinkingLevel;
	tools?: string[];
	extensions?: string[];
	systemPrompt?: string;
	spawnMode: SpawnMode;
	contextMode: ContextMode;
	routingPolicy?: ModelFallbackChoice[];
}

export interface SpecialistTemplate {
	id: string;
	teamId: string;
	role: string;
	name: string;
	description?: string;
	skills: string[];
	systemPrompt: string;
	defaultModel: string;
	defaultProvider?: string;
	fallbacks: ModelFallbackChoice[];
	createdAt: string;
	updatedAt: string;
}

export interface SpecialistInstance {
	id: string;
	templateId: string;
	teamId: string;
	role: string;
	sessionName: string;
	status: "idle" | "running" | "completed" | "failed";
	activeWorkItemId?: string;
	lastWorkSummary?: string;
	createdAt: string;
	updatedAt: string;
}

export interface TeamLead {
	agentId: string;
	teamId: string;
	name: string;
	role: string;
	fallbacks: ModelFallbackChoice[];
}

export interface OfficeTeam {
	id: string;
	name: string;
	description?: string;
	lead: TeamLead;
	members: AgentConfig[];
	specialistTemplates: SpecialistTemplate[];
	routingPolicies: RoleRoutingPolicy[];
	createdAt: string;
	updatedAt: string;
}

export interface OfficeConfig {
	id: string;
	name: string;
	officeManager: AgentConfig;
	teams: OfficeTeam[];
	interactionMode: "routed" | "direct";
	createdAt: string;
	updatedAt: string;
}

// =============================================================================
// Task model
// =============================================================================

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "blocked";

export interface Task {
	id: string;
	title: string;
	description?: string;
	assignee: string;
	status: TaskStatus;
	dependsOn: string[];
	result?: string;
	error?: string;
	startedAt?: string;
	endedAt?: string;
}

export interface WorkItem {
	id: string;
	title: string;
	description: string;
	teamId?: string;
	assigneeRole?: string;
	status: TaskStatus;
	correlationId: string;
	threadId: string;
	createdAt: string;
	updatedAt: string;
}

export interface Delegation {
	id: string;
	fromRole: string;
	toRole: string;
	workItemId: string;
	threadId: string;
	correlationId: string;
	createdAt: string;
}

// =============================================================================
// Team/workflow compatibility model
// =============================================================================

export type HumanRole = "observer" | "approver" | "participant" | "configurable";
export type PersistenceMode = "none" | "disk";

export interface TeamConfig {
	id: string;
	name: string;
	description?: string;
	members: AgentConfig[];
	persistence: PersistenceMode;
	humanRole: HumanRole;
	approvalTriggers?: string[];
	createdAt: string;
	updatedAt: string;
}

export type WorkflowStatus = "running" | "paused" | "completed" | "failed";

export interface AgentState {
	agentId: string;
	currentTaskId?: string;
	tokens: number;
	toolCalls: number;
	lastActivity: string;
}

export interface WorkflowCheckpoint {
	timestamp: string;
	completedTasks: string[];
	pendingTasks: string[];
	runningTasks: string[];
	agentStates: Record<string, AgentState>;
}

export interface Workflow {
	id: string;
	teamId?: string;
	tasks: Task[];
	status: WorkflowStatus;
	checkpoint?: WorkflowCheckpoint;
	createdAt: string;
	updatedAt: string;
}

// =============================================================================
// Orchestration modes
// =============================================================================

export type ExecutionMode = "chain" | "parallel" | "team";

export interface ChainStep {
	agent: string;
	task: string;
	model?: string;
	thinking?: ThinkingLevel;
}

export interface ParallelTask {
	agent: string;
	task: string;
	name?: string;
	model?: string;
	thinking?: ThinkingLevel;
}

export interface TeamTask {
	title: string;
	description?: string;
	assignee: string;
	dependsOn?: string[];
}

export interface OrchestrateParams {
	mode: ExecutionMode;
	chain?: ChainStep[];
	tasks?: ParallelTask[];
	concurrency?: number;
	team?: {
		teamId?: string;
		name?: string;
		members?: AgentConfig[];
		tasks: TeamTask[];
	};
	timeout?: number;
	onPause?: "wait" | "notify";
}

// =============================================================================
// Execution results
// =============================================================================

export interface Usage {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
	turns: number;
}

export interface AgentResult {
	agentId: string;
	agentName: string;
	task: string;
	exitCode: number;
	output: string;
	truncated: boolean;
	durationMs: number;
	usage: Usage;
	error?: string;
}

export interface ChainResult {
	mode: "chain";
	steps: AgentResult[];
	totalDurationMs: number;
	totalUsage: Usage;
}

export interface ParallelResult {
	mode: "parallel";
	results: AgentResult[];
	succeeded: number;
	failed: number;
	totalDurationMs: number;
	totalUsage: Usage;
}

export interface TeamResult {
	mode: "team";
	workflowId: string;
	results: AgentResult[];
	completed: number;
	failed: number;
	blocked: number;
	totalDurationMs: number;
	totalUsage: Usage;
}

export type OrchestrateResult = ChainResult | ParallelResult | TeamResult;

// =============================================================================
// Progress
// =============================================================================

export type AgentProgressStatus = "pending" | "running" | "completed" | "failed";

export interface AgentProgress {
	agentId: string;
	agentName: string;
	status: AgentProgressStatus;
	task: string;
	currentTool?: string;
	currentToolArgs?: string;
	recentTools: Array<{ tool: string; args: string; timestamp: string }>;
	recentOutput: string[];
	toolCount: number;
	tokens: number;
	durationMs: number;
	error?: string;
}

// =============================================================================
// Office messaging/audit
// =============================================================================

export type OfficeMessageTargetType = "office-manager" | "team-lead" | "specialist" | "user";

export interface OfficeMessageTarget {
	type: OfficeMessageTargetType;
	id: string;
}

export interface OfficeMessage {
	id: string;
	threadId: string;
	correlationId: string;
	from: OfficeMessageTarget;
	to: OfficeMessageTarget;
	subject: string;
	body: string;
	createdAt: string;
}

export interface AuditEvent {
	id: string;
	timestamp: string;
	eventType:
		| "office.message"
		| "office.route"
		| "office.spawn"
		| "office.interaction-mode"
		| "office.workflow-start"
		| "office.workflow-end";
	threadId?: string;
	correlationId?: string;
	actorId?: string;
	data: Record<string, unknown>;
}

export interface MessageThread {
	id: string;
	correlationId: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	participants: OfficeMessageTarget[];
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_CONCURRENCY = 4;
export const MAX_CONCURRENCY = 8;
export const DEFAULT_TIMEOUT_MS = 600000; // 10 minutes
export const MAX_OUTPUT_BYTES = 50 * 1024; // 50KB
export const MAX_OUTPUT_LINES = 500;
