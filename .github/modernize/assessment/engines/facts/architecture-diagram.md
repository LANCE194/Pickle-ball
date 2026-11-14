# Architecture Diagram

DinkNest is a role-based web application delivered by one Node.js process. The diagrams summarize the major application layers and the principal interactions between UI, route modules, services, persistence, and realtime infrastructure.

## Application Architecture

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart TD
    subgraph ClientLayer["Client layer"]
        Browser["Browser and PWA"]
        React["React 18 and Vite"]
    end
    subgraph ApplicationLayer["Application layer - Node.js and Express"]
        Http["HTTP API"]
        Auth["Authentication and role middleware"]
        Feature["Feature guards"]
        Modules["Role feature modules"]
        Services["Shared business services"]
        Realtime["WebSocket gateway"]
    end
    subgraph DataLayer["Data layer"]
        SQLite[("SQLite file")]
        Storage[("Local file storage")]
    end
    subgraph ExternalLayer["Optional external services"]
        Email["SMTP via Nodemailer"]
        SMS["Twilio SMS API"]
    end

    Browser -->|"uses"| React
    React -->|"HTTP requests"| Http
    Http -->|"validates identity and role"| Auth
    Auth -->|"checks optional access"| Feature
    Feature -->|"dispatches"| Modules
    Modules -->|"calls"| Services
    Services -->|"queries and transactions"| SQLite
    Services -->|"stores and reads files"| Storage
    React -->|"authenticated live events"| Realtime
    Realtime -->|"sends scoped updates"| React
    Services -->|"optional email"| Email
    Services -->|"optional SMS"| SMS
~~~

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Client | React | 18.3 | Role-aware SPA and shared UI |
| Client build | Vite | 5.x | Development server and production bundling |
| Styling | Tailwind CSS | 3.x | Responsive design system |
| Server | Node.js and Express | Node 20+ | HTTP API, static hosting, middleware |
| Database | SQLite with better-sqlite3 or Node SQLite fallback | better-sqlite3 11.x | Existing relational database |
| Realtime | ws | 8.x | WebSocket event delivery |
| Email | Nodemailer and configured SMTP | Nodemailer 10.x | Optional email messages |
| SMS | Twilio REST API | External service | Optional SMS delivery |

### Data Storage & External Services

The system persists relational data in the configured SQLite file (default `data/dinknest.db`) and uploads under `data/storage`. SQL is routed through `server/src/config/db.js`, which adapts the shared query syntax to SQLite and provides transaction handling. SMTP and Twilio are optional; credentials are supplied only through environment configuration.

### Key Architectural Decisions

- One Node.js process hosts API, static client, WebSocket gateway, migrations, and scheduled jobs.
- Role/feature modules are discovered from manifests and guarded by server middleware.
- SQLite remains the source of truth; database triggers prevent overlapping active bookings.

## Component Relationships

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart LR
    subgraph Presentation["Presentation"]
        cReact["React application"]
        cPortal["Role portal and route manifests"]
        cShell["Shared app shell"]
        cFeature["Feature pages"]
        cRealtimeHook["Realtime and data hooks"]
        cChatPage["Chat page and contact picker"]
    end
    subgraph HttpLayer["HTTP and access"]
        cApp["Express application"]
        cAuth["Auth and role middleware"]
        cFeatureGuard["Feature middleware"]
        cModules["Discovered role modules"]
        cChat["Chat API and authorization"]
    end
    subgraph Business["Business logic"]
        cBooking["Booking and payment services"]
        cAccount["Account and session services"]
        cDomain["Other domain services"]
        cMessages["Direct message service"]
        cNotification["Notification service"]
    end
    subgraph Infrastructure["Infrastructure"]
        cSql["Shared SQLite query and transaction layer"]
        cDb[("SQLite database")]
        cFiles[("Upload storage")]
        cWs["WebSocket gateway"]
        cMail["SMTP and Twilio clients"]
    end

    cReact -->|"loads role routes"| cPortal
    cPortal -->|"frames screens"| cShell
    cPortal -->|"renders"| cFeature
    cFeature -->|"uses shared hooks"| cRealtimeHook
    cFeature -->|"renders messaging"| cChatPage
    cChatPage -->|"calls chat API"| cApp
    cReact -->|"calls"| cApp
    cApp -->|"authenticates"| cAuth
    cAuth -->|"checks role and feature"| cFeatureGuard
    cFeatureGuard -->|"dispatches route"| cModules
    cModules -->|"routes chat requests"| cChat
    cModules -->|"invokes domain logic"| cBooking
    cModules -->|"invokes domain logic"| cAccount
    cModules -->|"invokes domain logic"| cDomain
    cChat -->|"authorizes and delegates"| cMessages
    cBooking -->|"creates user updates"| cNotification
    cDomain -->|"creates user updates"| cNotification
    cMessages -->|"creates recipient notification"| cNotification
    cBooking -->|"reads and writes"| cSql
    cAccount -->|"reads and writes"| cSql
    cDomain -->|"reads and writes"| cSql
    cMessages -->|"reads and writes"| cSql
    cNotification -->|"persists notifications"| cSql
    cSql -->|"executes SQL"| cDb
    cDomain -->|"stores uploaded content"| cFiles
    cNotification -->|"publishes scoped events"| cWs
    cWs -->|"delivers events"| cRealtimeHook
    cNotification -->|"optional delivery"| cMail
~~~

### Component Inventory

| Component | Layer | Type | Responsibility |
|---|---|---|---|
| React application | Presentation | SPA | Routes and renders the web client |
| Role portal and route manifests | Presentation | Client routing | Loads role features and menus |
| Shared app shell | Presentation | Layout component | Navigation, notifications, help, session shell |
| Feature pages and hooks | Presentation | Components/hooks | Screens, API calls, polling, realtime handling |
| Chat page and contact picker | Presentation | Feature page | Loads eligible contacts, filters by role, searches names, and displays direct conversations |
| Express application | HTTP | Server composition | Middleware, core endpoints, module mounting, errors |
| Auth and role middleware | Access control | Middleware | Identity, role and session enforcement |
| Feature middleware | Access control | Middleware | Optional feature checks on protected routes |
| Discovered role modules | API layer | Routes/controllers/services | Role-specific API boundaries |
| Chat API and authorization | API layer | Routes/controllers | Routes chat requests; feature middleware and service enforce access rules |
| Shared domain services | Business logic | Services | Booking, payment, accounts, competition, membership, site, reports, direct messages |
| Direct message service | Business logic | Service | Discovers eligible contacts and manages one-to-one conversations and text messages |
| Notification service | Business logic | Service | Persist and deliver user-targeted notifications |
| Shared SQLite layer | Data access | Query/transaction helper | SQL adaptation, transactions, SQLite driver |
| SQLite database | Persistence | Relational database | System source of truth |
| Upload storage | Persistence | Filesystem | Private and public image/proof storage |
| WebSocket gateway | Infrastructure | Event gateway | Authenticated and scoped realtime channels |
| SMTP and Twilio clients | Infrastructure | External integrations | Optional email and SMS delivery |
