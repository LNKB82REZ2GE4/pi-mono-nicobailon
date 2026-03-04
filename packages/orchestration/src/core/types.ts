/**
 * Core types for the orchestration package.
 */

// =============================================================================
// Thinking Levels
// =============================================================================

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

// =============================================================================
// Context Modes
// =============================================================================

export type ContextMode = "fresh" | "branched";

export interface BranchedContext {
	/** Git branch name */
	gitBranch?: string;
	/** Git status summary */
	gitStatus?: string;
	/** Summary of recent file operations */
	fileSummary?: string;
	/** Key decisions made in parent session */
	decisions?: string[];
	/** Open questions from parent session */
	openQuestions?: string[];
	/** Condensed conversation summary */
	conversationSummary?: string;
}

// =============================================================================
// Spawn Modes
// =============================================================================

export type SpawnMode = "subprocess" | "rpc";

// =============================================================================
// Agent Definition
// =============================================================================

export interface AgentConfig {
	/** Unique identifier for this agent */
	id: string;
	/** Display name */
	name: string;
	/** Custom role name (e.g., "researcher", "implementer") */
	role: string;
	/** Model to use (e.g., "claude-sonnet-4-5") */
	model: string;
	/** Optional provider override */
	provider?: string;
	/** Thinking level */
	thinking?: ThinkingLevel;
	/** Tool whitelist (default: all available) */
	tools?: string[];
	/** Extensions to enable (default: none) */
	extensions?: string[];
	/** Custom system prompt appended to default */
	systemPrompt?: string;
	/** How to spawn this agent */
	spawnMode: SpawnMode;
	/** Context mode for this agent */
	contextMode: ContextMode;
}

// =============================================================================
// Task Definition
// =============================================================================

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "blocked";

export interface Task {
	/** Unique task identifier */
	id: string;
	/** Task title/summary */
	title: string;
	/** Detailed task description */
	description?: string;
	/** Agent ID assigned to this task */
	assignee: string;
	/** Current status */
	status: TaskStatus;
	/** Task IDs this task depends on (DAG) */
	dependsOn: string[];
	/** Task result (when completed) */
	result?: string;
	/** Error message (when failed) */
	error?: string;
	/** Timestamp when started */
	startedAt?: string;
	/** Timestamp when completed/failed */
	endedAt?: string;
}

// =============================================================================
// Team Definition
// =============================================================================

export type HumanRole = "observer" | "approver" | "participant" | "configurable";
export type PersistenceMode = "none" | "disk";

export interface TeamConfig {
	/** Unique team identifier */
	id: string;
	/** Display name */
	name: string;
	/** Description */
	description?: string;
	/** Team members */
	members: AgentConfig[];
	/** Persistence mode */
	persistence: PersistenceMode;
	/** Human's role in this team */
	humanRole: HumanRole;
	/** Actions that require human approval (when humanRole is "approver" or "configurable") */
	approvalTriggers?: string[];
	/** Creation timestamp */
	createdAt: string;
	/** Last update timestamp */
	updatedAt: string;
}

// =============================================================================
// Workflow Definition
// =============================================================================

export type WorkflowStatus = "running" | "paused" | "completed" | "failed";

export interface AgentState {
	/** Agent ID */
	agentId: string;
	/** Current task ID (if any) */
	currentTaskId?: string;
	/** Token usage */
	tokens: number;
	/** Tool call count */
	toolCalls: number;
	/** Last activity timestamp */
	lastActivity: string;
}

export interface WorkflowCheckpoint {
	/** Checkpoint timestamp */
	timestamp: string;
	/** Completed task IDs */
	completedTasks: string[];
	/** Pending task IDs */
	pendingTasks: string[];
	/** Running task IDs */
	runningTasks: string[];
	/** Agent states at checkpoint */
	agentStates: Record<string, AgentState>;
}

export interface Workflow {
	/** Unique workflow identifier */
	id: string;
	/** Team ID (if using team mode) */
	teamId?: string;
	/** Tasks in this workflow */
	tasks: Task[];
	/** Current status */
	status: WorkflowStatus;
	/** Current checkpoint (for resumability) */
	checkpoint?: WorkflowCheckpoint;
	/** Creation timestamp */
	createdAt: string;
	/** Last update timestamp */
	updatedAt: string;
}

// =============================================================================
// Execution Modes
// =============================================================================

export type ExecutionMode = "chain" | "parallel" | "team";

// =============================================================================
// Chain Step
// =============================================================================

export interface ChainStep {
	/** Agent name or ID */
	agent: string;
	/** Task prompt (use {previous} to reference prior output) */
	task: string;
	/** Optional model override */
	model?: string;
	/** Optional thinking level override */
	thinking?: ThinkingLevel;
}

// =============================================================================
// Parallel Task
// =============================================================================

export interface ParallelTask {
	/** Agent name or ID */
	agent: string;
	/** Task prompt */
	task: string;
	/** Optional name for this task */
	name?: string;
	/** Optional model override */
	model?: string;
	/** Optional thinking level override */
	thinking?: ThinkingLevel;
}

// =============================================================================
// Team Task
// =============================================================================

export interface TeamTask {
	/** Task title */
	title: string;
	/** Task description */
	description?: string;
	/** Agent to assign (by name or ID) */
	assignee: string;
	/** Task dependencies (by title or ID) */
	dependsOn?: string[];
}

// =============================================================================
// Orchestration Parameters
// =============================================================================

export interface OrchestrateParams {
	/** Execution mode */
	mode: ExecutionMode;

	// Chain mode
	chain?: ChainStep[];

	// Parallel mode
	tasks?: ParallelTask[];
	concurrency?: number;

	// Team mode
	team?: {
		teamId?: string;
		name?: string;
		members?: AgentConfig[];
		tasks: TeamTask[];
	};

	// Common options
	timeout?: number;
	onPause?: "wait" | "notify";
}

// =============================================================================
// Execution Results
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
	/** Agent ID */
	agentId: string;
	/** Agent name */
	agentName: string;
	/** Task that was executed */
	task: string;
	/** Exit code (0 = success) */
	exitCode: number;
	/** Output text */
	output: string;
	/** Whether output was truncated */
	truncated: boolean;
	/** Duration in milliseconds */
	durationMs: number;
	/** Token usage */
	usage: Usage;
	/** Error message (if failed) */
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
// Progress Tracking
// =============================================================================

export type AgentProgressStatus = "pending" | "running" | "completed" | "failed";

export interface AgentProgress {
	/** Agent ID */
	agentId: string;
	/** Agent name */
	agentName: string;
	/** Current status */
	status: AgentProgressStatus;
	/** Current task */
	task: string;
	/** Current tool being executed */
	currentTool?: string;
	/** Current tool arguments (truncated) */
	currentToolArgs?: string;
	/** Recent tools called */
	recentTools: Array<{ tool: string; args: string; timestamp: string }>;
	/** Recent output lines */
	recentOutput: string[];
	/** Total tool calls */
	toolCount: number;
	/** Token usage */
	tokens: number;
	/** Duration in milliseconds */
	durationMs: number;
	/** Error message (if failed) */
	error?: string;
}

// =============================================================================
// Events
// =============================================================================

export interface OrchestrationEvent {
	type: "agent:start" | "agent:progress" | "agent:complete" | "workflow:paused" | "workflow:resumed";
	timestamp: string;
	data: {
		workflowId?: string;
		agentId?: string;
		task?: string;
		progress?: AgentProgress;
		result?: AgentResult;
		reason?: string;
	};
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_CONCURRENCY = 4;
export const MAX_CONCURRENCY = 8;
export const DEFAULT_TIMEOUT_MS = 600000; // 10 minutes
export const MAX_OUTPUT_BYTES = 50 * 1024; // 50KB
export const MAX_OUTPUT_LINES = 500;
