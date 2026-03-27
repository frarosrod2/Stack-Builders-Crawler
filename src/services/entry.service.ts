import { FilterType } from "../dtos/usage-log-params.dto.js";
import { crawl } from "./crawl.service.js";
import { applyFilter } from "./filter.service.js";

export class EntryService {
    async getEntries(filterType?: FilterType) {
        const entries = await crawl();

        if (!filterType) return entries;

        return applyFilter(entries, filterType);
    }
}