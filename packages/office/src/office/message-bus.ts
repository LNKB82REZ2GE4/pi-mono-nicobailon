import { randomUUID } from "node:crypto";
import type { AuditEvent, MessageThread, OfficeMessage, OfficeMessageTarget } from "../core/types.js";
import { auditStore } from "../persistence/store.js";

export interface SendOfficeMessageInput {
	threadId: string;
	correlationId: string;
	from: OfficeMessageTarget;
	to: OfficeMessageTarget;
	subject: string;
	body: string;
}

export class OfficeMessageBus {
	async ensureThread(thread: MessageThread): Promise<void> {
		await auditStore.upsertThread({
			...thread,
			updatedAt: new Date().toISOString(),
		});
	}

	async send(input: SendOfficeMessageInput): Promise<OfficeMessage> {
		const message: OfficeMessage = {
			id: randomUUID(),
			threadId: input.threadId,
			correlationId: input.correlationId,
			from: input.from,
			to: input.to,
			subject: input.subject,
			body: input.body,
			createdAt: new Date().toISOString(),
		};

		await auditStore.appendMessage(message);
		await auditStore.appendEvent({
			id: randomUUID(),
			timestamp: new Date().toISOString(),
			eventType: "office.message",
			threadId: message.threadId,
			correlationId: message.correlationId,
			actorId: message.from.id,
			data: {
				subject: message.subject,
				from: message.from,
				to: message.to,
			},
		});

		return message;
	}

	async recordRoute(correlationId: string, threadId: string, route: Record<string, unknown>): Promise<void> {
		await this.recordEvent({
			eventType: "office.route",
			correlationId,
			threadId,
			data: route,
		});
	}

	async recordSpawn(correlationId: string, threadId: string, spawn: Record<string, unknown>): Promise<void> {
		await this.recordEvent({
			eventType: "office.spawn",
			correlationId,
			threadId,
			data: spawn,
		});
	}

	async recordEvent(event: {
		eventType: AuditEvent["eventType"];
		threadId?: string;
		correlationId?: string;
		actorId?: string;
		data: Record<string, unknown>;
	}): Promise<void> {
		await auditStore.appendEvent({
			id: randomUUID(),
			timestamp: new Date().toISOString(),
			eventType: event.eventType,
			threadId: event.threadId,
			correlationId: event.correlationId,
			actorId: event.actorId,
			data: event.data,
		});
	}
}

export const officeMessageBus = new OfficeMessageBus();
