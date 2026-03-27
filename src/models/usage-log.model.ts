export interface UsageLog {
    id: number;
    timestamp: string;
    filter_applied: string | null;
    items_found: number;
    execution_time_ms: number;
    user_agent: string | null;
    client_ip: string | null;
}
