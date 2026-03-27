import { Entry } from "../dtos/entry.dto.js";
import { FilterType } from "../dtos/usage-log-params.dto.js";

const countWords = (title: string): number =>
    title
        .split(/\s+/)
        .filter((token) => /[a-zA-Z0-9]/.test(token))
        .length;

const filterMoreThanFiveWords = (entries: Entry[]): Entry[] =>
    entries
        .filter(({ title }) => countWords(title) > 5)
        .sort((a, b) => b.comments - a.comments);

const filterFiveOrLessWords = (entries: Entry[]): Entry[] =>
    entries
        .filter(({ title }) => countWords(title) <= 5)
        .sort((a, b) => b.points - a.points);

export const applyFilter = (entries: Entry[], filterType: FilterType): Entry[] => {
    switch (filterType) {
        case "long_titles": return filterMoreThanFiveWords(entries);
        case "short_titles": return filterFiveOrLessWords(entries);
        default: {
            throw new Error(`Unexpected filter type: ${filterType}`);
        }
    }
};
