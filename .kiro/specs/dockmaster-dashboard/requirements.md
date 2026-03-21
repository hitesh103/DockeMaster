# Requirements Document

## Introduction

DockMaster is a self-hosted Docker container management dashboard — a Portainer alternative built with React + Vite + Tailwind (shadcn/ui) on the frontend and Node.js + Express + Dockerode on the backend. It provides a dark-themed, sidebar-driven UI for managing containers, images, Docker Swarm services, deployments, logs, metrics, user access, and real-time monitoring across one or more Docker hosts.

The feature covers four phases:
- Phase 1 (MVP): Container listing and lifecycle actions, deploy from form
- Phase 2 (Core Infrastructure): Git-based deploy, registry integration, logs/metrics, Swarm scaling, browser terminal
- Phase 3 (Security & Access): JWT auth, RBAC, audit logs
- Phase 4 (Monitoring & Alerts): Real-time resource graphs, crash/health alerts

---

## Glossary

- **Dashboard**: The main React frontend application served to the browser
- **API_Server**: The Node.js/Express backend that proxies Docker Engine commands
- **Docker_Client**: The Dockerode instance connecting to the Docker socket
- **Container**: A running or stopped Docker container managed by the Docker Engine
- **Image**: A Docker image stored in the local Docker Engine or a remote registry
- **Service**: A Docker Swarm service (replicated or global)
- **Stack**: A multi-service deployment defined by a docker-compose.yml file
- **Registry**: A Docker image registry (Docker Hub, GHCR, GitLab Registry, or private)
- **Terminal**: A browser-based PTY shell session connected to a container via WebSocket
- **Log_Viewer**: The UI component that streams and displays container stdout/stderr logs
- **Metrics_Chart**: The UI component that renders real-time CPU/RAM/network usage graphs using shadcn/ui chart primitives
- **Stat_Card**: A shadcn/ui Card component displaying a single summary metric (e.g., total containers, running count)
- **Sidebar**: The persistent left-navigation component built with shadcn/ui that provides access to all dashboard sections
- **User**: An authenticated human operator interacting with the Dashboard
- **Admin**: A User with full read/write access to all resources and settings
- **Viewer**: A User with read-only access; cannot perform lifecycle or destructive actions
- **JWT**: A JSON Web Token issued by the API_Server upon successful login, used to authenticate subsequent requests
- **Session**: A browser-side authenticated state maintained via a stored JWT
- **Audit_Log**: An immutable record of every action performed by a User, stored by the API_Server
- **Alert**: A notification triggered by a container crash or resource threshold breach, delivered via email or webhook
- **Git_Deploy**: A deployment workflow that clones a Git repository, optionally builds a Docker image, and runs the resulting container
- **WebSocket**: A persistent bidirectional connection used for log streaming, terminal sessions, and real-time events

---

## Requirements

### Requirement 1: Dark-Themed shadcn/ui Shell Layout

**User Story:** As a User, I want a consistent dark-themed dashboard shell with a left sidebar, so that I can navigate all sections without losing context.

#### Acceptance Criteria

1. THE Dashboard SHALL render a persistent Sidebar on the left containing navigation links to: Containers, Images, Stacks, Services, Registries, Deploy, Terminal, Logs, Metrics, Users, and Audit Logs.
2. THE Sidebar SHALL highlight the currently active navigation item using a distinct visual indicator.
3. THE Dashboard SHALL use shadcn/ui components (Sheet, NavigationMenu, or custom Sidebar primitive) for the Sidebar implementation.
4. THE Dashboard SHALL apply a dark color theme (dark background, light text) consistently across all pages using Tailwind CSS dark mode classes.
5. WHEN the viewport width is below 768px, THE Dashboard SHALL collapse the Sidebar into a hamburger-triggered drawer using the shadcn/ui Sheet component.
6. THE Dashboard SHALL display a top header bar showing the current page title and the authenticated User's display name.

---

### Requirement 2: Container Listing and Lifecycle Actions

**User Story:** As an Admin, I want to view all containers and control their lifecycle, so that I can manage running workloads from the browser.

#### Acceptance Criteria

1. WHEN the Containers page loads, THE Dashboard SHALL fetch and display all containers (running and stopped) from the API_Server in a shadcn/ui Table component.
2. THE Table SHALL display for each Container: name, image, status, state, created time, and exposed ports.
3. WHEN a Container's state is `running`, THE Dashboard SHALL render Start, Stop, Restart, and Remove action buttons for that row.
4. WHEN a Container's state is not `running`, THE Dashboard SHALL render Start and Remove action buttons for that row.
5. WHEN an Admin clicks Stop, Start, Restart, or Remove, THE API_Server SHALL perform the corresponding Docker Engine action and return a success or error response within 10 seconds.
6. IF the Docker Engine action fails, THEN THE Dashboard SHALL display an error message using a shadcn/ui Toast notification.
7. WHEN a lifecycle action completes successfully, THE Dashboard SHALL refresh the container list automatically.
8. THE API_Server SHALL expose `POST /api/containers/:id/start`, `POST /api/containers/:id/stop`, `POST /api/containers/:id/restart`, and `DELETE /api/containers/:id` endpoints.
9. WHILE a lifecycle action is in progress, THE Dashboard SHALL disable the action buttons for that Container row and show a loading indicator.
10. WHERE the Viewer role is active, THE Dashboard SHALL render the Container table in read-only mode with all action buttons hidden.

---

### Requirement 3: Container Detail Inspection

**User Story:** As an Admin, I want to inspect a container's full configuration, so that I can diagnose issues without using the CLI.

#### Acceptance Criteria

1. WHEN an Admin clicks a container name in the table, THE Dashboard SHALL navigate to a Container detail page.
2. THE Container detail page SHALL display: container ID, image, command, created timestamp, environment variables, port bindings, volume mounts, network settings, and restart policy.
3. THE API_Server SHALL expose `GET /api/containers/:id/inspect` that returns the raw Docker inspect payload.
4. IF the container no longer exists when the detail page loads, THEN THE API_Server SHALL return HTTP 404 and THE Dashboard SHALL display a shadcn/ui Alert indicating the container was not found.

---

### Requirement 4: Deploy Container from Form

**User Story:** As an Admin, I want to deploy a new container by filling out a form, so that I can launch workloads without writing CLI commands.

#### Acceptance Criteria

1. THE Deploy page SHALL render a shadcn/ui Form with fields for: image name (required), container name (optional), environment variables (key-value pairs, repeatable), port mappings (host:container, repeatable), volume mounts (host:container, repeatable), and restart policy (dropdown: no, always, on-failure, unless-stopped).
2. WHEN an Admin submits the form with a valid image name, THE API_Server SHALL pull the image if not present locally and create and start the container.
3. THE API_Server SHALL expose `POST /api/containers/deploy` accepting a JSON body with image, name, env, ports, volumes, and restartPolicy fields.
4. IF the image pull fails, THEN THE API_Server SHALL return HTTP 422 with a descriptive error message and THE Dashboard SHALL display the error in a shadcn/ui Alert.
5. WHEN the container is successfully deployed, THE Dashboard SHALL display a success Toast and redirect to the Containers page.
6. THE Deploy form SHALL validate that the image name field is non-empty before enabling the submit button.

---

### Requirement 5: Docker Image Management

**User Story:** As an Admin, I want to view and remove local Docker images, so that I can reclaim disk space and audit what is cached.

#### Acceptance Criteria

1. WHEN the Images page loads, THE Dashboard SHALL fetch and display all local images from the API_Server in a shadcn/ui Table.
2. THE Table SHALL display for each Image: repository, tag, image ID (short), size in MB, and created date.
3. WHEN an Admin clicks Remove on an image row, THE API_Server SHALL remove the image from the Docker Engine.
4. THE API_Server SHALL expose `GET /api/images` and `DELETE /api/images/:id` endpoints.
5. IF an image is in use by a running Container, THEN THE API_Server SHALL return HTTP 409 and THE Dashboard SHALL display a shadcn/ui Toast with the conflict message.

---

### Requirement 6: Real-Time Container Logs

**User Story:** As an Admin, I want to stream container logs in the browser, so that I can debug issues without SSH access.

#### Acceptance Criteria

1. WHEN an Admin opens the Logs page for a Container, THE Dashboard SHALL establish a WebSocket connection to the API_Server and begin streaming stdout and stderr log lines.
2. THE Log_Viewer SHALL render log lines in a monospace font inside a scrollable shadcn/ui ScrollArea component with the newest line always visible.
3. THE API_Server SHALL expose a WebSocket endpoint at `ws://host/api/containers/:id/logs` that streams Docker log output using Dockerode's `container.logs` stream.
4. THE Log_Viewer SHALL support a "tail N lines" selector (options: 50, 100, 500, All) that re-establishes the stream with the selected tail value.
5. WHEN the WebSocket connection is lost unexpectedly, THE Dashboard SHALL display a reconnect button and a shadcn/ui Badge indicating "Disconnected".
6. THE Log_Viewer SHALL provide a "Download logs" button that saves the currently buffered log content as a `.txt` file.

---

### Requirement 7: Real-Time Resource Metrics

**User Story:** As an Admin, I want to see live CPU, memory, and network usage per container, so that I can identify resource bottlenecks.

#### Acceptance Criteria

1. WHEN an Admin opens the Metrics page for a Container, THE Dashboard SHALL poll `GET /api/containers/:id/stats` every 2 seconds and update the Metrics_Chart.
2. THE Metrics_Chart SHALL render separate area charts for CPU usage (%), memory usage (MB), network RX bytes, and network TX bytes using shadcn/ui chart components (Recharts-based).
3. THE API_Server SHALL expose `GET /api/containers/:id/stats` that returns a single stats snapshot from Dockerode's `container.stats({ stream: false })`.
4. THE Metrics_Chart SHALL retain the last 60 data points per metric to display a rolling time window.
5. THE Dashboard home page SHALL display Stat_Cards showing: total containers, running containers, stopped containers, and total images count.
6. WHEN a Container's CPU usage exceeds 80% in a stats snapshot, THE Dashboard SHALL highlight the CPU chart in a warning color.

---

### Requirement 8: Container Browser Terminal

**User Story:** As an Admin, I want to open an interactive shell inside a container from the browser, so that I can run commands without leaving the dashboard.

#### Acceptance Criteria

1. WHEN an Admin clicks "Open Terminal" on a running Container, THE Dashboard SHALL open a Terminal panel using xterm.js rendered inside a shadcn/ui Dialog or dedicated page.
2. THE Terminal SHALL establish a WebSocket connection to `ws://host/api/containers/:id/terminal`.
3. THE API_Server SHALL expose a WebSocket endpoint at `/api/containers/:id/terminal` that creates a Docker exec session with `AttachStdin: true`, `AttachStdout: true`, `AttachStderr: true`, and `Tty: true`.
4. WHEN the User types in the Terminal, THE Dashboard SHALL send keystrokes over the WebSocket to the API_Server which SHALL forward them to the exec session stdin.
5. WHEN the exec session produces output, THE API_Server SHALL forward the bytes over the WebSocket and THE Terminal SHALL render them via xterm.js.
6. WHEN the Terminal WebSocket is closed, THE API_Server SHALL terminate the exec session.
7. IF the Container is not in `running` state, THEN THE Dashboard SHALL disable the "Open Terminal" button and display a tooltip explaining the container must be running.

---

### Requirement 9: Git-Based Container Deployment

**User Story:** As an Admin, I want to deploy a container by providing a Git repository URL, so that I can run code directly from source without manual image builds.

#### Acceptance Criteria

1. THE Deploy page SHALL include a "Deploy from Git" tab with fields for: repository URL (required), branch (default: main), Dockerfile path (default: Dockerfile), image tag (required), and optional environment variables.
2. WHEN an Admin submits the Git deploy form, THE API_Server SHALL clone the repository to a temporary directory, build a Docker image using the specified Dockerfile, and start a container from the built image.
3. THE API_Server SHALL expose `POST /api/deploy/git` accepting repositoryUrl, branch, dockerfilePath, imageTag, and env fields.
4. WHEN the build is in progress, THE Dashboard SHALL display a live build log stream via WebSocket at `ws://host/api/deploy/git/:jobId/logs`.
5. IF the Git clone fails due to an invalid URL or authentication error, THEN THE API_Server SHALL return HTTP 422 with a descriptive error and THE Dashboard SHALL display it in a shadcn/ui Alert.
6. IF the Docker build fails, THEN THE API_Server SHALL return the build error output and THE Dashboard SHALL display it in the build log stream.
7. WHEN the Git deploy completes successfully, THE API_Server SHALL clean up the temporary clone directory.

---

### Requirement 10: Docker Registry Integration

**User Story:** As an Admin, I want to connect Docker registries and pull images from them, so that I can deploy from private or custom registries.

#### Acceptance Criteria

1. THE Registries page SHALL display a list of configured registries showing: name, URL, and connection status.
2. WHEN an Admin adds a registry, THE Dashboard SHALL present a shadcn/ui Form with fields for: registry name, URL, username, and password.
3. THE API_Server SHALL expose `POST /api/registries` to save registry credentials (password stored encrypted at rest) and `GET /api/registries` to list configured registries.
4. WHEN an Admin clicks "Test Connection" for a registry, THE API_Server SHALL attempt to authenticate with the registry and return success or failure within 10 seconds.
5. THE API_Server SHALL expose `GET /api/registries/:id/images` that lists available image repositories from the connected registry using the Docker Registry HTTP API v2.
6. WHEN pulling an image from a private registry, THE API_Server SHALL use the stored credentials to authenticate the pull request via Dockerode's `docker.pull` with auth options.
7. IF registry credentials are invalid, THEN THE API_Server SHALL return HTTP 401 and THE Dashboard SHALL display a shadcn/ui Toast with an authentication failure message.

---

### Requirement 11: Docker Swarm Services and Scaling

**User Story:** As an Admin, I want to manage Docker Swarm services and scale them, so that I can orchestrate multi-node workloads from the dashboard.

#### Acceptance Criteria

1. WHEN the Services page loads, THE Dashboard SHALL fetch and display all Swarm services in a shadcn/ui Table showing: service name, image, replicas (current/desired), and update status.
2. THE API_Server SHALL expose `GET /api/services` using Dockerode's `docker.listServices()`.
3. WHEN an Admin clicks "Scale" on a service row, THE Dashboard SHALL display a shadcn/ui Dialog with a numeric input for the desired replica count.
4. WHEN an Admin confirms the scale action, THE API_Server SHALL call `service.update()` with the new replica count via Dockerode.
5. THE API_Server SHALL expose `POST /api/services/:id/scale` accepting a `replicas` field.
6. THE API_Server SHALL expose `DELETE /api/services/:id` to remove a Swarm service.
7. IF the Docker Engine is not in Swarm mode, THEN THE API_Server SHALL return HTTP 503 and THE Dashboard SHALL display a shadcn/ui Alert indicating Swarm mode is not active.

---

### Requirement 12: Stack Management

**User Story:** As an Admin, I want to deploy and manage Docker Stacks from docker-compose files, so that I can manage multi-service applications as a unit.

#### Acceptance Criteria

1. THE Stacks page SHALL list all deployed stacks showing: stack name, service count, and status.
2. WHEN an Admin deploys a stack, THE Dashboard SHALL present a form with a stack name field and a textarea for pasting docker-compose YAML content.
3. THE API_Server SHALL expose `POST /api/stacks` that writes the YAML to a temp file and executes `docker stack deploy` via child process.
4. THE API_Server SHALL expose `DELETE /api/stacks/:name` that executes `docker stack rm` via child process.
5. IF the docker-compose YAML is syntactically invalid, THEN THE API_Server SHALL return HTTP 422 with a parse error and THE Dashboard SHALL display it in a shadcn/ui Alert.

---

### Requirement 13: JWT Authentication and Sessions

**User Story:** As a User, I want to log in with a username and password, so that only authorized operators can access the dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL render a Login page at `/login` with username and password fields built using shadcn/ui Form components.
2. WHEN a User submits valid credentials, THE API_Server SHALL return a signed JWT with a 24-hour expiry and the user's role.
3. THE API_Server SHALL expose `POST /api/auth/login` accepting username and password, validating against stored bcrypt-hashed passwords.
4. THE Dashboard SHALL store the JWT in `localStorage` and attach it as a `Bearer` token in the `Authorization` header of all subsequent API requests.
5. WHEN the JWT expires or is absent, THE Dashboard SHALL redirect the User to the Login page.
6. THE API_Server SHALL validate the JWT on every protected route using middleware and return HTTP 401 for missing or invalid tokens.
7. WHEN a User clicks Logout, THE Dashboard SHALL remove the JWT from `localStorage` and redirect to the Login page.
8. THE API_Server SHALL expose `POST /api/auth/logout` that invalidates the session server-side (token blocklist).
9. IF a User submits incorrect credentials, THEN THE API_Server SHALL return HTTP 401 and THE Dashboard SHALL display a shadcn/ui Alert with "Invalid username or password".

---

### Requirement 14: Role-Based Access Control (RBAC)

**User Story:** As an Admin, I want to assign roles to users, so that I can restrict destructive actions to authorized operators only.

#### Acceptance Criteria

1. THE API_Server SHALL support two roles: Admin and Viewer, encoded in the JWT payload.
2. WHILE a User's role is Viewer, THE API_Server SHALL reject any mutating request (POST, PUT, DELETE) with HTTP 403.
3. THE Users page SHALL be accessible only to Admin users and SHALL list all registered users with their roles.
4. WHEN an Admin creates a new user, THE Dashboard SHALL present a shadcn/ui Form with fields for username, password, and role (Admin or Viewer).
5. THE API_Server SHALL expose `POST /api/users`, `GET /api/users`, `PUT /api/users/:id`, and `DELETE /api/users/:id` endpoints, all protected by Admin-only middleware.
6. WHEN an Admin changes a user's role, THE API_Server SHALL update the stored role and any active sessions for that user SHALL reflect the new role on next token refresh.

---

### Requirement 15: Audit Logs

**User Story:** As an Admin, I want to view a history of all actions performed in the dashboard, so that I can trace changes and investigate incidents.

#### Acceptance Criteria

1. THE API_Server SHALL record an Audit_Log entry for every mutating action (container lifecycle, deploy, scale, user management) including: timestamp, actor username, action type, target resource ID, and outcome (success/failure).
2. THE Audit Logs page SHALL display Audit_Log entries in a shadcn/ui Table sorted by timestamp descending, with pagination (50 entries per page).
3. THE API_Server SHALL expose `GET /api/audit-logs` with optional query parameters for filtering by actor, action type, and date range.
4. THE Audit_Log entries SHALL be persisted to a SQLite database via a lightweight ORM (better-sqlite3).
5. WHEN an Audit_Log entry records a failure, THE Dashboard SHALL render that row with a distinct error color in the table.

---

### Requirement 16: Real-Time Resource Graphs

**User Story:** As an Admin, I want to see live resource usage graphs for all containers on the dashboard home page, so that I can monitor the overall health of the system at a glance.

#### Acceptance Criteria

1. THE Dashboard home page SHALL display a Metrics_Chart showing aggregated CPU and memory usage across all running containers, updated every 5 seconds.
2. THE Dashboard SHALL use a WebSocket connection to `ws://host/api/stats/stream` to receive a broadcast of all container stats every 5 seconds.
3. THE API_Server SHALL expose `ws://host/api/stats/stream` that polls all running containers' stats via Dockerode and broadcasts a JSON array of `{ containerId, name, cpu, memory }` objects every 5 seconds.
4. THE Metrics_Chart SHALL render data using shadcn/ui chart components (area chart for CPU, bar chart for memory) with container names as the legend.
5. THE Metrics_Chart SHALL retain the last 30 broadcast snapshots to display a rolling time window.

---

### Requirement 17: Crash and Health Alerts

**User Story:** As an Admin, I want to receive alerts when a container crashes or exceeds resource thresholds, so that I can respond to incidents without actively watching the dashboard.

#### Acceptance Criteria

1. THE API_Server SHALL subscribe to Docker Engine events via Dockerode's `docker.getEvents()` and detect container `die` events.
2. WHEN a container `die` event is received with a non-zero exit code, THE API_Server SHALL trigger an Alert.
3. WHEN an Alert is triggered, THE API_Server SHALL send a notification to all configured alert channels (email and/or webhook URL).
4. THE API_Server SHALL expose `POST /api/alerts/config` to save alert channel configuration: SMTP settings for email or a webhook URL.
5. THE API_Server SHALL expose `GET /api/alerts/config` to retrieve current alert channel configuration (passwords/tokens redacted in response).
6. WHEN a container's CPU usage exceeds a configurable threshold (default 90%) for 3 consecutive stats polls, THE API_Server SHALL trigger an Alert for that container.
7. THE Dashboard SHALL include an Alerts settings page where an Admin can configure the CPU threshold, email recipients, and webhook URL using shadcn/ui Form components.
8. IF the email delivery fails, THEN THE API_Server SHALL log the failure and retry once after 60 seconds.

---

### Requirement 18: Volume and Network Management

**User Story:** As an Admin, I want to view and manage Docker volumes and networks, so that I can clean up unused resources and inspect connectivity.

#### Acceptance Criteria

1. THE Dashboard SHALL include a Volumes section listing all Docker volumes with: name, driver, mount point, and in-use status.
2. THE API_Server SHALL expose `GET /api/volumes` and `DELETE /api/volumes/:name` endpoints using Dockerode.
3. THE Dashboard SHALL include a Networks section listing all Docker networks with: name, driver, subnet, and connected containers.
4. THE API_Server SHALL expose `GET /api/networks` and `DELETE /api/networks/:id` endpoints using Dockerode.
5. IF a volume or network is in use by a running Container, THEN THE API_Server SHALL return HTTP 409 and THE Dashboard SHALL display a shadcn/ui Toast with the conflict message.

---

### Requirement 19: Multi-Server Node Management

**User Story:** As an Admin, I want to add and monitor multiple Docker host nodes, so that I can manage a distributed infrastructure from one dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL include a Nodes page listing all connected Docker hosts with: hostname, IP address, Docker version, status (reachable/unreachable), and role (manager/worker) for Swarm nodes.
2. WHEN an Admin adds a node, THE Dashboard SHALL present a form with fields for: hostname, IP address, port (default 2376), and TLS certificate (optional file upload).
3. THE API_Server SHALL expose `POST /api/nodes`, `GET /api/nodes`, and `DELETE /api/nodes/:id` endpoints to manage node configurations.
4. THE API_Server SHALL expose `GET /api/nodes/:id/health` that attempts a Docker ping to the target node and returns reachable/unreachable status within 5 seconds.
5. WHEN a node becomes unreachable, THE Dashboard SHALL display a shadcn/ui Badge with "Unreachable" status on the Nodes page.

---

### Requirement 20: API Serialization Round-Trip Integrity

**User Story:** As a developer, I want all API request/response payloads to serialize and deserialize correctly, so that data is never silently corrupted between the frontend and backend.

#### Acceptance Criteria

1. THE API_Server SHALL parse all incoming JSON request bodies and serialize all outgoing responses as valid JSON.
2. FOR ALL container inspect payloads returned by `GET /api/containers/:id/inspect`, parsing the JSON response and re-serializing it SHALL produce an equivalent JSON structure (round-trip property).
3. FOR ALL audit log entries written to the database, reading them back and serializing to JSON SHALL produce the same fields and values that were originally written (round-trip property).
4. IF a request body contains malformed JSON, THEN THE API_Server SHALL return HTTP 400 with a descriptive parse error message.
