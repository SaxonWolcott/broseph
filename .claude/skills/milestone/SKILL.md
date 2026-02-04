---
name: milestone
description: Document completed work as a milestone. Use after finishing significant work to create documentation in /milestones/XXX-name.md and update ROADMAP.md.
---

# Milestone Documentation

Create lightweight documentation for completed work.

## When to Use

Invoke `/milestone` (or `/milestone 014 feature-name`) after completing significant work that deserves documentation.

## Milestone Format

```markdown
# Milestone XXX: Name

**Completed:** YYYY-MM-DD

## Summary

2-3 sentences on what was accomplished and why.

## Key Changes

- `path/to/file.ts` - what changed
- `path/to/other.ts` - what changed

## Decisions

- Chose X over Y because Z (only if significant)
```

## Workflow

1. Determine next milestone number: check `/milestones/` for highest existing number + 1
2. Create `/milestones/XXX-name.md` using the format above
3. Update `/reference/ROADMAP.md` with the completed milestone entry
4. Report completion

## Instructions

When the user invokes this skill:

1. **If number provided** (e.g., `/milestone 014 annotation-detection`): use that number and name
2. **If no number**: find the highest existing milestone number and add 1
3. **Gather context**: review recent git commits and conversation to understand what was done
4. **Create the milestone file** at `/milestones/XXX-name.md`
5. **Update ROADMAP.md** in the Completed Milestones section

## ROADMAP Entry Format

```markdown
- **Milestone XXX: Name** - Completed
  - Brief bullet points of what was done
  - See: `/milestones/XXX-name.md`
```

## Key Files

- `/milestones/` - Individual milestone documentation files
- `/reference/ROADMAP.md` - High-level tracking of all milestones
