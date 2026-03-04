import { type Component, Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import type { AgentConfig, OfficeConfig, OfficeTeam } from "../core/types.js";

export interface DashboardScopedModel {
	label: string;
	provider: string;
	model: string;
}

export type OfficeDashboardAction =
	| { type: "create-team" }
	| { type: "edit-role-policy"; teamId: string; role: string }
	| { type: "set-interaction"; mode: "routed" | "direct" }
	| { type: "show-audit" }
	| { type: "apply-role-model"; teamId: string; role: string; provider: string; model: string }
	| { type: "delete-team"; teamId: string }
	| { type: "remove-member"; teamId: string; memberId: string }
	| undefined;

type DashboardPanel = "overview" | "teams" | "members" | "models";

export class OfficeDashboard implements Component {
	private panel: DashboardPanel = "overview";
	private selectedTeamIndex = 0;
	private selectedRoleIndex = 0;
	private selectedModelIndex = 0;
	private selectedMemberIndex = 0;

	constructor(
		private office: OfficeConfig,
		private scopedModels: ReadonlyArray<DashboardScopedModel>,
		private onClose: (action?: OfficeDashboardAction) => void,
	) {}

	private getSelectedTeam(): OfficeTeam | undefined {
		if (this.office.teams.length === 0) return undefined;
		this.selectedTeamIndex = Math.max(0, Math.min(this.selectedTeamIndex, this.office.teams.length - 1));
		return this.office.teams[this.selectedTeamIndex];
	}

	private getTeamMembers(team: OfficeTeam): AgentConfig[] {
		return team.members;
	}

	private getSelectedMember(team: OfficeTeam): AgentConfig | undefined {
		const members = this.getTeamMembers(team);
		if (members.length === 0) return undefined;
		this.selectedMemberIndex = Math.max(0, Math.min(this.selectedMemberIndex, members.length - 1));
		return members[this.selectedMemberIndex];
	}

	private getRoles(team: OfficeTeam): string[] {
		const unique = new Set<string>();
		for (const policy of team.routingPolicies) unique.add(policy.role);
		if (!unique.has(team.lead.role)) unique.add(team.lead.role);
		for (const member of team.members) unique.add(member.role);
		return [...unique];
	}

	private getSelectedRole(team: OfficeTeam): string {
		const roles = this.getRoles(team);
		if (roles.length === 0) return team.lead.role;
		this.selectedRoleIndex = Math.max(0, Math.min(this.selectedRoleIndex, roles.length - 1));
		return roles[this.selectedRoleIndex] ?? team.lead.role;
	}

	private closeWithPolicyAction(): void {
		const team = this.getSelectedTeam();
		if (!team) return;
		this.onClose({ type: "edit-role-policy", teamId: team.id, role: this.getSelectedRole(team) });
	}

	private closeWithDeleteTeamAction(): void {
		const team = this.getSelectedTeam();
		if (!team) return;
		this.onClose({ type: "delete-team", teamId: team.id });
	}

	private closeWithRemoveMemberAction(): void {
		const team = this.getSelectedTeam();
		if (!team) return;
		const member = this.getSelectedMember(team);
		if (!member) return;
		this.onClose({ type: "remove-member", teamId: team.id, memberId: member.id });
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
			this.onClose(undefined);
			return;
		}

		if (data === "1") {
			this.panel = "overview";
			return;
		}
		if (data === "2") {
			this.panel = "teams";
			return;
		}
		if (data === "3") {
			this.panel = "members";
			return;
		}
		if (data === "4") {
			this.panel = "models";
			return;
		}
		if (matchesKey(data, Key.tab)) {
			this.panel =
				this.panel === "overview"
					? "teams"
					: this.panel === "teams"
						? "members"
						: this.panel === "members"
							? "models"
							: "overview";
			return;
		}

		if (data === "c") {
			this.onClose({ type: "create-team" });
			return;
		}
		if (data === "i") {
			const mode = this.office.interactionMode === "routed" ? "direct" : "routed";
			this.onClose({ type: "set-interaction", mode });
			return;
		}
		if (data === "a") {
			this.onClose({ type: "show-audit" });
			return;
		}
		if (data === "p") {
			this.closeWithPolicyAction();
			return;
		}
		if (data === "d" && (this.panel === "teams" || this.panel === "overview")) {
			this.closeWithDeleteTeamAction();
			return;
		}
		if (data === "r" && this.panel === "members") {
			this.closeWithRemoveMemberAction();
			return;
		}

		if (matchesKey(data, Key.up)) {
			if (this.panel === "teams" || this.panel === "overview") {
				this.selectedTeamIndex = Math.max(0, this.selectedTeamIndex - 1);
				this.selectedRoleIndex = 0;
				this.selectedMemberIndex = 0;
				return;
			}
			if (this.panel === "members") {
				this.selectedMemberIndex = Math.max(0, this.selectedMemberIndex - 1);
				return;
			}
			if (this.panel === "models") {
				this.selectedRoleIndex = Math.max(0, this.selectedRoleIndex - 1);
				return;
			}
		}

		if (matchesKey(data, Key.down)) {
			if (this.panel === "teams" || this.panel === "overview") {
				this.selectedTeamIndex = Math.min(this.office.teams.length - 1, this.selectedTeamIndex + 1);
				this.selectedRoleIndex = 0;
				this.selectedMemberIndex = 0;
				return;
			}
			if (this.panel === "members") {
				const team = this.getSelectedTeam();
				if (!team) return;
				const members = this.getTeamMembers(team);
				this.selectedMemberIndex = Math.min(Math.max(members.length - 1, 0), this.selectedMemberIndex + 1);
				return;
			}
			if (this.panel === "models") {
				const team = this.getSelectedTeam();
				if (!team) return;
				const roles = this.getRoles(team);
				this.selectedRoleIndex = Math.min(Math.max(roles.length - 1, 0), this.selectedRoleIndex + 1);
				return;
			}
		}

		if (matchesKey(data, Key.left) && this.panel === "models") {
			this.selectedModelIndex = Math.max(0, this.selectedModelIndex - 1);
			return;
		}
		if (matchesKey(data, Key.right) && this.panel === "models") {
			this.selectedModelIndex = Math.min(this.scopedModels.length - 1, this.selectedModelIndex + 1);
			return;
		}

		if (matchesKey(data, Key.enter)) {
			if (this.panel === "teams") {
				this.closeWithPolicyAction();
				return;
			}
			if (this.panel === "members") {
				this.closeWithRemoveMemberAction();
				return;
			}
			if (this.panel === "models") {
				const team = this.getSelectedTeam();
				if (!team || this.scopedModels.length === 0) return;
				const selectedModel = this.scopedModels[this.selectedModelIndex];
				if (!selectedModel) return;
				this.onClose({
					type: "apply-role-model",
					teamId: team.id,
					role: this.getSelectedRole(team),
					provider: selectedModel.provider,
					model: selectedModel.model,
				});
			}
		}
	}

	render(width: number): string[] {
		const lines: string[] = [];
		const team = this.getSelectedTeam();
		const panelLabel =
			this.panel === "overview"
				? "Overview"
				: this.panel === "teams"
					? "Teams"
					: this.panel === "members"
						? "Members"
						: "Models";

		lines.push(truncateToWidth(`┌ The Office Manager — ${this.office.name}`, width));
		lines.push(
			truncateToWidth(`│ [1]Overview [2]Teams [3]Members [4]Models [tab]cycle  Panel: ${panelLabel}`, width),
		);
		lines.push(
			truncateToWidth(`│ c:create-team  p:policy  d:delete-team  r:remove-member  i:toggle-mode  a:audit`, width),
		);
		lines.push(
			truncateToWidth("├──────────────────────────────────────────────────────────────────────────────", width),
		);

		if (!team) {
			lines.push(truncateToWidth("│ No teams configured. Press c to create a team.", width));
			lines.push(truncateToWidth("└ Esc close", width));
			return lines;
		}

		lines.push(truncateToWidth(`│ Team: ${team.name} (${team.id})`, width));
		lines.push(
			truncateToWidth(
				`│ Lead: ${team.lead.name} (${team.lead.role}) · Members: ${team.members.length} · Policies: ${team.routingPolicies.length}`,
				width,
			),
		);
		lines.push(
			truncateToWidth("├──────────────────────────────────────────────────────────────────────────────", width),
		);

		if (this.panel === "overview") {
			lines.push(truncateToWidth(`│ Interaction mode: ${this.office.interactionMode}`, width));
			lines.push(truncateToWidth(`│ Office Manager: ${this.office.officeManager.name}`, width));
			lines.push(truncateToWidth(`│ Teams total: ${this.office.teams.length}`, width));
			lines.push(truncateToWidth("│", width));
			lines.push(
				truncateToWidth(
					"│ Quick workflow: select team in panel 2, manage members in panel 3, set models in panel 4.",
					width,
				),
			);
		}

		if (this.panel === "teams") {
			for (let i = 0; i < this.office.teams.length; i++) {
				const item = this.office.teams[i];
				const selected = i === this.selectedTeamIndex ? "▸" : " ";
				lines.push(
					truncateToWidth(
						`│ ${selected} ${item.name}  lead:${item.lead.role}  members:${item.members.length}`,
						width,
					),
				);
			}
			lines.push(truncateToWidth("│", width));
			const selectedRole = this.getSelectedRole(team);
			const policy = team.routingPolicies.find((entry) => entry.role === selectedRole);
			lines.push(truncateToWidth(`│ Role focus: ${selectedRole}`, width));
			lines.push(
				truncateToWidth(
					`│ Fallbacks: ${policy?.fallbacks.map((fallback) => `${fallback.provider ?? "default"}/${fallback.model}`).join(" -> ") ?? "none"}`,
					width,
				),
			);
			lines.push(truncateToWidth("│ Enter/p edits role policy · d deletes selected team", width));
		}

		if (this.panel === "members") {
			const members = this.getTeamMembers(team);
			if (members.length === 0) {
				lines.push(truncateToWidth("│ No members found in this team", width));
			} else {
				for (let i = 0; i < members.length; i++) {
					const member = members[i];
					const selected = i === this.selectedMemberIndex ? "▸" : " ";
					const isLead = member.id === team.lead.agentId;
					lines.push(
						truncateToWidth(
							`│ ${selected} ${member.name} (${member.role}) ${isLead ? "[lead]" : ""} ${member.provider ?? "default"}/${member.model}`,
							width,
						),
					);
				}
				const selectedMember = this.getSelectedMember(team);
				if (selectedMember) {
					const removable = selectedMember.id !== team.lead.agentId;
					lines.push(truncateToWidth("│", width));
					lines.push(
						truncateToWidth(
							`│ Enter/r remove selected member ${removable ? "" : "(lead cannot be removed)"}`,
							width,
						),
					);
				}
			}
		}

		if (this.panel === "models") {
			const selectedRole = this.getSelectedRole(team);
			lines.push(truncateToWidth(`│ Role focus: ${selectedRole} (↑↓)`, width));
			if (this.scopedModels.length === 0) {
				lines.push(truncateToWidth("│ No scoped models configured. Use /scoped-models or --models first.", width));
			} else {
				const selectedModel =
					this.scopedModels[Math.max(0, Math.min(this.selectedModelIndex, this.scopedModels.length - 1))];
				lines.push(truncateToWidth(`│ Selected model: ${selectedModel?.label ?? "-"} (←→)`, width));
				lines.push(truncateToWidth("│ Enter applies as primary fallback for selected role", width));
				lines.push(truncateToWidth("│", width));
				const windowStart = Math.max(0, this.selectedModelIndex - 3);
				const windowEnd = Math.min(this.scopedModels.length, windowStart + 7);
				for (let i = windowStart; i < windowEnd; i++) {
					const scoped = this.scopedModels[i];
					const marker = i === this.selectedModelIndex ? "▸" : " ";
					lines.push(truncateToWidth(`│ ${marker} ${scoped?.label ?? ""}`, width));
				}
			}
		}

		lines.push(truncateToWidth("└ Esc close", width));
		return lines;
	}

	invalidate(): void {}
}
