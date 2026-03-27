import { Request, Response } from "express";
import { UsageLogRepository } from "../repositories/usage-log.repository.js";
import { crawl } from "../services/crawl.service.js";
import { applyFilter } from "../services/filter.service.js";
import { isValidFilter, VALID_FILTERS } from "../utils/filter-helper.js";


export const filterController = async (req: Request, res: Response): Promise<void> => {
    const start = Date.now();
    const filterType = req.query["type"] as string;

    if (!isValidFilter(filterType)) {
        res.status(400).json({ error: "Invalid filter type", valid: VALID_FILTERS });
        return;
    }

    try {
        const entries = await crawl();
        const filtered = applyFilter(entries, filterType);
        const usageLogRepository = new UsageLogRepository();
        usageLogRepository.create({
            timestamp: new Date().toISOString(),
            filterApplied: filterType,
            itemsFound: filtered.length,
            executionTimeMs: Date.now() - start
        });

        res.json({ filter: filterType, count: filtered.length, entries: filtered });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: "Filter failed", detail: message });
    }
};