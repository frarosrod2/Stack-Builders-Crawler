import { describe, expect, it } from "vitest";
import { isValidFilter, VALID_FILTERS } from './../src/utils/filter-helper';

describe("isValidFilter", () => {
    it("returns true for 'long_titles'", () => {
        expect(isValidFilter("long_titles")).toBe(true);
    });

    it("returns true for 'short_titles'", () => {
        expect(isValidFilter("short_titles")).toBe(true);
    });

    it("returns false for 'none'", () => {
        // 'none' is a valid FilterType but not a valid query param
        expect(isValidFilter("none")).toBe(false);
    });

    it("returns false for an empty string", () => {
        expect(isValidFilter("")).toBe(false);
    });

    it("returns false for an arbitrary string", () => {
        expect(isValidFilter("anything")).toBe(false);
    });

    it("returns false for null", () => {
        expect(isValidFilter(null)).toBe(false);
    });
});

describe("VALID_FILTERS", () => {
    it("contains long_titles and short_titles", () => {
        expect(VALID_FILTERS).toContain("long_titles");
        expect(VALID_FILTERS).toContain("short_titles");
    });

    it("does not contain 'none'", () => {
        expect(VALID_FILTERS).not.toContain("none");
    });
});