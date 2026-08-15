# Workspace fork instructions

Read first: `AGENTS.md`, `HANDOFF.md`, `CONTEXT-WORKSPACE.md`, `TASKS.md`, `PRODUCT.md`, `PLAN.md`, `DECISIONS.md`.

For this Homebox workspace, never import or mount Artifact Garden, Mac mini files, or Homebox host documents. Public HTTP stays read-only; mutations are MCP-only. Update `HANDOFF.md`, `TASKS.md`, and `LOG.md` at savepoints.

Check workspace work with `pnpm test:workspace`, `pnpm build:workspace`, and Docker smoke.

Check upstream desktop work: `pnpm build:desktop` (builds packages, runs biome check, tsc, vite build, cargo check). For quick iteration use `pnpm check` and desktop tsc.

After React changes, run `pnpm check:react-compiler`; CI rejects components the compiler skips.

When asked why you made a decision, answer why. Don't take it as a challenge to your approach, or pressure to change your solution.

## Agent skills

### Issue tracker

GitHub Issues on `bholmesdev/hubble.md` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults: `needs-triage`, `ready-to-implement`, `needs-discussion`, `duplicate`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Human review readiness

Use /simplify before handing code to a human reviewer.
