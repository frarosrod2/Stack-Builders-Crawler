export interface UsageLog {
    id: number;
    timestamp: string;
    filter_applied: string;
    items_found: number;
    execution_time_ms: number;
}
