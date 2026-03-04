/**
 * Persistence for The Office package.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type {
	AuditEvent,
	MessageThread,
	OfficeConfig,
	OfficeMessage,
	TeamConfig,
	Workflow,
	WorkflowCheckpoint,
} from "../core/types.js";

function getStorageDir(): string {
	const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
	return path.join(home, ".pi", "agent", "the-office");
}

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function readJson<T>(filePath: string, fallback: T): T {
	if (!fs.existsSync(filePath)) return fallback;
	return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function writeJson(filePath: string, data: unknown): void {
	ensureDir(path.dirname(filePath));
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function getTeamsDir(): string {
	return path.join(getStorageDir(), "teams");
}

function getWorkflowsDir(): string {
	return path.join(getStorageDir(), "workflows");
}

function getOfficeDir(): string {
	return path.join(getStorageDir(), "office");
}

function getAuditFile(): string {
	return path.join(getStorageDir(), "audit", "events.jsonl");
}

function getMessagesFile(): string {
	return path.join(getStorageDir(), "audit", "messages.jsonl");
}

function getThreadsFile(): string {
	return path.join(getStorageDir(), "audit", "threads.json");
}

// =============================================================================
// Team persistence
// =============================================================================

export interface TeamStore {
	save(team: TeamConfig): Promise<void>;
	load(id: string): Promise<TeamConfig | null>;
	list(): Promise<TeamConfig[]>;
	delete(id: string): Promise<void>;
}

class FileSystemTeamStore implements TeamStore {
	private dir = getTeamsDir();

	private getFilePath(id: string): string {
		return path.join(this.dir, `${id}.json`);
	}

	async save(team: TeamConfig): Promise<void> {
		writeJson(this.getFilePath(team.id), team);
	}

	async load(id: string): Promise<TeamConfig | null> {
		return readJson<TeamConfig | null>(this.getFilePath(id), null);
	}

	async list(): Promise<TeamConfig[]> {
		if (!fs.existsSync(this.dir)) return [];
		return fs
			.readdirSync(this.dir)
			.filter((f) => f.endsWith(".json"))
			.map((f) => readJson<TeamConfig>(path.join(this.dir, f), {} as TeamConfig));
	}

	async delete(id: string): Promise<void> {
		const filePath = this.getFilePath(id);
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
	}
}

// =============================================================================
// Workflow persistence
// =============================================================================

export interface WorkflowStore {
	save(workflow: Workflow): Promise<void>;
	load(id: string): Promise<Workflow | null>;
	list(status?: "running" | "paused" | "completed" | "failed"): Promise<Workflow[]>;
	delete(id: string): Promise<void>;
}

class FileSystemWorkflowStore implements WorkflowStore {
	private dir = getWorkflowsDir();

	private getFilePath(id: string): string {
		return path.join(this.dir, `${id}.json`);
	}

	async save(workflow: Workflow): Promise<void> {
		workflow.updatedAt = new Date().toISOString();
		writeJson(this.getFilePath(workflow.id), workflow);
	}

	async load(id: string): Promise<Workflow | null> {
		return readJson<Workflow | null>(this.getFilePath(id), null);
	}

	async list(status?: "running" | "paused" | "completed" | "failed"): Promise<Workflow[]> {
		if (!fs.existsSync(this.dir)) return [];
		const workflows = fs
			.readdirSync(this.dir)
			.filter((f) => f.endsWith(".json"))
			.map((f) => readJson<Workflow>(path.join(this.dir, f), {} as Workflow));
		return workflows
			.filter((workflow) => !status || workflow.status === status)
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}

	async delete(id: string): Promise<void> {
		const filePath = this.getFilePath(id);
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
	}
}

// =============================================================================
// Office configuration persistence
// =============================================================================

export interface OfficeStore {
	save(config: OfficeConfig): Promise<void>;
	load(id: string): Promise<OfficeConfig | null>;
	getDefault(): Promise<OfficeConfig | null>;
	list(): Promise<OfficeConfig[]>;
}

class FileSystemOfficeStore implements OfficeStore {
	private dir = getOfficeDir();

	private getFilePath(id: string): string {
		return path.join(this.dir, `${id}.json`);
	}

	async save(config: OfficeConfig): Promise<void> {
		config.updatedAt = new Date().toISOString();
		writeJson(this.getFilePath(config.id), config);
	}

	async load(id: string): Promise<OfficeConfig | null> {
		return readJson<OfficeConfig | null>(this.getFilePath(id), null);
	}

	async getDefault(): Promise<OfficeConfig | null> {
		const offices = await this.list();
		return offices.length > 0 ? offices[0] : null;
	}

	async list(): Promise<OfficeConfig[]> {
		if (!fs.existsSync(this.dir)) return [];
		return fs
			.readdirSync(this.dir)
			.filter((f) => f.endsWith(".json"))
			.map((f) => readJson<OfficeConfig>(path.join(this.dir, f), {} as OfficeConfig))
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}
}

// =============================================================================
// Audit/message persistence
// =============================================================================

export interface AuditStore {
	appendEvent(event: AuditEvent): Promise<void>;
	listEvents(limit?: number): Promise<AuditEvent[]>;
	appendMessage(message: OfficeMessage): Promise<void>;
	listMessages(threadId?: string, limit?: number): Promise<OfficeMessage[]>;
	upsertThread(thread: MessageThread): Promise<void>;
	listThreads(): Promise<MessageThread[]>;
}

class FileSystemAuditStore implements AuditStore {
	async appendEvent(event: AuditEvent): Promise<void> {
		ensureDir(path.dirname(getAuditFile()));
		fs.appendFileSync(getAuditFile(), `${JSON.stringify(event)}\n`, "utf-8");
	}

	async listEvents(limit: number = 200): Promise<AuditEvent[]> {
		if (!fs.existsSync(getAuditFile())) return [];
		const lines = fs
			.readFileSync(getAuditFile(), "utf-8")
			.split("\n")
			.filter((line) => line.trim().length > 0);
		return lines
			.slice(-limit)
			.map((line) => JSON.parse(line) as AuditEvent)
			.reverse();
	}

	async appendMessage(message: OfficeMessage): Promise<void> {
		ensureDir(path.dirname(getMessagesFile()));
		fs.appendFileSync(getMessagesFile(), `${JSON.stringify(message)}\n`, "utf-8");
	}

	async listMessages(threadId?: string, limit: number = 200): Promise<OfficeMessage[]> {
		if (!fs.existsSync(getMessagesFile())) return [];
		const lines = fs
			.readFileSync(getMessagesFile(), "utf-8")
			.split("\n")
			.filter((line) => line.trim().length > 0);
		const messages = lines.map((line) => JSON.parse(line) as OfficeMessage);
		const filtered = threadId ? messages.filter((m) => m.threadId === threadId) : messages;
		return filtered.slice(-limit).reverse();
	}

	async upsertThread(thread: MessageThread): Promise<void> {
		const existing = await this.listThreads();
		const idx = existing.findIndex((item) => item.id === thread.id);
		if (idx >= 0) existing[idx] = thread;
		else existing.push(thread);
		writeJson(getThreadsFile(), existing);
	}

	async listThreads(): Promise<MessageThread[]> {
		return readJson<MessageThread[]>(getThreadsFile(), []);
	}
}

// =============================================================================
// Session naming persistence
// =============================================================================

export interface SessionNamingStore {
	nextInstanceNumber(teamId: string, role: string, templateId: string): Promise<number>;
}

class FileSystemSessionNamingStore implements SessionNamingStore {
	private filePath = path.join(getStorageDir(), "office", "instance-counters.json");

	async nextInstanceNumber(teamId: string, role: string, templateId: string): Promise<number> {
		const key = `${teamId}:${role}:${templateId}`;
		const counters = readJson<Record<string, number>>(this.filePath, {});
		const next = (counters[key] ?? 0) + 1;
		counters[key] = next;
		writeJson(this.filePath, counters);
		return next;
	}
}

// =============================================================================
// Singletons
// =============================================================================

export const teamStore: TeamStore = new FileSystemTeamStore();
export const workflowStore: WorkflowStore = new FileSystemWorkflowStore();
export const officeStore: OfficeStore = new FileSystemOfficeStore();
export const auditStore: AuditStore = new FileSystemAuditStore();
export const sessionNamingStore: SessionNamingStore = new FileSystemSessionNamingStore();

// =============================================================================
// Checkpoint helpers
// =============================================================================

export function createCheckpoint(workflow: Workflow): WorkflowCheckpoint {
	const completedTasks: string[] = [];
	const pendingTasks: string[] = [];
	const runningTasks: string[] = [];
	const agentStates = {};

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
	for (const task of workflow.tasks) {
		if (checkpoint.completedTasks.includes(task.id)) {
			task.status = "completed";
		} else if (checkpoint.runningTasks.includes(task.id) || checkpoint.pendingTasks.includes(task.id)) {
			task.status = "pending";
		}
	}
}
