---
name: write-pr-description
description: Creates missing draft PRs or updates PR descriptions from repository templates, branch diffs, and verified evidence. Use when a PR body, screenshot, rationale, or file-level change summary needs to be created or corrected.
---

# Write PR Description

This skill alone may create draft PRs, edit PR bodies, upload PR images, or add image URLs.

## Steps

1. Identify each PR or stack branch, its real parent, and its existing PR state.
2. Create a draft PR only when a branch has no PR. Never switch an existing ready PR back to draft.
3. Read the repository PR template. If none exists, use `Problem`, `Solution`, `What changed`, and `Tests`.
4. Diff each branch against its real parent. Read Git status and its add, change, delete, and rename data.
5. Read the review ledger and evidence manifest. Check both sides of each possible replacement. Check later branches when ownership may move again.
6. Give every changed path one primary reviewer intent and a verified reason. Upload local screenshots when needed and record their URLs in the manifest.
7. Write or update the body. Check it against the parent diff, Git status, evidence manifest, and stack owner.

## Body layout

- Treat the repository template as the outer shape. Keep its headings, checklists, proof, and deploy notes.
- Keep `Solution` to two to five sentences describing the end state, not a file list.
- Put `What changed` right after `Solution`. Keep it before all proof and screenshots.
- Group changes by reviewer intent, not file type or package. Start each group with its reason or result.
- Name exact paths and explain what each did and why. Group paths only when they share the same reason and fate.
- Give each path one main group. Repeat a path only when its parts support different choices.

Sample:

```markdown
## Solution

Two to five sentences about the end state.

## What changed

### Move preview rendering to the typed entry point

This keeps preview setup with the code that owns it.

- **Replaced:** `old/path.ts` with `new/path.tsx`. The new entry point owns rendering and types.
```

## File labels

- Base `Added`, `Changed`, `Deleted`, and `Renamed` labels on Git status.
- For a deletion, say why the path is no longer needed and where its duty moved.
- Use `Replaced` for a delete/add pair only when the diff shows that the same role moved. This applies even when Git missed the rename.
- For configuration, map each old key to its new owner and explain why any key was dropped.
- Put generated files under the intent that caused them. If no intent applies, use a clear generated or routine-work group.
- Say when a later PR restores a removed feature under a new owner. Do not claim its work in this PR.

## Writing style

- Use plain words and minimal jargon. Explain the problem, solution, and why.
- Keep each PR scoped to one coherent change.
- Do not mention internal planning or agent processes.
- Explain a documented exception when it matters.

## Checks

- Confirm every path in the real-parent diff has an intent and reason in `What changed`.
- Check each label against Git status. Check each rename or replacement against the diff.
- Check each reason in this branch. Use current official sources for claims about tools or settings.
- Check that each claim, proof item, and screenshot belongs to this PR. Each item must appear in its evidence manifest.
- Keep all template sections that apply. Describe later stack ownership with care.
- Read the body as a reviewer. `Solution` must explain the result. `What changed` must explain the work and its reasons.
- Do not publish if a path has no intent, a reason cannot be checked, or proof belongs to another PR. Report the gap instead.

## Hard rules

- Never post review replies.
- Never close or resolve review threads.
- Never claim evidence that is not in the evidence manifest.
- Never embed screenshots from a child branch in a parent PR.

## Output

Return PR links and their draft or ready state. Include uploaded image URLs and any accuracy gaps that still need a decision.
