import { FilterType } from "./usage-log-params.dto.js";

export interface UsageLogResponse {
    id: number;
    timestamp: string;
    filterApplied: FilterType;
    itemsFound: number;
    executionTimeMs: number;
}
