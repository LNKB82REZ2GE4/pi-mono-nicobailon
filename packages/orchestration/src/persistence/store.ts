/**
 * Persistence for teams and workflows.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { TeamConfig, Workflow, WorkflowCheckpoint } from "../core/types.js";

// =============================================================================
// Storage Paths
// =============================================================================

function getStorageDir(): string {
	const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
	return path.join(home, ".pi", "agent", "orchestration");
}

function getTeamsDir(): string {
	return path.join(getStorageDir(), "teams");
}

function getWorkflowsDir(): string {
	return path.join(getStorageDir(), "workflows");
}

// =============================================================================
// Team Persistence
// =============================================================================

export interface TeamStore {
	/** Save a team configuration */
	save(team: TeamConfig): Promise<void>;

	/** Load a team by ID */
	load(id: string): Promise<TeamConfig | null>;

	/** List all saved teams */
	list(): Promise<TeamConfig[]>;

	/** Delete a team */
	delete(id: string): Promise<void>;
}

class FileSystemTeamStore implements TeamStore {
	private dir: string;

	constructor() {
		this.dir = getTeamsDir();
	}

	private ensureDir(): void {
		if (!fs.existsSync(this.dir)) {
			fs.mkdirSync(this.dir, { recursive: true });
		}
	}

	private getFilePath(id: string): string {
		return path.join(this.dir, `${id}.json`);
	}

	async save(team: TeamConfig): Promise<void> {
		this.ensureDir();
		const filePath = this.getFilePath(team.id);
		fs.writeFileSync(filePath, JSON.stringify(team, null, 2), "utf-8");
	}

	async load(id: string): Promise<TeamConfig | null> {
		const filePath = this.getFilePath(id);
		if (!fs.existsSync(filePath)) {
			return null;
		}
		const content = fs.readFileSync(filePath, "utf-8");
		return JSON.parse(content) as TeamConfig;
	}

	async list(): Promise<TeamConfig[]> {
		if (!fs.existsSync(this.dir)) {
			return [];
		}
		const files = fs.readdirSync(this.dir).filter((f) => f.endsWith(".json"));
		const teams: TeamConfig[] = [];
		for (const file of files) {
			const content = fs.readFileSync(path.join(this.dir, file), "utf-8");
			teams.push(JSON.parse(content) as TeamConfig);
		}
		return teams;
	}

	async delete(id: string): Promise<void> {
		const filePath = this.getFilePath(id);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}
}

// =============================================================================
// Workflow Persistence
// =============================================================================

export interface WorkflowStore {
	/** Save a workflow state */
	save(workflow: Workflow): Promise<void>;

	/** Load a workflow by ID */
	load(id: string): Promise<Workflow | null>;

	/** List all workflows (optionally filter by status) */
	list(status?: "running" | "paused" | "completed" | "failed"): Promise<Workflow[]>;

	/** Delete a workflow */
	delete(id: string): Promise<void>;
}

class FileSystemWorkflowStore implements WorkflowStore {
	private dir: string;

	constructor() {
		this.dir = getWorkflowsDir();
	}

	private ensureDir(): void {
		if (!fs.existsSync(this.dir)) {
			fs.mkdirSync(this.dir, { recursive: true });
		}
	}

	private getFilePath(id: string): string {
		return path.join(this.dir, `${id}.json`);
	}

	async save(workflow: Workflow): Promise<void> {
		this.ensureDir();
		const filePath = this.getFilePath(workflow.id);
		workflow.updatedAt = new Date().toISOString();
		fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), "utf-8");
	}

	async load(id: string): Promise<Workflow | null> {
		const filePath = this.getFilePath(id);
		if (!fs.existsSync(filePath)) {
			return null;
		}
		const content = fs.readFileSync(filePath, "utf-8");
		return JSON.parse(content) as Workflow;
	}

	async list(status?: "running" | "paused" | "completed" | "failed"): Promise<Workflow[]> {
		if (!fs.existsSync(this.dir)) {
			return [];
		}
		const files = fs.readdirSync(this.dir).filter((f) => f.endsWith(".json"));
		const workflows: Workflow[] = [];
		for (const file of files) {
			const content = fs.readFileSync(path.join(this.dir, file), "utf-8");
			const workflow = JSON.parse(content) as Workflow;
			if (!status || workflow.status === status) {
				workflows.push(workflow);
			}
		}
		return workflows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}

	async delete(id: string): Promise<void> {
		const filePath = this.getFilePath(id);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}
}

// =============================================================================
// Singletons
// =============================================================================

export const teamStore: TeamStore = new FileSystemTeamStore();
export const workflowStore: WorkflowStore = new FileSystemWorkflowStore();

// =============================================================================
// Checkpoint Helpers
// =============================================================================

export function createCheckpoint(workflow: Workflow): WorkflowCheckpoint {
	const completedTasks: string[] = [];
	const pendingTasks: string[] = [];
	const runningTasks: string[] = [];
	const agentStates: Record<
		string,
		{ agentId: string; currentTaskId?: string; tokens: number; toolCalls: number; lastActivity: string }
	> = {};

	for (const task of workflow.tasks) {
		switch (task.status) {
			case "completed":
				completedTasks.push(task.id);
				break;
			case "running":
				runningTasks.push(task.id);
				break;
			case "pending":
			case "blocked":
				pendingTasks.push(task.id);
				break;
		}
	}

	return {
		timestamp: new Date().toISOString(),
		completedTasks,
		pendingTasks,
		runningTasks,
		agentStates,
	};
}

export function restoreFromCheckpoint(workflow: Workflow, checkpoint: WorkflowCheckpoint): void {
	// Reset tasks based on checkpoint
	for (const task of workflow.tasks) {
		if (checkpoint.completedTasks.includes(task.id)) {
			task.status = "completed";
		} else if (checkpoint.runningTasks.includes(task.id)) {
			task.status = "pending"; // Reset running tasks to pending
		} else if (checkpoint.pendingTasks.includes(task.id)) {
			task.status = "pending";
		}
	}
}
