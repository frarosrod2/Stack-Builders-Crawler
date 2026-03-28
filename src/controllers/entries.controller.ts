import { Request, Response } from "express";
import { EntryService } from "../services/entry.service.js";
import { UsageLogService } from "../services/usage-log.service.js";
import { isValidFilter } from "../utils/filter-helper.js";

export class EntriesController {
  constructor(
    private readonly entryService: EntryService,
    private readonly usageLogService: UsageLogService,
  ) {}

  async getEntries(req: Request, res: Response): Promise<void> {
    const start = Date.now();
    const filter = req.query.filter as string | undefined;

    try {
      const filterType = filter && isValidFilter(filter) ? filter : undefined;
      const result = await this.entryService.getEntries(filterType);

      this.usageLogService.createLog({
        timestamp: new Date().toISOString(),
        filterApplied: filterType ?? "none",
        itemsFound: result.length,
        executionTimeMs: Date.now() - start,
        userAgent: req.get("User-Agent") ?? null,
        clientIp: req.ip ?? null,
      });

      res.json({ count: result.length, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res
        .status(502)
        .json({ error: "Failed to fetch entries", detail: message });
    }
  }
}
