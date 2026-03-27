import axios from "axios";
import * as cheerio from "cheerio";
import { Entry } from "../dtos/entry.dto.js";

const ENTRIES_LIMIT = 30;
const SOURCE_URL = "https://news.ycombinator.com/";

const parseIntSafe = (text = ""): number => {
    const digits = text.replace(/[^0-9]/g, "");
    return digits ? parseInt(digits, 10) : 0;
};

export const crawl = async (url = SOURCE_URL): Promise<Entry[]> => {
    const { data: html } = await axios.get<string>(url, {
        headers: { "User-Agent": "hn-crawler/1.0 (educational project)" },
        timeout: 10_000,
    });

    const $ = cheerio.load(html);
    const entries: Entry[] = [];

    $(".athing").each((_, titleRow) => {
        if (entries.length >= ENTRIES_LIMIT) return false;

        const rank = parseIntSafe($(".rank", titleRow).text());
        const title = $(".titleline > a", titleRow).first().text().trim();
        const sub = $(titleRow).next();

        const points = parseIntSafe($(".score", sub).text());
        const commentLink = $("a", sub)
            .filter((_, a) => /comment|discuss/.test($(a).text()))
            .last();
        const comments = parseIntSafe(commentLink.text());

        if (rank && title) entries.push({ rank, title, points, comments });
    });

    return entries;
};