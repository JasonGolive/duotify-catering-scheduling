# Copilot Instructions for duotify-membership-v1

## Build, Test, and Lint Commands
- No build, test, or lint scripts detected in the repository root or common config files.
- If scripts exist, add them here for Copilot context.

## High-Level Architecture
- The repository uses a Spec Kit workflow with feature-driven planning and implementation.
- Key templates and prompts are located in `.specify/templates/` and `.github/prompts/`.
- Agents for planning, specification, implementation, and analysis are defined in `.github/agents/`.
- Constitution files (project principles) are found in `constitution_zh-TW.md` and `.specify/memory/constitution.md`.
- AGENTS.md provides agent configuration and slash command usage.

## Key Conventions
- All changes must be minimal and targeted, respecting the project constitution.
- Feature work follows the Spec Kit process: plan, specify, checklist, tasks, implement.
- User stories and tasks are prioritized and independently testable.
- Templates guide structure for plans, specs, tasks, and checklists.
- Do not refactor or restructure code unless explicitly requested.
- Always preserve existing comments, formatting, and structure unless change is required.

## Integration with Other AI Assistant Configs
- AGENTS.md: Contains agent and slash command conventions.
- Constitution files: Enforce minimal change and explicit approval for refactors.

---

For Copilot sessions: Follow the Spec Kit workflow, respect the constitution, and use agent prompts/templates for feature work. Add build/test/lint commands if/when they are introduced.
