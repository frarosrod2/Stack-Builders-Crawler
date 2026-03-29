import { FilterType } from "../dtos/usage-log-params.dto.js";

export const VALID_FILTERS: FilterType[] = ['long_titles', 'short_titles'];

export const isValidFilter = (filter: string | null): filter is FilterType => {
    return VALID_FILTERS.includes(filter as FilterType);
};
