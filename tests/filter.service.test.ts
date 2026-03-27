import { describe, expect, it } from "vitest";
import { Entry } from "../src/dtos/entry.dto";
import { applyFilter } from './../src/services/filter.service';

const entries: Entry[] = [
    { rank: 1, title: "Short title", points: 10, comments: 5 },
    { rank: 2, title: "This is a longer title example", points: 20, comments: 2 },
    { rank: 3, title: "Another very long title example here", points: 5, comments: 10 },
    { rank: 4, title: "Short-title with --- hyphens !!!!! test 4", points: 5, comments: 10 },
];

describe("applyFilter", () => {
    it("long_titles should filter correctly", () => {
        const result = applyFilter(entries, "long_titles");

        expect(result.length).toBe(2);
        expect(result[0].comments).toBeGreaterThanOrEqual(result[1].comments);
    });

    it("long_titles should filter correctly", () => {
        const result = applyFilter(entries, "short_titles");

        expect(result.length).toBe(2);
        expect(result[0].points).toBeGreaterThanOrEqual(result[1].points);
    });


    it("unknown filter should throw error", () => {
        expect(() => applyFilter(entries, "none")).toThrow();
    });
});