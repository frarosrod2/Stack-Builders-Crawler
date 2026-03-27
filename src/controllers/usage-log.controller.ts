import { Request, Response } from "express";
import { UsageLogService } from "../services/usage-log.service.js";

const usageLogService = new UsageLogService();

export const usageLogController = async (_req: Request, res: Response): Promise<void> => {
    try {
        const logs = usageLogService.findLogs();
        res.json({ count: logs.length, latestUsageLogs: logs });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(502).json({ error: "Log request failed", detail: message });
    }
};
