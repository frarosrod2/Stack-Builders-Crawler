# Crawler

A REST API that scrapes the first 30 entries from [Hacker News](https://news.ycombinator.com/) and exposes them with optional filtering. Built with Node.js, TypeScript, Express 5, and SQLite.

---

## Features

- Scrapes rank, title, points, and comment count for the top 30 Hacker News entries
- Two filters available via query param:
  - **`long_titles`** — entries with more than 5 words in the title, sorted by comments (descending)
  - **`short_titles`** — entries with 5 or fewer words in the title, sorted by points (descending)
- In-memory cache with a 30-second TTL to avoid hammering Hacker News on every request
- Every request is logged to a local SQLite database (timestamp, filter applied, execution time, items found, client IP, user agent)

> Word counting follows the spec: tokens are split by whitespace; any token with no alphanumeric character (e.g. standalone `-`, `!!!`) is excluded.  
> `"This is - a self-explained example"` → **5 words**.

---

## Tech Stack

| Concern | Library |
|---|---|
| HTTP server | Express 5 |
| HTTP client | axios |
| HTML parsing | cheerio |
| Database | SQLite via better-sqlite3 |
| Testing | Vitest |
| Language | TypeScript 5 |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

Server starts on `http://localhost:3000` by default.

### Run (production)

```bash
npm run build
npm run start
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `DB_PATH` | `src/data/crawler.db` | Path to the SQLite database file |

---

## API Reference

### `GET /entries`

Returns the top 30 Hacker News entries. Optionally filtered and sorted.

**Query params**

| Param | Values | Description |
|---|---|---|
| `filter` | `long_titles` \| `short_titles` | Apply a filter+sort (omit for raw list) |

**Examples**

```bash
# All entries, no filter
curl http://localhost:3000/entries

# More than 5 words in title, sorted by comments
curl "http://localhost:3000/entries?filter=long_titles"

# 5 or fewer words in title, sorted by points
curl "http://localhost:3000/entries?filter=short_titles"
```

**Response**

```json
{
  "count": 30,
  "result": [
    {
      "rank": 1,
      "title": "Some interesting article title",
      "points": 342,
      "comments": 87
    }
  ]
}
```

---

### `GET /logs`

Returns the last 100 usage log entries (most recent first).

```bash
curl http://localhost:3000/logs
```

**Response**

```json
{
  "count": 3,
  "latestUsageLogs": [
    {
      "id": 3,
      "timestamp": "2026-03-28T19:45:01.000Z",
      "filterApplied": "long_titles",
      "itemsFound": 18,
      "executionTimeMs": 412,
      "userAgent": "curl/8.1.0",
      "clientIp": "127.0.0.1"
    }
  ]
}
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests are organised per layer — each layer is tested in isolation by mocking the one below it:

| Test file | What it covers |
|---|---|
| `crawl.service.test.ts` | HTML parsing, cache behaviour, entry limits |
| `filter.service.test.ts` | Word counting, filter correctness, sort order |
| `filter-helper.test.ts` | `isValidFilter` edge cases |
| `entry.service.test.ts` | Filter delegation, passthrough when no filter |
| `entries.controller.test.ts` | HTTP layer, log recording, error handling |
| `usage-log.service.test.ts` | DB mapping, snake_case → camelCase, defaults |

---

## Project Structure

```
src/
├── config/
│   └── database.ts          # SQLite connection + migrations
├── controllers/
│   ├── entries.controller.ts
│   └── usage-log.controller.ts
├── dtos/                    # Plain interfaces crossing layer boundaries
│   ├── entry.dto.ts
│   ├── usage-log-params.dto.ts
│   └── usage-log-response.dto.ts
├── models/
│   └── usage-log.model.ts   # Raw DB row shape (snake_case)
├── repositories/
│   └── usage-log.repository.ts
├── routes/
│   └── index.ts
├── services/
│   ├── crawl.service.ts     # Scraping + in-memory cache
│   ├── entry.service.ts     # Orchestrates crawl + filter
│   ├── filter.service.ts    # Word count + sort logic
│   └── usage-log.service.ts
└── utils/
    └── filter-helper.ts

tests/                       # Tests
ADR.md                       # Architecture Decision Records
```

---

## Architecture Decisions

See [`ADR.md`](./ADR.md) for the full reasoning behind the main design choices (language, framework, scraping approach, caching strategy, storage, word-counting algorithm, and testing framework).