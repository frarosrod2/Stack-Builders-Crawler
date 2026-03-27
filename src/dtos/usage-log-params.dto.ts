
export type FilterType = 'long_titles' | 'short_titles' | 'none';

export interface UsageLogParams {
    timestamp: string;
    filterApplied: FilterType;
    itemsFound: number;
    executionTimeMs: number;
}