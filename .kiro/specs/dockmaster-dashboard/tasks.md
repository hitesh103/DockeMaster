# Implementation Plan: DockMaster Dashboard

## Overview

Incremental implementation across four phases. Each task builds on the previous, ending with all components wired together. The existing backend has a basic Express + Dockerode skeleton and the frontend has a plain React/Vite setup — both need to be extended significantly.

## Tasks

- [x] 1. Install dependencies and configure tooling
  - Install frontend deps: `react-router-dom`, `@shadcn/ui` (via CLI), `lucide-react`, `xterm`, `xterm-addon-fit`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`
  - Install backend deps: `jsonwebtoken`, `bcrypt`, `better-sqlite3`, `simple-git`, `ws`, `nodemailer`, `uuid`
  - Install dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `jest`, `@jest/globals` (backend)
  - Initialize shadcn/ui (`npx shadcn@latest init`) with dark theme and Tailwind CSS v4 config
  - Add `vitest.config.js` to frontend; add `jest.config.js` to backend with ESM support
  - Add `fc.configureGlobal({ numRuns: 100 })` in test setup files
  - _Requirements: 1.3, 1.4_

- [x] 2. Backend: SQLite database setup and auth service
  - Create `backend/src/db/db.js` — better-sqlite3 singleton opening `data/dockmaster.db`
  - Create `backend/src/db/schema.js` — run `CREATE TABLE IF NOT EXISTS` for `users`, `token_blocklist`, `audit_logs`, `nodes`, `registries`, `alert_config`; call on app startup
  - Create `backend/src/services/auth_service.js` — `signToken(user)`, `verifyToken(token)`, `blockToken(jti, exp)`, `isBlocked(jti)`, `hashPassword(plain)`, `checkPassword(plain, hash)`; seed a default admin user if `users` table is empty
  - Create `backend/src/middlewares/auth_middleware.js` — `requireAuth` (verify JWT, check blocklist, attach `req.user`); `requireAdmin` (check `req.user.role === 'admin'`)
  - Create `backend/src/api/auth.js` — `POST /api/auth/login` and `POST /api/auth/logout`
  - Wire auth router into `backend/src/app.js`
  - _Requirements: 13.2, 13.3, 13.6, 13.8, 14.1_

  - [ ]* 2.1 Write property test for JWT sign/verify (Property 17)
    - **Property 17: JWT contains role claim and 24-hour expiry**
    - **Validates: Requirements 13.2, 14.1**
    - Arbitrary: `fc.constantFrom('admin', 'viewer')`

  - [ ]* 2.2 Write property test for invalid JWT → 401 (Property 20)
    - **Property 20: Protected routes return 401 for invalid JWT**
    - **Validates: Requirements 13.6**
    - Arbitrary: `fc.string()` (invalid token strings)

  - [ ]* 2.3 Write property test for logout token blocklist (Property 21)
    - **Property 21: Logout invalidates token on server**
    - **Validates: Requirements 13.8**

  - [ ]* 2.4 Write unit tests for auth_service
    - Valid JWT passes middleware; expired JWT returns 401; missing JWT returns 401; Viewer JWT on mutating route returns 403
    - _Requirements: 13.6, 14.2_


- [x] 3. Backend: Audit middleware and audit log service
  - Create `backend/src/services/audit_service.js` — `write({ actor, action, targetId, targetName, outcome, detail })` and `query({ actor, action, from, to, page, pageSize })`
  - Create `backend/src/middlewares/audit_middleware.js` — intercepts mutating requests (POST/PUT/DELETE), calls `audit_service.write()` after response with outcome derived from status code
  - Create `backend/src/api/audit_logs.js` — `GET /api/audit-logs` with query params for actor, action, date range, page
  - Wire audit router and audit middleware into `app.js`
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 3.1 Write property test for audit log SQLite round-trip (Property 23)
    - **Property 23: Audit log entries round-trip through SQLite**
    - **Validates: Requirements 15.4, 20.3**
    - Arbitrary: `fc.record(auditEntryArb)`

  - [ ]* 3.2 Write property test for audit log sorted descending (Property 24)
    - **Property 24: Audit log table sorted by timestamp descending**
    - **Validates: Requirements 15.2**
    - Arbitrary: `fc.array(auditEntryArb)`

  - [ ]* 3.3 Write property test for audit log filter (Property 25)
    - **Property 25: Audit log filter returns only matching entries**
    - **Validates: Requirements 15.3**
    - Arbitrary: `fc.record(filterArb)` + `fc.array(auditEntryArb)`

  - [ ]* 3.4 Write property test for audit log written for every mutation (Property 22)
    - **Property 22: Audit log entry written for every mutating action**
    - **Validates: Requirements 15.1**
    - Arbitrary: `fc.constantFrom(...mutatingActions)`


- [x] 4. Backend: Complete container and image API routes
  - Extend `backend/src/api/containers.js` — add `POST /api/containers/:id/restart`, `GET /api/containers/:id/inspect`, `GET /api/containers/:id/stats`, `POST /api/containers/deploy` (pull + create + start); apply `requireAuth` and `requireAdmin` where needed
  - Create `backend/src/services/container_service.js` — `deploy(opts)` calls `docker.pull` then `docker.createContainer` then `container.start`; map Dockerode errors to HTTP status codes
  - Create `backend/src/api/images.js` — `GET /api/images` and `DELETE /api/images/:id`; return 409 if image in use
  - Wire images router into `app.js`
  - _Requirements: 2.5, 2.8, 3.3, 4.2, 4.3, 5.4_

  - [ ]* 4.1 Write unit test for container_service deploy order
    - Verify `docker.pull` is called before `container.start`
    - _Requirements: 4.2_

  - [ ]* 4.2 Write property test for inspect payload JSON round-trip (Property 34)
    - **Property 34: Container inspect payload JSON round-trip**
    - **Validates: Requirements 20.2**
    - Arbitrary: `fc.record(inspectPayloadArb)`

- [x] 5. Checkpoint — Ensure all backend auth, audit, and container tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Frontend: React Router, AuthContext, and protected layout
  - Replace `frontend/src/App.jsx` with a `BrowserRouter` + route tree; add `/login` and a `ProtectedLayout` wrapper that reads JWT from `localStorage` and redirects to `/login` if absent or expired
  - Create `frontend/src/context/AuthContext.jsx` — `AuthProvider` with `useReducer`; exposes `user`, `token`, `login()`, `logout()`; `login()` calls `POST /api/auth/login` and stores JWT; `logout()` calls `POST /api/auth/logout` and clears localStorage
  - Update `frontend/src/services/api.js` — Axios instance with `baseURL`, `Authorization` interceptor reading token from context/localStorage, global 401 interceptor that redirects to `/login`, 403 toast handler
  - Create `frontend/src/pages/Login.jsx` — shadcn/ui Form with username + password fields; show Alert on 401
  - _Requirements: 13.1, 13.4, 13.5, 13.7, 13.9_

  - [ ]* 6.1 Write property test for all requests include Bearer JWT (Property 18)
    - **Property 18: All API requests after login include Bearer JWT**
    - **Validates: Requirements 13.4**
    - Arbitrary: `fc.string()` (token values)

  - [ ]* 6.2 Write property test for expired JWT redirects to login (Property 19)
    - **Property 19: Expired or absent JWT redirects to login**
    - **Validates: Requirements 13.5**


- [x] 7. Frontend: App shell — Sidebar, TopHeader, and dark theme
  - Create `frontend/src/components/layout/AppShell.jsx` — persistent sidebar + top header using shadcn/ui `NavigationMenu` and `Sheet` (mobile drawer); highlight active nav item via `NavLink`
  - Create `frontend/src/components/layout/Sidebar.jsx` — nav links to all pages; collapses to Sheet below 768px (Requirement 1.5)
  - Create `frontend/src/components/layout/TopHeader.jsx` — page title + username + Logout button
  - Apply dark Tailwind classes globally in `frontend/src/index.css`; ensure all shadcn/ui components inherit dark theme
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 8. Frontend: Containers page and lifecycle actions
  - Replace `frontend/src/pages/Dashboard.jsx` with a proper `ContainersPage` at `/containers`; use shadcn/ui `Table` to render name, image, status, state, created time, ports
  - Create `frontend/src/components/containers/ContainerRow.jsx` — renders Start/Stop/Restart/Remove buttons based on `state`; disables buttons and shows spinner while action in progress; hides all buttons for Viewer role
  - Wire action buttons to `api.js` calls; refresh list on success; show shadcn/ui `Toast` (via `sonner`) on error
  - Create `frontend/src/pages/ContainerDetailPage.jsx` — fetches `GET /api/containers/:id/inspect` and renders all fields; shows Alert on 404
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10, 3.1, 3.2, 3.4_

  - [ ]* 8.1 Write property test for container row buttons match state (Property 1)
    - **Property 1: Container row buttons match container state**
    - **Validates: Requirements 2.3, 2.4**
    - Arbitrary: `fc.record({ State: fc.constantFrom('running','exited','paused') })`

  - [ ]* 8.2 Write property test for container table renders all fields (Property 2)
    - **Property 2: Container table renders all required fields**
    - **Validates: Requirements 2.2, 2.1**
    - Arbitrary: `fc.array(containerArb)`

  - [ ]* 8.3 Write property test for Viewer hides action buttons (Property 3)
    - **Property 3: Viewer role hides all action buttons**
    - **Validates: Requirements 2.10, 14.2**
    - Arbitrary: `fc.array(containerArb)` with Viewer context

  - [ ]* 8.4 Write property test for container detail renders all inspect fields (Property 5)
    - **Property 5: Container detail page renders all inspect fields**
    - **Validates: Requirements 3.2**
    - Arbitrary: `fc.record(inspectPayloadArb)`


- [x] 9. Frontend: Deploy form and Images page
  - Create `frontend/src/pages/DeployPage.jsx` — shadcn/ui Form with image name (required), container name, env key-value pairs (repeatable), port mappings (repeatable), volume mounts (repeatable), restart policy dropdown; submit disabled when image name is empty/whitespace; show inline Alert on 422; redirect to `/containers` on success
  - Create `frontend/src/pages/ImagesPage.jsx` — shadcn/ui Table with repository, tag, short ID, size (MB), created date; Remove button per row; show Toast on 409
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.5_

  - [ ]* 9.1 Write property test for deploy form submit disabled on empty image name (Property 6)
    - **Property 6: Deploy form submit disabled for empty/whitespace image name**
    - **Validates: Requirements 4.6**
    - Arbitrary: `fc.string().filter(s => s.trim() === '')`

  - [ ]* 9.2 Write property test for image table renders all fields (Property 7)
    - **Property 7: Image table renders all required fields**
    - **Validates: Requirements 5.2, 5.1**
    - Arbitrary: `fc.array(imageArb)`

- [x] 10. Backend: Viewer RBAC enforcement
  - Add `requireAdmin` middleware to all mutating routes (POST/PUT/DELETE) across containers, images, deploy, services, stacks, registries, nodes, volumes, networks, users, alerts
  - _Requirements: 14.2_

  - [ ]* 10.1 Write property test for Viewer JWT → 403 on mutations (Property 4)
    - **Property 4: Viewer JWT causes 403 on all mutating endpoints**
    - **Validates: Requirements 14.2**
    - Arbitrary: `fc.constantFrom(...mutatingEndpoints)`

- [x] 11. Checkpoint — Ensure all Phase 1 tests pass (auth, containers, images, deploy, RBAC)
  - Ensure all tests pass, ask the user if questions arise.


- [x] 12. Backend: WebSocket server setup and container log streaming
  - Install and configure `ws` library; attach WebSocket server to the existing HTTP server in `app.js`; add JWT verification on upgrade via `?token=` query param
  - Create `backend/src/ws/logs_ws.js` — handle `/api/containers/:id/logs`; call `container.logs({ follow: true, stdout: true, stderr: true, tail })` and pipe chunks to the WebSocket client
  - Create `backend/src/ws/terminal_ws.js` — handle `/api/containers/:id/terminal`; create exec session with `AttachStdin/Stdout/Stderr/Tty: true`; relay keystrokes from WS to exec stdin; relay exec output to WS; terminate exec on WS close
  - _Requirements: 6.1, 6.3, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 12.1 Write property test for terminal bidirectional relay (Property 12)
    - **Property 12: Terminal bidirectional relay**
    - **Validates: Requirements 8.4, 8.5**
    - Arbitrary: `fc.array(fc.uint8Array())`

- [x] 13. Frontend: Log viewer page
  - Create `frontend/src/hooks/useContainerLogs.js` — manages WebSocket lifecycle; exposes `lines`, `connected`, `reconnect()`; appends incoming lines to state array
  - Create `frontend/src/pages/LogsPage.jsx` — shadcn/ui `ScrollArea` in monospace font; tail selector (50/100/500/All) that closes and reopens WS with new `tail` param; "Disconnected" Badge + Reconnect button on WS close; "Download logs" button that saves buffered lines as `.txt`
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

  - [ ]* 13.1 Write property test for log viewer renders all lines (Property 8)
    - **Property 8: Log viewer renders all lines and scrolls to newest**
    - **Validates: Requirements 6.2**
    - Arbitrary: `fc.array(fc.string())`

  - [ ]* 13.2 Write property test for tail selector re-establishes stream (Property 9)
    - **Property 9: Tail selector re-establishes stream with correct value**
    - **Validates: Requirements 6.4**
    - Arbitrary: `fc.constantFrom(50, 100, 500, 'all')`


- [x] 14. Frontend: Container browser terminal page
  - Install `xterm` and `xterm-addon-fit` in frontend
  - Create `frontend/src/pages/TerminalPage.jsx` — renders xterm.js `Terminal` inside a shadcn/ui Dialog or full page; connects to `ws://host/api/containers/:id/terminal`; sends keystrokes via `terminal.onData`; writes incoming bytes via `terminal.write`; uses `FitAddon` to resize on window resize
  - Disable "Open Terminal" button in `ContainerRow` when container state is not `running`; show tooltip explaining requirement
  - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.7_

  - [ ]* 14.1 Write property test for terminal button disabled when not running (Property 13)
    - **Property 13: Open Terminal button disabled for non-running containers**
    - **Validates: Requirements 8.7**
    - Arbitrary: `fc.constantFrom('exited','paused','created')`

- [x] 15. Backend: Per-container stats endpoint and stats WebSocket stream
  - Add `GET /api/containers/:id/stats` to containers router — calls `container.stats({ stream: false })`, computes CPU % from delta CPU / system delta, returns `{ containerId, name, cpu, memory, networkRx, networkTx, timestamp }`
  - Create `backend/src/services/stats_service.js` — polls all running containers every 5s; broadcasts `{ containers: [...] }` JSON to all connected `/api/stats/stream` clients
  - Create `backend/src/ws/stats_ws.js` — handle `/api/stats/stream`; register/deregister clients with `stats_service`
  - _Requirements: 7.1, 7.3, 16.2, 16.3_

  - [ ]* 15.1 Write unit test for CPU percentage calculation
    - Verify delta CPU / system delta formula against known values
    - _Requirements: 7.3_

  - [ ]* 15.2 Write property test for stats stream broadcasts every 5s (Property 27)
    - **Property 27: Stats stream broadcasts every 5 seconds**
    - **Validates: Requirements 16.3**
    - Use fake timers


- [x] 16. Frontend: Per-container metrics page and dashboard home stat cards
  - Create `frontend/src/hooks/useContainerStats.js` — polls `GET /api/containers/:id/stats` every 2s; keeps last 60 snapshots in state
  - Create `frontend/src/pages/MetricsPage.jsx` — shadcn/ui `ChartContainer` (Recharts) area charts for CPU %, memory MB, network RX/TX; apply warning color class when CPU > 80%; cap at 60 data points
  - Create `frontend/src/hooks/useGlobalStats.js` — connects to `ws://host/api/stats/stream`; keeps last 30 snapshots
  - Create `frontend/src/pages/DashboardHome.jsx` — four shadcn/ui `Card` stat cards (total/running/stopped containers, total images); `GlobalMetricsChart` area chart for CPU + bar chart for memory using `useGlobalStats`
  - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 16.1, 16.4, 16.5_

  - [ ]* 16.1 Write property test for metrics chart retains ≤ 60 points (Property 10)
    - **Property 10: Metrics chart retains at most 60 data points**
    - **Validates: Requirements 7.4**
    - Arbitrary: `fc.array(statsArb, { minLength: 61, maxLength: 200 })`

  - [ ]* 16.2 Write property test for CPU warning above 80% (Property 11)
    - **Property 11: CPU warning highlight applied above 80%**
    - **Validates: Requirements 7.6**
    - Arbitrary: `fc.float({ min: 0, max: 100 })`

  - [ ]* 16.3 Write property test for global stats retains ≤ 30 snapshots (Property 26)
    - **Property 26: Global stats chart retains at most 30 snapshots**
    - **Validates: Requirements 16.5**
    - Arbitrary: `fc.array(globalStatsArb, { minLength: 31, maxLength: 100 })`

- [x] 17. Checkpoint — Ensure all Phase 2 WebSocket and metrics tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 18. Backend: Git deploy service and build log WebSocket
  - Create `backend/src/services/deploy_service.js` — `gitDeploy({ repositoryUrl, branch, dockerfilePath, imageTag, env })`: uses `simple-git` to clone to a temp dir, spawns `docker build` via `child_process`, streams stdout/stderr to a job log buffer, cleans up temp dir on completion (success or failure); returns `jobId`
  - Create `backend/src/api/deploy.js` — `POST /api/deploy/git` starts job, returns `{ jobId }`; apply `requireAuth` + `requireAdmin`
  - Create `backend/src/ws/git_logs_ws.js` — handle `/api/deploy/git/:jobId/logs`; stream buffered + live build log lines to client
  - Wire deploy router into `app.js`
  - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 18.1 Write property test for Git deploy cleans temp dir (Property 14)
    - **Property 14: Git deploy cleans up temp directory on completion**
    - **Validates: Requirements 9.7**
    - Arbitrary: `fc.record(gitDeployArb)`

- [x] 19. Frontend: Git deploy tab on Deploy page
  - Add a "Deploy from Git" tab to `DeployPage.jsx` — fields for repository URL, branch, Dockerfile path, image tag, env vars; on submit calls `POST /api/deploy/git`, then opens WS to `ws://host/api/deploy/git/:jobId/logs` and streams build output into a scrollable log panel; show Alert on 422
  - _Requirements: 9.1, 9.4, 9.5, 9.6_


- [x] 20. Backend: Registry service and API
  - Create `backend/src/services/registry_service.js` — CRUD for registry configs in SQLite; encrypt password with AES-256-GCM before storing; `testConnection(id)` authenticates against registry; `listImages(id)` calls Docker Registry HTTP API v2 `/v2/_catalog`; `pull(imageRef, registryId)` calls `docker.pull` with auth options
  - Create `backend/src/api/registries.js` — `GET /api/registries`, `POST /api/registries`, `GET /api/registries/:id/images`, `POST /api/registries/:id/test`; strip password from GET responses
  - Wire registries router into `app.js`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 20.1 Write property test for registry passwords not in response (Property 15)
    - **Property 15: Registry passwords never returned in plaintext**
    - **Validates: Requirements 10.3**
    - Arbitrary: `fc.array(registryArb)`

- [x] 21. Frontend: Registries page
  - Create `frontend/src/pages/RegistriesPage.jsx` — list registries with name, URL, status; "Add Registry" form (shadcn/ui Form) with name, URL, username, password; "Test Connection" button per row; show Toast on auth failure
  - _Requirements: 10.1, 10.2, 10.4, 10.7_


- [x] 22. Backend: Swarm services, stacks, volumes, and networks APIs
  - Create `backend/src/services/swarm_service.js` — `listServices()`, `scaleService(id, replicas)`, `removeService(id)`, `listStacks()`, `deployStack(name, yaml)`, `removeStack(name)`; return 503 if Docker not in Swarm mode
  - Create `backend/src/api/services.js` — `GET /api/services`, `POST /api/services/:id/scale`, `DELETE /api/services/:id`
  - Create `backend/src/api/stacks.js` — `GET /api/stacks`, `POST /api/stacks`, `DELETE /api/stacks/:name`; validate YAML before deploy, return 422 on parse error
  - Create `backend/src/api/volumes.js` — `GET /api/volumes`, `DELETE /api/volumes/:name`; return 409 if in use
  - Create `backend/src/api/networks.js` — `GET /api/networks`, `DELETE /api/networks/:id`; return 409 if in use
  - Wire all four routers into `app.js`
  - _Requirements: 11.2, 11.4, 11.5, 11.6, 11.7, 12.3, 12.4, 12.5, 18.2, 18.4, 18.5_

  - [ ]* 22.1 Write property test for scale updates replica count (Property 16)
    - **Property 16: Scale action updates service replica count**
    - **Validates: Requirements 11.4**
    - Arbitrary: `fc.integer({ min: 0, max: 100 })`

- [x] 23. Frontend: Services, Stacks, Volumes, and Networks pages
  - Create `frontend/src/pages/ServicesPage.jsx` — shadcn/ui Table with service name, image, replicas (current/desired), update status; Scale button opens Dialog with numeric input; show Alert on 503
  - Create `frontend/src/pages/StacksPage.jsx` — list stacks; "Deploy Stack" Dialog with name field + YAML textarea; show Alert on 422
  - Create `frontend/src/pages/VolumesPage.jsx` — Table with name, driver, mount point, in-use status; Remove button; Toast on 409
  - Create `frontend/src/pages/NetworksPage.jsx` — Table with name, driver, subnet, connected containers; Remove button; Toast on 409
  - _Requirements: 11.1, 11.3, 11.7, 12.1, 12.2, 18.1, 18.3, 18.5_

  - [ ]* 23.1 Write property test for volume table renders all fields (Property 31)
    - **Property 31: Volume table renders all required fields**
    - **Validates: Requirements 18.1**
    - Arbitrary: `fc.array(volumeArb)`

  - [ ]* 23.2 Write property test for network table renders all fields (Property 32)
    - **Property 32: Network table renders all required fields**
    - **Validates: Requirements 18.3**
    - Arbitrary: `fc.array(networkArb)`


- [x] 24. Backend: Node management API
  - Create `backend/src/services/node_client.js` — map of `nodeId → Dockerode` instances; `addNode(config)` creates instance with TCP + optional TLS; `pingNode(id)` with 5s timeout
  - Create `backend/src/api/nodes.js` — `GET /api/nodes`, `POST /api/nodes`, `DELETE /api/nodes/:id`, `GET /api/nodes/:id/health`; health check returns `{ reachable: bool }` within 5s
  - Wire nodes router into `app.js`
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [ ]* 24.1 Write property test for node health responds within 5s (Property 33)
    - **Property 33: Node health check responds within 5 seconds**
    - **Validates: Requirements 19.4**
    - Arbitrary: `fc.record(nodeArb)`

- [x] 25. Frontend: Nodes page
  - Create `frontend/src/pages/NodesPage.jsx` — Table with hostname, IP, Docker version, status Badge (Reachable/Unreachable), Swarm role; "Add Node" form with hostname, IP, port, TLS cert upload; "Unreachable" Badge when health check fails
  - _Requirements: 19.1, 19.2, 19.5_

- [x] 26. Checkpoint — Ensure all Phase 2 infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 27. Backend: User management API
  - Create `backend/src/api/users.js` — `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`; all protected by `requireAuth` + `requireAdmin`; `POST` hashes password with bcrypt; `PUT` for role change does not invalidate existing tokens (reflected on next login per Requirement 14.6)
  - Wire users router into `app.js`
  - _Requirements: 14.3, 14.5, 14.6_

- [x] 28. Frontend: Users management page and audit logs page
  - Create `frontend/src/pages/UsersPage.jsx` — Admin-only page; Table with username and role; "Create User" Dialog (shadcn/ui Form) with username, password, role dropdown; Edit and Delete buttons per row
  - Create `frontend/src/pages/AuditLogsPage.jsx` — paginated shadcn/ui Table (50/page) sorted by timestamp desc; filter controls for actor, action type, date range; failure rows rendered with error color
  - _Requirements: 14.3, 14.4, 15.2, 15.3, 15.5_


- [x] 29. Backend: Alert service — crash detection and CPU threshold alerts
  - Create `backend/src/services/alert_service.js` — subscribe to `docker.getEvents()` and detect `die` events; trigger alert when exit code ≠ 0; track per-container consecutive CPU breach count; trigger alert after 3 consecutive polls above threshold; dispatch to email (nodemailer) and/or webhook (HTTP POST); retry email once after 60s on failure; expose `saveConfig(config)` and `getConfig()` (redact SMTP password and webhook token in GET)
  - Create `backend/src/api/alerts.js` — `GET /api/alerts/config` and `POST /api/alerts/config`; apply `requireAuth` + `requireAdmin`
  - Wire alerts router into `app.js`; start event listener on app startup
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.8_

  - [ ]* 29.1 Write property test for die event triggers alert (Property 28)
    - **Property 28: Container die event with non-zero exit code triggers alert**
    - **Validates: Requirements 17.1, 17.2, 17.3**
    - Arbitrary: `fc.integer({ min: 1, max: 255 })`

  - [ ]* 29.2 Write property test for CPU threshold alert after 3 polls (Property 29)
    - **Property 29: CPU threshold alert fires after 3 consecutive breaches**
    - **Validates: Requirements 17.6**
    - Arbitrary: `fc.array(fc.float({ min: 91, max: 100 }), { minLength: 3 })`

  - [ ]* 29.3 Write unit test for die event with exit code 0 does not trigger alert
    - _Requirements: 17.1_

  - [ ]* 29.4 Write property test for alert config GET redacts sensitive fields (Property 30)
    - **Property 30: Alert config GET redacts sensitive fields**
    - **Validates: Requirements 17.5**
    - Arbitrary: `fc.record(alertConfigArb)`

- [x] 30. Frontend: Alerts settings page
  - Create `frontend/src/pages/AlertsSettingsPage.jsx` — shadcn/ui Form with CPU threshold input, email recipients, SMTP settings, webhook URL; save calls `POST /api/alerts/config`; load current config from `GET /api/alerts/config` on mount
  - _Requirements: 17.7_


- [x] 31. Wire all frontend routes into the Router
  - Update `App.jsx` route tree to include all pages under `ProtectedLayout`: `/` (DashboardHome), `/containers`, `/containers/:id`, `/images`, `/stacks`, `/services`, `/registries`, `/deploy`, `/terminal/:id`, `/logs/:id`, `/metrics/:id`, `/nodes`, `/volumes`, `/networks`, `/users` (Admin only), `/audit-logs`, `/alerts`
  - Ensure Sidebar nav links match all routes; active link highlighting works for all entries
  - Add Admin-only route guard for `/users` that redirects Viewers to `/`
  - _Requirements: 1.1, 1.2, 14.3_

- [x] 32. Backend: Global error handler and HTTP error conventions
  - Update the Express global error handler in `app.js` to map Dockerode error codes to correct HTTP statuses (404 for "no such container/image", 409 for "conflict", 503 for "Swarm not active")
  - Ensure no stack traces are exposed in production responses
  - Add `express.json()` parse error handler returning 400 with descriptive message
  - _Requirements: 20.1, 20.4_

- [x] 33. Frontend: Global error handling wiring
  - Ensure Axios interceptors in `api.js` handle all error conventions: 401 → redirect to login + clear localStorage; 403 → Toast "You don't have permission"; 409 → Toast with conflict detail; 422 → inline Alert in relevant form; 500 → generic Toast
  - Ensure all WebSocket hooks set `connected: false` on close and expose `reconnect()` that re-opens the connection
  - _Requirements: 2.6, 4.4, 5.5, 6.5, 11.7, 12.5, 18.5_

- [ ] 34. Final checkpoint — Ensure all tests pass end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with `fc.configureGlobal({ numRuns: 100 })`
- Backend tests use Jest with ESM support; frontend tests use Vitest + React Testing Library
- Each property test must include the comment: `// Feature: dockmaster-dashboard, Property N: <property_text>`
