import { Request, Response } from "express";
import { UsageLogService } from "../services/usage-log.service.js";

export class UsageLogController {

    constructor(
        private readonly usageLogService: UsageLogService,
    ) { }

    async findLogs(_req: Request, res: Response): Promise<void> {
        try {
            const logs = this.usageLogService.findLogs();
            res.json({ count: logs.length, latestUsageLogs: logs });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            res.status(502).json({ error: "Log request failed", detail: message });
        }
    }
}