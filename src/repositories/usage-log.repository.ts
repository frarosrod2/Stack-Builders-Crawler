import { Database } from "better-sqlite3";
import { getDb } from "../config/database.js";
import { UsageLogParams } from "../dtos/usage-log-params.dto.js";
import { UsageLog } from "../models/usage-log.model.js";

export class UsageLogRepository {
    private db: Database;

    constructor(db?: Database) {
        this.db = db ?? getDb();
    }

    public create(params: UsageLogParams): UsageLog {
        const stmt = this.db.prepare(`
        INSERT INTO usage_logs (timestamp, filter_applied, items_found, execution_time_ms, user_agent, client_ip)
        VALUES (@timestamp, @filterApplied, @itemsFound, @executionTimeMs, @userAgent, @clientIp)
        `);

        const { lastInsertRowid } = stmt.run(params);

        return this.db
            .prepare("SELECT * FROM usage_logs WHERE id = ?")
            .get(Number(lastInsertRowid)) as UsageLog;
    }

    public findAll(limit = 100): UsageLog[] {
        return this.db
            .prepare("SELECT * FROM usage_logs ORDER BY timestamp DESC LIMIT ?")
            .all(limit) as UsageLog[];
    }
}