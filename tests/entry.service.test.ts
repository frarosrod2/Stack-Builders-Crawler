import { beforeEach, describe, expect, it, vi } from "vitest";
import { Entry } from "../src/dtos/entry.dto";
import { FilterType } from "../src/dtos/usage-log-params.dto";
import * as crawlService from "./../src/services/crawl.service";
import { getEntries } from "./../src/services/entry.service";

describe("EntryService", () => {
  const mockEntries: Entry[] = [
    { rank: 8, title: "Test title", points: 10, comments: 5 },
    {
      rank: 4,
      title: "This is a very very long test title",
      points: 0,
      comments: 0,
    },
  ];

  beforeEach(() => {
    vi.spyOn(crawlService, "crawl").mockResolvedValue(mockEntries);
  });

  it("return all entries when there is no filter", async () => {
    const result = await getEntries();

    expect(result).toEqual(mockEntries);
  });

  it("apply filter if exists", async () => {
    const result = await getEntries("long_titles");

    expect(result.length).toBe(1);
  });

  it("throws error when invalid filter", async () => {
    await expect(getEntries("invalid" as FilterType)).rejects.toThrow();
  });
});
