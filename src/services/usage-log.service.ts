import { FilterType, UsageLogParams } from "../dtos/usage-log-params.dto.js";
import { UsageLogResponse } from "../dtos/usage-log-response.dto.js";
import { UsageLogRepository } from "../repositories/usage-log.repository.js";
import { isValidFilter } from "../utils/filter-helper.js";

export class UsageLogService {
    private readonly repo: UsageLogRepository;

    constructor(repo: UsageLogRepository = new UsageLogRepository()) {
        this.repo = repo;
    }

    public createLog(params: UsageLogParams): void {
        this.repo.create(params);
    }

    public findLogs(limit = 100): UsageLogResponse[] {
        return this.repo.findAll(limit).map((usageLog) => {
            const filterApplied: FilterType = isValidFilter(usageLog.filter_applied)
                ? usageLog.filter_applied
                : "none";
            return {
                id: usageLog.id,
                timestamp: usageLog.timestamp,
                filterApplied,
                itemsFound: usageLog.items_found,
                executionTimeMs: usageLog.execution_time_ms,
                userAgent: usageLog.user_agent,
                clientIp: usageLog.client_ip,
            };
        });
    }
}