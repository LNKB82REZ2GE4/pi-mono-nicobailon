import { sessionNamingStore } from "../persistence/store.js";

function slug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")
		.slice(0, 32);
}

function timestampTag(date: Date = new Date()): string {
	const yyyy = date.getUTCFullYear();
	const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(date.getUTCDate()).padStart(2, "0");
	const hh = String(date.getUTCHours()).padStart(2, "0");
	const mi = String(date.getUTCMinutes()).padStart(2, "0");
	const ss = String(date.getUTCSeconds()).padStart(2, "0");
	return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

export interface SessionNameInput {
	team: string;
	role: string;
	template: string;
	shortTask: string;
}

export async function generateOfficeSessionName(input: SessionNameInput): Promise<string> {
	const instance = await sessionNamingStore.nextInstanceNumber(input.team, input.role, input.template);
	const teamSlug = slug(input.team);
	const roleSlug = slug(input.role);
	const templateSlug = slug(input.template);
	const taskSlug = slug(input.shortTask);
	return `office/${teamSlug}/${roleSlug}/${templateSlug}#${instance}-${taskSlug}-${timestampTag()}`;
}
