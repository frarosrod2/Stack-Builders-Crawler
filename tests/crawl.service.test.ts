import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TTL_MS } from "../src/services/crawl.service";

vi.mock("axios");

const buildHtml = (count: number): string => {
  const rows = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return `
      <tr class="athing" id="${n}">
        <td class="title"><span class="rank">${n}.</span></td>
        <td class="title">
          <span class="titleline"><a href="https://example.com/${n}">Entry ${n}</a></span>
        </td>
      </tr>
      <tr>
        <td class="subtext">
          <span class="score">${n * 10} points</span>
          <a href="item?id=${n}">${n * 2} comments</a>
        </td>
      </tr>`;
  }).join("\n");

  return `<table>${rows}</table>`;
};

describe("Crawl Service", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns exactly 30 entries when the page has more than 30", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(35) });

    //It is important to import the crawl function after setting up the mock to reset cache for each test
    const { crawl } = await import("../src/services/crawl.service");
    const result = await crawl();

    expect(result).toHaveLength(30);
  });

  it("returns all entries when the page has fewer than 30", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(10) });

    const { crawl } = await import("../src/services/crawl.service");
    const result = await crawl();

    expect(result).toHaveLength(10);
  });

  it("returns exactly 30 entries when the page has exactly 30", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(30) });

    const { crawl } = await import("../src/services/crawl.service");
    const result = await crawl();

    expect(result).toHaveLength(30);
  });

  it("parses rank, points and comments for every returned entry", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(5) });

    const { crawl } = await import("../src/services/crawl.service");
    const result = await crawl();

    result.forEach((entry, idx) => {
      const n = idx + 1;
      expect(entry.rank).toBe(n);
      expect(entry.points).toBe(n * 10);
      expect(entry.comments).toBe(n * 2);
    });
  });

  it("entries are returned in document order (rank ascending)", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(5) });

    const { crawl } = await import("../src/services/crawl.service");
    const result = await crawl();
    const ranks = result.map((e) => e.rank);

    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("skips entries that have no rank or no title", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: `
        <table>
          <tr class="athing" id="1">
            <td class="title"><span class="rank"></span></td>
            <td class="title">
              <span class="titleline"><a href="#">Valid entry</a></span>
            </td>
          </tr>
        </table>`,
    });

    const { crawl } = await import("../src/services/crawl.service");
    const result = await crawl();

    expect(result).toHaveLength(0);
  });

  it("handles an entry whose points are missing (defaults to 0)", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: `
        <table>
          <tr class="athing" id="99">
            <td class="title"><span class="rank">1.</span></td>
            <td class="title">
              <span class="titleline"><a href="#">No points here</a></span>
            </td>
          </tr>
          <tr>
            <td class="subtext">
              <a href="item?id=99">5 comments</a>
            </td>
          </tr>
        </table>`,
    });

    const { crawl } = await import("../src/services/crawl.service");
    const result = await crawl();

    expect(result).toHaveLength(1);
    expect(result[0].points).toBe(0);
  });

  it("forwards the custom URL to axios", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: "<table></table>" });

    const { crawl } = await import("../src/services/crawl.service");
    await crawl("https://custom-hn-mirror.example.com/");

    expect(axios.get).toHaveBeenCalledWith(
      "https://custom-hn-mirror.example.com/",
      expect.any(Object),
    );
  });

  it("does not fetch again if cache is still valid", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(30) });

    const { crawl } = await import("../src/services/crawl.service");
    await crawl();

    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(1) });
    const cachedResult = await crawl();

    expect(cachedResult).toHaveLength(30);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("fetches again after TTL expires", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: buildHtml(5) });

    const { crawl } = await import("../src/services/crawl.service");

    vi.spyOn(Date, "now").mockReturnValue(1000);
    await crawl();

    vi.spyOn(Date, "now").mockReturnValue(1000 + CACHE_TTL_MS + 1);
    await crawl();

    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
