# Architecture Decision Records

> A record of the key decisions made during the development of this project, including context, alternatives considered, and consequences of each choice.

---

## ADR-001: Framework — Express

**Status:** Accepted

**Context:**  
A lightweight framework was needed to expose two REST endpoints. The main criteria was productivity: the time available for the exercise was limited and it was not the right moment to explore unfamiliar technology.

**Decision:**  
Express, as it is the framework I am most familiar with. This allowed me to focus the effort on the business logic (scraping, filtering, logging) rather than on a framework learning curve.

Version 5 (RC) was used, which adds native async error propagation, removing the need for manual `next(err)` calls in handlers.

**Consequences:**  
- Fast and predictable development.
- Mature ecosystem with extensive documentation.
- Express 5 is still RC; stable for this use case but worth monitoring before a production deployment.

---

## ADR-002: Scraping Stack — axios + cheerio

**Status:** Accepted

**Context:**  
The core of the project is fetching and parsing a news webpage. Two decisions were needed: how to make the HTTP request, and how to parse the resulting HTML.

**Decision:**  
`cheerio` for HTML parsing and `axios` for the HTTP request.

Cheerio was chosen after researching the Node.js scraping ecosystem. It is one of the most widely adopted libraries for server-side HTML parsing, with millions of weekly downloads and thorough documentation. Its jQuery-like API makes DOM traversal intuitive and concise, and since it operates on static HTML without spinning up a browser engine, it is lightweight and fast.

For the HTTP layer, axios was already a familiar choice. Beyond familiarity, it has a practical advantage over the native `fetch` API: it automatically throws on non-2xx responses, whereas `fetch` only rejects on network errors and requires a manual `response.ok` check to catch HTTP errors. This makes error handling more straightforward and less error-prone when scraping, where a 429 or 503 from the web should be surfaced immediately.

**Consequences:**  
- No headless browser overhead (Puppeteer/Playwright would add ~100MB+ and significant latency for a page that doesn't need JavaScript execution).
- Fragile to markup changes — the selectors (`.athing`, `.titleline`, `.score`) would need updating if the site restructures. This is an inherent tradeoff of scraping vs. an official API.
- axios adds a dependency that `fetch` would avoid, but the cleaner error handling justifies it for this use case.

---

## ADR-003: Project Structure — Layered MVC-inspired Layout

**Status:** Accepted

**Context:**  
Even for a small project, mixing scraping logic, filtering, and DB writes in a single file creates a maintenance and testing burden. A clear folder structure was needed from the start.

**Decision:**  
The structure follows the layered MVC-inspired layout recommended in [Best Practices for Structuring an Express.js Project](https://dev.to/moibra/best-practices-for-structuring-an-expressjs-project-148i):

```
src/
├── config/       # Database connection and setup
├── controllers/  # HTTP layer: parse input, send response
├── models/       # Raw DB row shapes
├── routes/       # Route definitions
├── services/     # Business logic (crawl, filter, usage log)
├── repositories/ # Data access
└── utils/        # Shared helpers
```

Each layer has a single responsibility. DTOs (`Entry`, `UsageLogParams`, `UsageLogResponse`) are plain interfaces that cross layer boundaries, with no ORM classes.

**Consequences:**  
- Each layer is unit-testable in isolation by mocking the layer below.
- Slightly more files than a flat structure, but each file has a clear, single purpose.
- Consistent with conventions familiar to most Express developers.

---

## ADR-004: Database — SQLite

**Status:** Accepted

**Context:**  
The exercise required persisting usage logs. The most common options are PostgreSQL, MySQL, Redis, or SQLite.

**Decision:**  
SQLite via `better-sqlite3`. It is easy to set up (a single file, no external server) and fits well with the scope of the project: a single-process service with no high write-concurrency requirements.

`PRAGMA journal_mode = WAL` was enabled to allow concurrent reads during writes.

The database file path is configurable via the `DB_PATH` environment variable, making it easy to point to temporary files in tests or CI.

**Consequences:**  
- No additional infrastructure: the project starts with just `npm install`.
- Not suitable for multi-process deployments or high write loads; PostgreSQL would be the right choice in that case.

---

## ADR-005: In-Memory Cache with TTL

**Status:** Accepted

**Context:**  
It was not initially obvious whether caching was necessary. The turning point was thinking about the concurrent usage scenario: if multiple clients query `/entries` simultaneously, without a cache each request would fire a separate HTTP request to the web. This means:

- Unnecessary latency (each fetch takes between 300 and 800ms).
- A real risk of being rate-limited or blocked by the web under load.
- Duplicated work when the page content has not changed.

**Decision:**  
A module-level in-memory cache with a 30-second TTL. A cache hit returns a response in under 1ms. Once the TTL expires, the next request fetches fresh data.

External alternatives such as Redis were ruled out as overkill for a single-process service.

**Consequences:**  
- Dramatically reduces latency and load in concurrent usage scenarios.
- The 30-second TTL balances data freshness and efficiency.

---

## ADR-006: Node.js Worker Threads — Rejected

**Status:** Rejected

**Context:**  
During research, the article [Multithreading in Node.js with worker threads](https://blog.logrocket.com/multithreading-node-js-worker-threads/) was reviewed. It showed examples of using Worker Threads to parallelise tasks across CPU cores, which initially seemed like it could speed up scraping.

**Why it was rejected:**  
The article itself makes the key distinction clear: Worker Threads are designed for **CPU-bound** tasks — heavy computations that block the event loop. Hacker News scraping is **I/O-bound**: the bottleneck is waiting for the HTTP response and parsing a small HTML document, not computation.

Node.js already handles I/O asynchronously and non-blockingly through its event loop, so adding workers would bring no real performance benefit for this workload.

Workers also introduce significant complexity: communication via `postMessage`, data serialisation between threads, and worker lifecycle management. The article even recommends using a worker pool library (like `workerpool`) to avoid overhead — all of this for zero gain in an I/O-bound context.

**Decision:**  
Standard async/await over Node.js's event loop, which is the correct model for I/O-bound workloads.

---

## ADR-007: Services as Functions vs. Classes

**Status:** Accepted

**Context:**  
When designing the service layer, the question arose of whether all services should be classes or whether some could be plain exported functions.

**Decision:**  
After researching the topic, the conclusion was that classes are not always the right choice in TypeScript/JavaScript. The following criteria were adopted:

- **Class** when the service needs to hold state or receive injected dependencies (e.g. `UsageLogService` receives a `UsageLogRepository`; `EntriesController` receives `UsageLogService`). The class makes the dependency contract explicit and simplifies mocking in tests.
- **Exported function** when the service is stateless and has no external dependencies (e.g. `crawl` in `crawl.service.ts`, `applyFilter` in `filter.service.ts`). A plain function is more direct and adds no unnecessary indirection.

**Consequences:**  
- The code reflects the nature of each piece rather than forcing a single pattern everywhere.
- Services with DI are testable by injecting mocks through the constructor.
- Functional services are tested by importing directly and mocking their external dependencies (e.g. axios for the crawl).

---

## ADR-008: Test Framework — Vitest

**Status:** Accepted

**Context:**  
A testing framework was needed for the project. Although Jest is the most widely used option in the Node/TypeScript ecosystem, Vitest has been gaining a strong reputation in the community for its speed and modern defaults, which motivated exploring it as an alternative.

**Decision:**  
Vitest. Although I had no deep prior experience with it, research showed it is the framework with the highest adoption growth in modern TypeScript projects. Its API is Jest-compatible (`describe`, `it`, `expect`, `vi.mock`), making the transition straightforward, and it has native ESM support with zero additional configuration.

The project was also a learning opportunity: gaining hands-on experience with Vitest, layered mocking patterns, and how to structure tests for services with injected dependencies.

**Consequences:**  
- Tests run significantly faster than Jest (native Vite transforms, no Babel).
- Code coverage via `@vitest/coverage-v8` with no additional plugins.
- Practical knowledge gained of a framework with strong momentum in both frontend and backend TypeScript ecosystems.