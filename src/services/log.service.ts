import { FilterType } from "../dtos/usage-log-params.dto.js";
import { UsageLogResponse } from "../dtos/usage-log-response.dto.js";
import { UsageLogRepository } from "../repositories/usage-log.repository.js";
import { isValidFilter } from "../utils/filter-helper.js";

export const findLogs = async (limit = 100): Promise<UsageLogResponse[]> => {
    const usageLogRepository = new UsageLogRepository();
    const usageLogs = usageLogRepository.findAll();
    const usageLogsResponse: UsageLogResponse[] = usageLogs.map(usageLog => {
        const filterTypeApplied: FilterType = isValidFilter(usageLog.filter_applied) ? usageLog.filter_applied : 'none';
        return {
            id: usageLog.id,
            timestamp: usageLog.timestamp,
            filterApplied: filterTypeApplied,
            itemsFound: usageLog.items_found,
            executionTimeMs: usageLog.execution_time_ms,
        };
    });

    return usageLogsResponse;
};