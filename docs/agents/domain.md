# Domain docs

How the engineering skills consume this repository's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repository root.
- **`CONTEXT-MAP.md`** at the repository root, if it exists. It points to one `CONTEXT.md` per context; read each one relevant to the topic.
- **`docs/adr/`** for ADRs that affect the area being explored. In multi-context repositories, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files do not exist, proceed silently. The `/domain-modeling` skill creates them lazily when terms or decisions are resolved.

## File structure

This repository uses the single-context layout:

```text
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept in an issue title, refactor proposal, hypothesis, or test name, use the term defined in `CONTEXT.md`. Avoid synonyms that the glossary explicitly rejects.

If the concept is missing from the glossary, reconsider whether it belongs to the project vocabulary or note the gap for `/domain-modeling`.

## Flag ADR conflicts

Surface any conflict with an existing ADR explicitly instead of silently overriding it:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because..._
