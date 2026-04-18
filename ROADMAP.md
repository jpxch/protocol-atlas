# Protocol Atlas Roadmap

Last updated: 2026-04-18

## Purpose (Grounding Contract)

This file is the source-of-truth context for ongoing work on Protocol Atlas.

- `protocol-atlas` is a permissionless onchain opportunity intelligence and operations platform.
- Its core question is: what permissionless onchain opportunities currently exist, which are worth action, and how should an operator respond?
- It is not a wallet scavenger, an unauthorized recovery tool, a generic portfolio dashboard, a browser signing frontend, or an AI-only protocol-state guesser.
- Scope includes:
  - deterministic protocol and chain reads
  - opportunity discovery, normalization, persistence, review, and operator workflows
  - backend-controlled simulation, approval, auditing, and future execution pathways
- The project owns core scanning contracts, persistence, APIs, operator UI, action-request workflows, audit records, and future execution services.
- Keep phase status aligned with real code, docs, and the current working tree.

Protocol Atlas is deterministic-first. RPC reads, protocol adapters, simulations, persisted records, and audited backend workflows outrank AI interpretation. AI may summarize, rank, explain, or assist review language, but it must never become the authority for protocol state, safety gates, or execution approval.

## Product Doctrine

The product is designed for a two-person workflow:

- Builder: owns architecture, protocol adapters, database design, backend APIs, scanner logic, simulation paths, execution planning, and hardening.
- Operator: monitors opportunities, reviews system output, uses the browser dashboard, approves or skips actions, observes outcomes, and reports anomalies.

The browser is an operator interface, not a trusted execution surface. UI buttons may request work, but backend workflows own validation, auditability, simulation, execution gating, attribution, and future signing or execution behavior.

Non-negotiable rules:

- No secrets in frontend bundles or browser-side config.
- No frontend signing surface for privileged platform execution.
- No direct privileged execution from the browser.
- No AI authority over deterministic facts.
- No unaudited meaningful operator actions.
- No stale-UI-only assumptions before action.
- No shortcut that merges read mode and execute mode responsibilities.
- No hardcoded credentials.
- No direct mutation of authoritative opportunity state by AI.
- No blurred boundary between scanner, reviewer, simulator, approver, and executor responsibilities.

## Visual Identity

Protocol Atlas should feel like a control room, command center, and strategic operator console: dark, high-signal, disciplined, and serious.

The UI direction is:

- near-black and graphite foundations
- restrained luminous accents used for meaning
- blue for information and navigation
- green for validated or safe-positive states
- amber for caution, review, or stale states
- red for blocked, risk, or failure states
- optional violet/cyan only as limited intelligence accents
- cohesive panels, cards, tables, and charts that feel like one operating system
- direct, competent product copy

Avoid Tailwind redesigns, pastel SaaS styling, generic admin templates, casino energy, crypto hype language, toy affordances, or meme-heavy branding. The emotional target is confidence, not hype.

## Deployment Target (Current)

- Primary current runtime target is local development.
- Root workspace is managed with pnpm workspaces and Turbo.
- Runtime configuration remains environment-driven:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `ETHEREUM_RPC_URL`
  - `ARBITRUM_RPC_URL`
  - `OPTIMISM_RPC_URL`
  - `BASE_RPC_URL`
  - `POLYGON_RPC_URL`
  - `OPENAI_API_KEY`
  - `API_PORT`
  - `NEXT_PUBLIC_API_BASE_URL`
- Keep deployment docs environment-specific, but keep code paths portable where possible.

## Chosen Stack

- Monorepo: pnpm + Turbo
- Frontend: Next.js + React + TypeScript + custom SCSS Modules
- Backend API: Fastify + TypeScript + Zod
- Database: PostgreSQL + Drizzle ORM
- Queue/jobs: Redis + BullMQ
- Onchain client: viem
- Charts: Apache ECharts
- Frontend data/state: TanStack Query + Zustand
- Rust: reserved for later extraction of latency-sensitive or execution-critical services only

Do not introduce Tailwind as the default styling system. The operator UI should continue through custom SCSS Modules, shared tokens, and the existing Atlas design language.

## Architecture Model

Intended high-level architecture:

```text
[ Core Engine ] -> [ Persistence Layer ] -> [ API Platform ] -> [ Operator Interface ]
                                  \
                                   -> [ Future Execution Service ]
```

Near-term work should optimize for correctness, protocol contracts, persistence, operator usefulness, review surfaces, safety gates, and audit history.

Do not optimize day-one work around full autonomy, mempool warfare, Rust-everywhere, browser-only behavior, or AI-led truth.

## Verified Status Snapshot

Validated from the repo and current working tree on 2026-04-18 unless otherwise noted:

- `git status --short` cannot run from `/mnt/continuum/Projects/protocol-atlas`; this path is not currently detected as a Git repository.
- Active branch and latest commit are unavailable until the workspace is initialized as or moved into a Git repository.
- `.env.example` exists and defines database, Redis, RPC endpoint, OpenAI, API, and operator-web runtime variables.
- Root workspace files exist:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `.gitignore`
  - `.env.example`
- Current workspace directories exist:
  - `apps/api`
  - `apps/operator-web`
  - `packages/core`
  - `packages/db`
  - `packages/shared`
  - `services/scanner-worker`
  - `services/executor-worker`
  - `services/ai-review`
  - `docs`
  - `infra`
- `apps/api`, `packages/core`, `packages/db`, `packages/shared`, and service packages are present as directories but do not yet contain tracked source files in the current scaffold.
- `apps/operator-web` is the active implementation surface.
- The operator web app currently includes:
  - Next.js app routes for `/` and `/opportunities`
  - shell components: `AppShell`, `Sidebar`, `Topbar`
  - dashboard components: `MetricCard`, `ChartPanel`, `ActivityPanel`, `OpportunityFlowChart`
  - feature composition: `src/features/dashboard/DashboardScreen.tsx`
  - typed dashboard chart data in `src/types/dashboard.ts`
  - SCSS foundations and token files
- `DashboardScreen` is correctly treated as a feature-level composition, not a low-level reusable component.
- Apache ECharts is already installed and wired through `OpportunityFlowChart.client.tsx`.
- Current tests status:
  - no test files are visible in the repo snapshot
  - root `test` script exists through Turbo but package-level test coverage is not yet established
- Current docs status:
  - `docs/` exists
  - no source docs are visible in the repo snapshot
  - this roadmap is the first local intent/status contract in the current reset
- Current local verification:
  - `pnpm --filter @protocol-atlas/operator-web typecheck` could not run because `pnpm` is not on the shell PATH
  - `./node_modules/.bin/tsc -p apps/operator-web/tsconfig.json --noEmit` succeeds after allowing TypeScript to write `apps/operator-web/tsconfig.tsbuildinfo`
- Remaining visible gaps:
  - workspace is not currently Git-detectable from this path
  - backend API is not scaffolded beyond its directory
  - persistence schema and migrations are not implemented
  - core scanner/domain contracts are not implemented
  - opportunity table, filters, action workflow UI, and detail/case-file view are not implemented
  - audit event model is not implemented
  - auth and role-boundary skeletons are not implemented

Implemented APIs / Interfaces:

- `OpportunityFlowPoint`
- `OpportunityFlowChartProps`
- dashboard route `/`
- opportunities placeholder route `/opportunities`

Implemented core services / modules:

- Operator web shell:
  - `apps/operator-web/src/components/shell/AppShell.tsx`
  - `apps/operator-web/src/components/shell/Sidebar.tsx`
  - `apps/operator-web/src/components/shell/Topbar.tsx`
- Dashboard UI:
  - `apps/operator-web/src/features/dashboard/DashboardScreen.tsx`
  - `apps/operator-web/src/components/dashboard/MetricCard.tsx`
  - `apps/operator-web/src/components/dashboard/ChartPanel.tsx`
  - `apps/operator-web/src/components/dashboard/ActivityPanel.tsx`
  - `apps/operator-web/src/components/dashboard/OpportunityFlowChart.client.tsx`
- Styling system:
  - `apps/operator-web/src/app/globals.scss`
  - `apps/operator-web/src/styles/foundations`
  - `apps/operator-web/src/styles/tokens`

Current system direction:

Protocol Atlas is in a clean reset state with the monorepo foundation and operator-web shell underway. The immediate product surface is the dashboard command deck: real ECharts wiring now exists, but data is still static and should move toward typed API-backed contracts. The next engineering priority is to connect the UI to real backend, persistence, audit, and scanner contracts without weakening the deterministic-first and backend-controlled execution doctrine.

## Git Status And Direction

Current git status:

- Active branch: unavailable from this workspace path
- Working tree: unavailable from Git; filesystem contains a local scaffold and installed dependencies
- Latest commit before this roadmap refresh: unavailable from this workspace path

Required direction:

1. Initialize or reconnect Git context so roadmap status, branches, commits, and diffs are auditable.
2. Stabilize the operator dashboard data contracts and chart/table surfaces.
3. Scaffold the backend API with health, opportunities read, and action-request skeleton endpoints.
4. Scaffold persistence with first Drizzle schema and migration flow.
5. Scaffold core scanner/domain contracts before adding protocol-specific behavior.
6. Preserve backend-only execution and first-class audit events for every meaningful operator action.

## Reality-Checked Phase Status

| Phase | Name | Status | Notes |
|---|---|---|---|
| 0 | Identity & Foundation | In Progress | Monorepo foundation and env example exist; Git context and docs set need alignment. |
| 1 | Core Engine | Not Started | `packages/core` exists but chain models, provider interfaces, opportunity models, review models, and scanner contracts are not implemented. |
| 2 | Persistence Layer | Not Started | `packages/db` exists but Drizzle schema, migrations, and DB connectivity checks are not implemented. |
| 3 | API Platform | Not Started | `apps/api` exists but Fastify app, health endpoint, opportunity reads, action requests, and auth skeleton are not implemented. |
| 4 | Operator Dashboard | In Progress | Next.js app shell, dashboard screen, custom SCSS system, metric cards, panels, and ECharts chart exist with static data. |
| 5 | Manual Action Workflow | Not Started | Rescan, refresh review, simulate, approve, skip, and execute request flows are not yet modeled end to end. |
| 6 | Execution Engine | Not Started | Future backend execution path is doctrine-level only; no executor contracts or safety gates are implemented. |
| 7 | Rust Service Introduction | Not Started | Rust remains intentionally deferred until a measured need exists. |
| 8 | Hardening & Operations | Not Started | Auth, secrets posture verification, observability, audit retention, and operational runbooks are not yet implemented. |

## Next Milestone Checklist

### Suggested Immediate Next Step

- [ ] Reconnect or initialize Git context for `/mnt/continuum/Projects/protocol-atlas`.
- [ ] Confirm `pnpm` availability in the development shell.
- [ ] Add package manifests for scaffolded workspaces that will be built soon.
- [ ] Keep `DashboardScreen` in `src/features/dashboard/`.
- [ ] Keep reusable dashboard primitives in `src/components/dashboard/`.
- [ ] Run frontend typecheck after each dashboard change.

### Phase 0 Closure (Identity & Foundation)

- [ ] Add or restore README, ARCHITECTURE, SECURITY, and IDENTITY docs.
- [ ] Record deterministic-first, backend-only execution, and auditability as explicit contracts.
- [ ] Document local startup expectations for database, Redis, API, and operator web.
- [ ] Confirm Git branch, status, and initial commit state.
- [ ] Add workspace package manifests for `apps/api`, `packages/core`, `packages/db`, `packages/shared`, and service workspaces as they become active.

### Phase 1 Kickoff (Core Engine)

- [ ] Add chain/network model.
- [ ] Add provider interface for deterministic RPC/protocol reads.
- [ ] Add opportunity model family.
- [ ] Add review model family.
- [ ] Add scanner contract.
- [ ] Add focused tests for model validation and scanner contract behavior.

### Phase 2 Kickoff (Persistence Layer)

- [ ] Scaffold `packages/db` as a real TypeScript package.
- [ ] Add Drizzle configuration.
- [ ] Define first schema:
  - opportunities
  - reviews
  - scan_runs
  - operator_actions
  - audit_events
- [ ] Add migration command and local migration documentation.
- [ ] Verify local PostgreSQL connectivity through `DATABASE_URL`.

### Phase 3 Kickoff (API Platform)

- [ ] Scaffold `apps/api` as a Fastify TypeScript package.
- [ ] Add `/health` endpoint.
- [ ] Add opportunities read endpoint.
- [ ] Add action request skeleton endpoint.
- [ ] Add auth placeholder and role boundary skeleton.
- [ ] Validate request/response contracts with Zod.

### Phase 4 Continuation (Operator Dashboard)

- [ ] Replace static dashboard data with typed API-facing contracts.
- [ ] Keep ECharts integration client-only and typed.
- [ ] Build opportunity table component.
- [ ] Add filters, status pills, and action column.
- [ ] Build opportunity detail / case-file view.
- [ ] Add action buttons for rescan, refresh review, simulate, approve, skip, and future execute requests.
- [ ] Ensure all action buttons map to backend workflows, not direct browser execution.

### Phase 5 Kickoff (Manual Action Workflow)

- [ ] Model operator action request lifecycle.
- [ ] Persist every meaningful action to `operator_actions` and/or `audit_events`.
- [ ] Add stale data checks before action requests.
- [ ] Require simulation before approval where applicable.
- [ ] Add skip reason capture.
- [ ] Add review refresh history.

### Phase 6 Gate (Execution Engine)

- [ ] Define execution intent contract separately from opportunity state.
- [ ] Define simulation result contract.
- [ ] Define backend-only approval gate.
- [ ] Define execution attempt and outcome records.
- [ ] Keep all signing credentials backend-only.
- [ ] Add failure, retry, and blocked-state audit events.

### Phase 7 Gate (Rust Service Introduction)

- [ ] Identify a concrete latency-sensitive or execution-critical bottleneck.
- [ ] Prove TypeScript service boundary first.
- [ ] Define stable service contract before extraction.
- [ ] Add cross-language tests or fixtures before production use.

### Phase 8 Gate (Hardening & Operations)

- [ ] Add structured logging.
- [ ] Add health and readiness checks.
- [ ] Add secrets handling documentation.
- [ ] Add audit retention expectations.
- [ ] Add backup and migration procedures.
- [ ] Add operational runbooks for scanner, API, worker, and executor failures.

## Git Workflow Guardrails

Use this workflow for every roadmap item unless explicitly overridden:

- [ ] Create work only on topic branches (`feature/*`, `fix/*`, `chore/*`, `docs/*`) once Git context exists.
- [ ] Keep branch scope aligned to one roadmap unit.
- [ ] Rebase or merge `main` before finalizing work.
- [ ] Open a PR for every branch with purpose, verification, and deferred follow-ups.
- [ ] Require passing checks before merge.
- [ ] Prefer squash merge unless there is a reason not to.
- [ ] Delete merged branches after merge.
- [ ] Tag significant milestones on `main`.
- [ ] If scope changes mid-branch, cut a new branch for unrelated work.

## AI Collaboration Rules

Another AI helping on this project must:

- keep the project deterministic-first
- preserve the control-room identity
- use custom SCSS Modules, not Tailwind, unless the project direction explicitly changes
- treat the UI as an operator interface, not the trusted executor
- keep execution backend-only
- maintain auditability as a first-class requirement
- prefer clear modular architecture over shortcuts
- preserve the Builder / Operator split
- keep Rust as later extraction, not a day-one rewrite
- avoid generic toy patterns
- avoid browser wallet signing as the privileged platform execution path
- keep reusable components in `components`
- keep page/domain compositions in `features`

