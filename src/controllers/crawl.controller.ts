import type { Request, Response } from "express";
import { UsageLogRepository } from "../repositories/usage-log.repository.js";
import { crawl } from "../services/crawl.service.js";

export const crawlController = async (_req: Request, res: Response): Promise<void> => {
    const start = Date.now();
    try {
        const entries = await crawl();
        const crawledAt = new Date().toISOString();
        const usageLogRepository = new UsageLogRepository();
        usageLogRepository.create({
            timestamp: crawledAt,
            filterApplied: "none",
            itemsFound: entries.length,
            executionTimeMs: Date.now() - start,
        });
        res.json({ count: entries.length, entries });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(502).json({ error: "Crawl failed", detail: message });
    }
};
