# Plutus

This repository stores shared, project-scoped agent skills and instructions.

## Skill management

- Treat `.agents/skills/` and `.claude/skills/` as installed output. Change a skill in its upstream repository, then reinstall or update it here.
- Use `npx skills@latest` for skill installation and updates.
- Install project skills for both `codex` and `claude-code`.
- Commit `skills-lock.json` with every skill change.

## Working agreements

- Keep changes small, explicit and type-safe where code is involved.
- Use British English in documentation.
- Verify changes with `npx --yes skills@latest list --json` and `git diff --check`.
