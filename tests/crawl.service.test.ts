import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crawl } from './../src/services/crawl.service';

vi.mock("axios");

describe("crawl", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("parse entry correctly", async () => {
        vi.mocked(axios.get).mockResolvedValue({
            data: `
            <table>
            <tr class="athing" id="123">
                <td class="title">
                    <span class="rank">5.</span>
                </td>
                <td class="title">
                    <span class="titleline">
                        <a href="https://example.com">Test title</a>
                    </span>
                </td>
            </tr>
            <tr>
                <td class="subtext">
                    <span class="score">100 points</span>
                    <a href="item?id=123">50 comments</a>
                </td>
            </tr>
        </table>
        `,
        });

        const result = await crawl();

        expect(result.length).toBe(1);
        expect(result[0].rank).toBe(5);
        expect(result[0].title).toBe('Test title');
        expect(result[0].points).toBe(100);
        expect(result[0].comments).toBe(50);
    });


    it("parse entry without comments correctly", async () => {
        vi.mocked(axios.get).mockResolvedValue({
            data: `
            <table>
            <tr class="athing" id="123">
                <td class="title">
                    <span class="rank">5.</span>
                </td>
                <td class="title">
                    <span class="titleline">
                        <a href="https://example.com">Test title</a>
                    </span>
                </td>
            </tr>
            <tr>
                <td class="subtext">
                    <span class="score">100 points</span>
                    <a href="item?id=123">discuss</a>
                </td>
            </tr>
        </table>
        `,
        });

        const result = await crawl();

        expect(result.length).toBe(1);
        expect(result[0].rank).toBe(5);
        expect(result[0].title).toBe('Test title');
        expect(result[0].points).toBe(100);
        expect(result[0].comments).toBe(0);
    });


    it("do not parse unknown HTML", async () => {
        vi.mocked(axios.get).mockResolvedValue({
            data: `
            <table>
            <tr class="athing" id="123">
                <span>WRONG</span>
                <span>Unknown</span>
            </tr>
        </table>
        `,
        });

        const result = await crawl();

        expect(result.length).toBe(0);
    });


    it("throws error if the request fails", async () => {
        vi.mocked(axios.get).mockRejectedValue(new Error("fail"));

        await expect(crawl()).rejects.toThrow();
    });
});