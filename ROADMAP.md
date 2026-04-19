# Protocol Atlas Roadmap

Last updated: 2026-04-18

## Purpose

Protocol Atlas is a permissionless onchain opportunity intelligence and operations platform.

Its core question is: what permissionless onchain opportunities currently exist, which are worth action, and how should an operator respond?

Protocol Atlas is not a wallet scavenger, unauthorized recovery tool, generic portfolio dashboard, browser signing frontend, or AI-only protocol-state guesser.

Scope includes:

- deterministic protocol and chain reads
- opportunity discovery, normalization, persistence, review, and operator workflows
- backend-controlled simulation, approval, auditing, and future execution pathways
- operator-facing visibility into scanner output, opportunities, action requests, and history

Protocol Atlas is deterministic-first. RPC reads, protocol adapters, simulations, persisted records, and audited backend workflows outrank AI interpretation. AI may summarize, rank, explain, or assist review language, but it must never become the authority for protocol state, safety gates, or execution approval.

## Product Doctrine

The product is designed for a two-person workflow:

- Builder: owns architecture, protocol adapters, database design, backend APIs, scanner logic, simulation paths, execution planning, deployment, and hardening.
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

## Current Runtime Snapshot

Validated on 2026-04-18 from the local repo and `continuum-mini`.

Repository:

- Branch: `main`
- Snapshot: `main` after the watchlist page rollout and route cleanup.
- Remote: `git@github.com:jpxch/protocol-atlas.git`
- Package manager: `pnpm@10.28.2`
- Workspace runner: Turbo
- Language: TypeScript

Implemented packages and apps:

- `packages/core`: domain contracts for chains, opportunities, reviews, provider ports, and scanner interfaces.
- `packages/db`: Drizzle client, schema, and repositories.
- `apps/api`: Fastify API with health, opportunity, audit-event, operator-action, and watchlist-target routes.
- `apps/operator-web`: Next.js operator UI with dashboard, opportunities board, same-origin proxy routes, SCSS modules, and ECharts.
- `services/scanner-worker`: Aave V3 Arbitrum health-factor watch scanner.

Implemented database tables:

- `opportunities`
- `reviews`
- `scan_runs`
- `operator_actions`
- `audit_events`
- `liquidation_plans`
- `watchlist_targets`

Implemented API routes:

- `GET /health`
- `GET /opportunities`
- `GET /audit-events`
- `POST /operator-actions`
- `GET /liquidation-candidates`
- `GET /liquidation-plans`
- `GET /watchlist-targets`
- `GET /scan-runs`

Implemented web routes:

- `GET /`
- `GET /liquidations`
- `GET /opportunities`
- `GET /watchlist`
- `GET /api/liquidation-candidates`
- `GET /api/liquidation-plans`
- `POST /api/operator-actions`
- `GET /api/watchlist-targets`
- `GET /api/scan-runs`

Current deployment on `continuum-mini`:

- App path: `/opt/protocol-atlas`
- DB: `protocol_atlas` database and `protocol_atlas` role inside the existing `riotcore-postgres` container.
- API service: `protocol-atlas-api.service`, user-level systemd, port `4000`.
- Web service: `protocol-atlas-web.service`, user-level systemd, port `3000`.
- Scanner timer: `protocol-atlas-scanner.timer`, user-level systemd, every 5 minutes.
- Scanner job: `protocol-atlas-scanner.service`, one-shot worker.
- User linger is enabled for `jpxch`, so services keep running after logout.

Current deployed checks:

- `http://127.0.0.1:4000/health` returns `200`.
- `http://127.0.0.1:4000/watchlist-targets?limit=1` returns persisted Aave watchlist data.
- `http://127.0.0.1:4000/liquidation-candidates?limit=1` returns scanner-promoted liquidation candidates.
- `http://127.0.0.1:4000/liquidation-plans?limit=1` returns reserve-level candidate plans.
- `http://127.0.0.1:3000/watchlist` returns the operator watchlist page.
- `http://127.0.0.1:3000/liquidations` returns the operator liquidation cockpit.
- `http://127.0.0.1:3000/api/watchlist-targets?limit=1` proxies watchlist JSON for browser-safe access.
- `http://127.0.0.1:3000/api/liquidation-candidates?limit=1` proxies liquidation candidate JSON for browser-safe access.
- `http://127.0.0.1:3000/api/liquidation-plans?limit=1` proxies liquidation plan JSON for browser-safe access.
- `http://192.168.0.74:3000` is reachable on the LAN.
- API and web systemd units are active.
- Scanner timer is active and has completed recurring runs.

Most recent scanner observations:

- Aave V3 Arbitrum watchlist discovery is live.
- `watchlist_targets` has hundreds of persisted targets.
- Scanner opportunities now distinguish `actionable`, `low-margin`, and `watch-close` liquidation signals.
- Scanner-promoted candidates now get a persisted liquidation plan selecting the current best debt/collateral reserve pair.
- Some account reads can fail transiently; scanner now records `failedTargets` and continues rather than failing the whole run.

## Project Tree

Source-focused snapshot. Generated and dependency directories such as `node_modules`, `.next`, `dist`, and `*.tsbuildinfo` are intentionally omitted.

```text
protocol-atlas/
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── app.ts
│   │       ├── env.ts
│   │       ├── server.ts
│   │       └── routes/
│   │           ├── audit-events.ts
│   │           ├── health.ts
│   │           ├── liquidation-candidates.ts
│   │           ├── liquidation-plans.ts
│   │           ├── operator-actions.ts
│   │           ├── opportunities.ts
│   │           ├── scan-runs.ts
│   │           └── watchlist-targets.ts
│   └── operator-web/
│       ├── next.config.mts
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── app/
│           │   ├── globals.scss
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   ├── api/
│           │   │   ├── liquidation-candidates/route.ts
│           │   │   ├── liquidation-plans/route.ts
│           │   │   ├── operator-actions/route.ts
│           │   │   ├── scan-runs/route.ts
│           │   │   └── watchlist-targets/route.ts
│           │   ├── liquidations/page.tsx
│           │   ├── opportunities/page.tsx
│           │   └── watchlist/page.tsx
│           ├── components/
│           │   ├── dashboard/
│           │   │   ├── ActivityPanel.tsx
│           │   │   ├── ChartPanel.tsx
│           │   │   ├── MetricCard.tsx
│           │   │   └── OpportunityFlowChart.client.tsx
│           │   ├── opportunities/
│           │   │   └── OpportunityTable.tsx
│           │   └── shell/
│           │       ├── AppShell.tsx
│           │       ├── AtlasShell.tsx
│           │       ├── Sidebar.tsx
│           │       └── Topbar.tsx
│           ├── features/
│           │   ├── dashboard/DashboardScreen.tsx
│           │   ├── liquidations/
│           │   │   ├── LiquidationsBoard.module.scss
│           │   │   └── LiquidationsBoard.tsx
│           │   ├── opportunities/OpportunitiesBoard.tsx
│           │   └── watchlist/
│           │       ├── WatchlistBoard.module.scss
│           │       └── WatchlistBoard.tsx
│           ├── lib/
│           │   └── api.ts
│           ├── styles/
│           │   ├── foundations/
│           │   │   ├── _base.scss
│           │   │   ├── _reset.scss
│           │   │   └── _utilities.scss
│           │   └── tokens/
│           │       ├── _colors.scss
│           │       ├── _motion.scss
│           │       ├── _radius.scss
│           │       ├── _shadows.scss
│           │       ├── _spacing.scss
│           │       └── _typography.scss
│           └── types/
│               ├── api.ts
│               ├── dashboard.ts
│               └── opportunities.ts
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── domain/
│   │       │   ├── chain.ts
│   │       │   ├── opportunity.ts
│   │       │   └── review.ts
│   │       ├── providers/
│   │       │   └── provider.ts
│   │       └── scanners/
│   │           └── scanner.ts
│   └── db/
│       ├── drizzle.config.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── client.ts
│           ├── index.ts
│           ├── repositories/
│           │   ├── audit-events.ts
│           │   ├── liquidation-plans.ts
│           │   ├── operator-actions.ts
│           │   ├── opportunities.ts
│           │   ├── scan-runs.ts
│           │   └── watchlist-targets.ts
│           └── schema/
│               ├── audit-events.ts
│               ├── index.ts
│               ├── liquidation-plans.ts
│               ├── operator-actions.ts
│               ├── opportunities.ts
│               ├── reviews.ts
│               ├── scan-runs.ts
│               └── watchlist-targets.ts
├── services/
│   └── scanner-worker/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── env.ts
│           ├── index.ts
│           ├── simulators/
│           │   └── aave-v3-liquidation-plan.ts
│           └── scanners/
│               └── aave-v3-health-factor-watch.ts
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── ROADMAP.md
├── tsconfig.base.json
├── tsconfig.json
└── turbo.json
```

## Chosen Stack

- Monorepo: pnpm + Turbo
- Frontend: Next.js + React + TypeScript + custom SCSS Modules
- Backend API: Fastify + TypeScript + Zod
- Database: PostgreSQL + Drizzle ORM
- Onchain client: viem
- Protocol dependency: `@aave/core-v3`
- Charts: Apache ECharts
- Runtime services: user-level systemd on `continuum-mini`
- Rust: reserved for later extraction of latency-sensitive or execution-critical services only

Deferred or not yet active:

- Redis / BullMQ job queue
- TanStack Query / Zustand frontend state layer
- OpenAI-assisted review service
- Execution worker

Do not introduce Tailwind as the default styling system. The operator UI should continue through custom SCSS Modules, shared tokens, and the existing Atlas design language.

## Architecture Model

Current architecture:

```text
[ Aave Scanner Worker ] ---> [ PostgreSQL / Drizzle ] ---> [ Fastify API ] ---> [ Next Operator UI ]
          |                            |
          |                            +--> [ Audit Events / Operator Actions ]
          |
          +--> [ Arbitrum RPC / Aave V3 Pool ]
```

Intended architecture:

```text
[ Core Engine ] -> [ Persistence Layer ] -> [ API Platform ] -> [ Operator Interface ]
                                  \
                                   -> [ Simulation / Review / Future Execution Services ]
```

Near-term work should optimize for correctness, protocol contracts, persistence, operator usefulness, review surfaces, safety gates, and audit history.

Do not optimize near-term work around full autonomy, mempool warfare, Rust-everywhere, browser-only behavior, or AI-led truth.

## Reality-Checked Phase Status

| Phase | Name | Status | Notes |
|---|---|---|---|
| 0 | Identity & Foundation | Mostly Complete | Monorepo, pnpm, Turbo, TypeScript, Git, env conventions, deployment target, and doctrine are in place. README/security/runbooks still need expansion. |
| 1 | Core Engine | In Progress | Chain, opportunity, review, provider, and scanner contracts exist. More protocol adapter structure and tests are needed. |
| 2 | Persistence Layer | In Progress | Drizzle schema and repositories exist for core records, liquidation plans, action requests, audit events, scan runs, and watchlist targets. Migration/backup/retention procedure still needs hardening. |
| 3 | API Platform | In Progress | Fastify app exposes health, opportunities, liquidation candidates, liquidation plans, audit events, operator actions, scan runs, and watchlist targets. Auth, pagination, error shape, and readiness checks remain open. |
| 4 | Operator Dashboard | In Progress | Dashboard, opportunity board, liquidation cockpit, and watchlist page are API-backed. Case-file/detail views and richer action UX remain open. |
| 5 | Manual Action Workflow | Started | Operator action requests are persisted. Backend lifecycle, stale-data checks, simulation prerequisites, and audit event fanout need work. |
| 6 | Execution Engine | Not Started | Future backend execution path remains doctrine-level only. No executor contracts, signing, simulation, or safety gates are implemented. |
| 7 | Rust Service Introduction | Deferred | Rust remains intentionally deferred until a measured need exists. |
| 8 | Hardening & Operations | Started | Mini deployment exists with API/web services and scanner timer. Still missing runbooks, firewall notes, backups, monitoring, log retention, and service update docs. |

## Implemented Interfaces And Modules

Core:

- `ChainKey`
- `ChainDefinition`
- `OpportunityRecord`
- `OpportunitySignal`
- `OpportunityStatus`
- `OpportunityKind`
- `LiquidationPlanRecord`
- `LiquidationPlanStatus`
- `LiquidationPlanConfidence`
- `RiskLevel`
- `FreshnessState`
- `ReviewRecord`
- `ProtocolScanner`
- `ProtocolScannerContext`
- `ScanRunResult`

Database:

- `createDatabaseClient`
- `createDatabaseConnection`
- `createPgPool`
- `sql` re-export from `drizzle-orm`
- opportunity repository
- liquidation candidate query over persisted opportunities
- liquidation-plan repository
- scan-run repository
- operator-action repository
- audit-event repository
- watchlist-target repository

API:

- `buildApp`
- `registerHealthRoutes`
- `registerLiquidationCandidateRoutes`
- `registerLiquidationPlanRoutes`
- `registerOpportunityRoutes`
- `registerAuditEventRoutes`
- `registerOperatorActionRoutes`
- `registerWatchlistTargetRoutes`
- `registerScanRunRoutes`

Scanner:

- `getScannerEnv`
- `runAaveV3HealthFactorWatchScanner`
- Aave V3 Borrow log discovery
- watchlist target upsert
- Aave `getUserAccountData` reads
- health-factor threshold filtering
- liquidation signal classification for actionable, low-margin, and watch-close candidates
- candidate-level liquidation economics persisted in opportunity payloads
- reserve-level liquidation plan generation from Aave reserves, debt tokens, collateral tokens, oracle prices, close factor, liquidation bonus, and flashloan premium
- watchlist metadata refresh with latest health factor and signal snapshot
- non-fatal per-target read failure handling
- scan-run completion/failure recording

Operator web:

- `AppShell`
- `Sidebar`
- `Topbar`
- `DashboardScreen`
- `LiquidationsBoard`
- `OpportunitiesBoard`
- `WatchlistBoard`
- `OpportunityTable`
- `MetricCard`
- `ChartPanel`
- `ActivityPanel`
- `OpportunityFlowChart`
- API read helpers with empty-state fallback
- same-origin liquidation-candidate proxy
- same-origin liquidation-plan proxy
- same-origin operator-action proxy
- same-origin watchlist-target proxy
- same-origin scan-run proxy

## Current Gaps

Product and UX:

- Watchlist page exists, but target drilldowns and richer scan-run detail views are still shallow.
- Liquidation cockpit now shows reserve-level plans, but plans still lack executable DEX route quotes and transaction simulation.
- No opportunity detail / case-file page.
- No operator action history panel scoped to an opportunity.
- No review refresh or simulation result UI.
- Dashboard copy still references some future capabilities.

API and data:

- No auth or role boundary.
- No pagination/cursor contract for large tables.
- No stable API error envelope.
- No readiness endpoint separate from `/health`.
- No API route for operator action history by opportunity.
- No simulation result API, execution attempt API, or realized PnL record.
- No retention policy for `audit_events`, `scan_runs`, `liquidation_plans`, or `watchlist_targets`.

Scanner:

- Aave scanner reads targets sequentially.
- Aave scanner only covers Arbitrum V3 and liquidation-style health factor monitoring.
- USD normalization is candidate-level using Aave base currency totals; reserve-level asset path normalization is still deferred.
- Discovery is based on recent Borrow logs and persisted watchlist targets.
- No DEX quote, exact gas simulation, or priority-fee bidding model yet.
- Flashloan premium is read from Aave; slippage, gas, and priority fee are still placeholder risk inputs.
- No queue layer yet.

Operations:

- `continuum-mini` services are user-level systemd units, not system services, because sudo requires an interactive password.
- LAN UI access works on port `3000`; direct API access on `4000` depends on firewall state.
- No documented deployment/update script yet.
- No backup or restore procedure for the `protocol_atlas` database.
- No automated log pruning or table retention job.
- Root disk on the mini is usable but tight and should be watched.

Testing:

- TypeScript builds are the main verification path today.
- No unit/integration test suite is established.
- No scanner fixture tests.
- No API route tests.
- No operator-web component tests.

## Verification Commands

Local:

```bash
./node_modules/.bin/tsc -b apps/api/tsconfig.json --pretty false
./node_modules/.bin/tsc -p apps/operator-web/tsconfig.json --noEmit
./node_modules/.bin/tsc -b services/scanner-worker/tsconfig.json --pretty false
./node_modules/.bin/tsc -b packages/core packages/db --pretty false
```

Mini:

```bash
ssh continuum-mini
cd /opt/protocol-atlas
git status --short
git pull --ff-only
pnpm --filter @protocol-atlas/api build
pnpm --filter @protocol-atlas/operator-web build
pnpm --filter @protocol-atlas/scanner-worker build
systemctl --user restart protocol-atlas-api.service protocol-atlas-web.service
```

Runtime checks:

```bash
curl 'http://127.0.0.1:4000/health'
curl 'http://127.0.0.1:4000/opportunities'
curl 'http://127.0.0.1:4000/liquidation-candidates?limit=2'
curl 'http://127.0.0.1:4000/watchlist-targets?limit=2'
curl 'http://127.0.0.1:4000/scan-runs?limit=2'
curl 'http://127.0.0.1:3000/liquidations'
curl 'http://127.0.0.1:3000/api/liquidation-candidates?limit=2'
curl 'http://127.0.0.1:3000/watchlist'
curl 'http://127.0.0.1:3000/api/watchlist-targets?limit=2'
curl 'http://127.0.0.1:3000/api/scan-runs?limit=2'
systemctl --user status protocol-atlas-api.service
systemctl --user status protocol-atlas-web.service
systemctl --user list-timers 'protocol-atlas*'
```

## Next Milestone Checklist

### Milestone A: Make The Deployed System Boring

- [ ] Add `docs/ops/continuum-mini.md` with install, update, service, log, and firewall notes.
- [ ] Add production `start` scripts for API and scanner so systemd units do not depend on dist path details.
- [ ] Add a simple deploy/update script for `/opt/protocol-atlas`.
- [ ] Document the user-level systemd units and why they are user services.
- [ ] Document DB creation, Drizzle push, backup, restore, and retention.
- [ ] Add a readiness endpoint that checks DB connectivity.
- [x] Add scanner run history API route.
- [ ] Add basic log and disk cleanup guidance for the mini.

### Milestone B: Deepen Watchlist Operations

- [x] Build a real watchlist page instead of JSON-only `/watchlist-targets`.
- [x] Add filters for chain, protocol, source, active state, and address search.
- [x] Add counts for active targets, newly discovered targets, stale targets, and failed reads.
- [ ] Link watchlist targets to related opportunities when present.
- [x] Add API pagination for watchlist targets.
- [x] Add scan-run metadata display for discovered/persisted/failed counts.

### Milestone C: Harden Opportunity Review

- [ ] Build opportunity detail / case-file route.
- [ ] Add action history by opportunity.
- [ ] Persist audit events when operator actions are requested.
- [ ] Add stale-data checks before accepting simulate/approve requests.
- [ ] Add skip reason capture.
- [ ] Add review refresh lifecycle.
- [ ] Define simulation-required statuses.

### Milestone D: Improve Scanner Correctness

- [ ] Add fixture tests for Borrow log extraction.
- [ ] Add fixture tests for Aave account-data mapping.
- [ ] Add bounded concurrency for target account reads.
- [ ] Add retry/backoff policy for transient RPC failures.
- [ ] Add scanner config documentation for discovery window, max logs, and threshold.
- [x] Add scan-run API endpoint and UI panel.
- [ ] Add retention/expiry behavior for inactive watchlist targets.

### Milestone E: Prepare Simulation And Execution Contracts

- [x] Classify liquidation candidates as actionable, low-margin, or watch-close.
- [x] Persist candidate-level liquidation economics in opportunity payloads.
- [x] Add liquidation candidates API route.
- [x] Add liquidation cockpit page.
- [ ] Define simulation intent contract separately from opportunity state.
- [ ] Define simulation result schema.
- [ ] Add reserve-level debt/collateral pair discovery.
- [ ] Add DEX quote and slippage model for seized collateral swaps.
- [ ] Add flashloan premium and priority-fee inputs to profitability checks.
- [ ] Define backend-only approval gate.
- [ ] Define execution attempt and outcome records.
- [ ] Keep all signing credentials backend-only.
- [ ] Add failure, retry, and blocked-state audit events.

## Git Workflow Guardrails

Use this workflow for every roadmap item unless explicitly overridden:

- Work on topic branches (`feature/*`, `fix/*`, `chore/*`, `docs/*`) for larger changes.
- Keep branch scope aligned to one roadmap unit.
- Rebase or merge `main` before finalizing work.
- Open a PR for changes that touch service contracts, schema, deployment, or UI behavior.
- Include purpose, verification, and deferred follow-ups in PR descriptions.
- Require passing checks before merge once CI exists.
- Prefer squash merge unless there is a reason not to.
- Delete merged branches after merge.
- Tag significant milestones on `main`.
- If scope changes mid-branch, cut a new branch for unrelated work.

For the deployed mini:

- Keep `/opt/protocol-atlas` Git-clean before `git pull`.
- Prefer commit/push/pull over copying files directly.
- Rebuild affected packages after pulling.
- Restart only affected services when possible.
- Verify HTTP routes and systemd status after restarts.

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
- keep `/opt/protocol-atlas` deploys reproducible through Git whenever possible
