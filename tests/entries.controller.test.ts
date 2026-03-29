import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, Mock, MockInstance, vi } from "vitest";
import { EntriesController } from "../src/controllers/entries.controller";
import { Entry } from "../src/dtos/entry.dto";
import * as entryService from '../src/services/entry.service';
import { UsageLogService } from "../src/services/usage-log.service";

const mockEntries: Entry[] = [
  { rank: 1, title: "Short title", points: 10, comments: 5 },
  { rank: 2, title: "This is a longer title here", points: 20, comments: 2 },
];

const mockRes = (): Response =>
  ({
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  }) as unknown as Response;

const mockReq = (query: Record<string, string> = {}): Request =>
  ({
    query,
    get: vi.fn().mockReturnValue("TestAgent/1.0"),
    ip: "127.0.0.1",
  }) as unknown as Request;

describe("EntriesController", () => {
  let getEntriesMock: MockInstance;
  let createLogMock: Mock;
  let controller: EntriesController;

  beforeEach(() => {
    getEntriesMock = vi.spyOn(entryService, 'getEntries').mockResolvedValue(mockEntries);
    createLogMock = vi.fn();

    controller = new EntriesController({
      createLog: createLogMock,
    } as unknown as UsageLogService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns all entries with count when no filter is provided", async () => {
    const req = mockReq();
    const res = mockRes();

    await controller.getEntries(req, res);

    expect(getEntriesMock).toHaveBeenCalledWith(undefined);
    expect(res.json).toHaveBeenCalledWith({
      count: mockEntries.length,
      result: mockEntries,
    });
  });

  it("passes long_titles filter to the service", async () => {
    const req = mockReq({ filter: "long_titles" });
    const res = mockRes();

    await controller.getEntries(req, res);

    expect(getEntriesMock).toHaveBeenCalledWith("long_titles");
  });

  it("passes short_titles filter to the service", async () => {
    const req = mockReq({ filter: "short_titles" });
    const res = mockRes();

    await controller.getEntries(req, res);

    expect(getEntriesMock).toHaveBeenCalledWith("short_titles");
  });

  it("ignores an invalid filter and calls service without filter", async () => {
    const req = mockReq({ filter: "garbage" });
    const res = mockRes();

    await controller.getEntries(req, res);

    expect(getEntriesMock).toHaveBeenCalledWith(undefined);
  });

  it("always records a usage log after a successful request", async () => {
    const req = mockReq({ filter: "long_titles" });
    const res = mockRes();

    await controller.getEntries(req, res);

    expect(createLogMock).toHaveBeenCalledOnce();
    const logArg = createLogMock.mock.calls[0][0];
    expect(logArg.filterApplied).toBe("long_titles");
    expect(logArg.itemsFound).toBe(mockEntries.length);
    expect(logArg.userAgent).toBe("TestAgent/1.0");
    expect(logArg.clientIp).toBe("127.0.0.1");
  });

  it("records filter as 'none' in the log when no valid filter is given", async () => {
    const req = mockReq();
    const res = mockRes();

    await controller.getEntries(req, res);

    const logArg = createLogMock.mock.calls[0][0];
    expect(logArg.filterApplied).toBe("none");
  });

  it("log includes a valid ISO timestamp", async () => {
    const req = mockReq();
    const res = mockRes();
    const before = Date.now();

    await controller.getEntries(req, res);

    const logArg = createLogMock.mock.calls[0][0];
    const loggedTime = new Date(logArg.timestamp).getTime();
    expect(loggedTime).toBeGreaterThanOrEqual(before);
    expect(loggedTime).toBeLessThanOrEqual(Date.now());
  });

  it("log includes a non-negative executionTimeMs", async () => {
    const req = mockReq();
    const res = mockRes();

    await controller.getEntries(req, res);

    const logArg = createLogMock.mock.calls[0][0];
    expect(logArg.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("returns 502 when the entry service throws", async () => {
    getEntriesMock.mockRejectedValue(new Error("network error"));
    const req = mockReq();
    const res = mockRes();

    await controller.getEntries(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Failed to fetch entries" }),
    );
  });

  it("includes the error message in the 502 detail", async () => {
    getEntriesMock.mockRejectedValue(new Error("timeout"));
    const req = mockReq();
    const res = mockRes();

    await controller.getEntries(req, res);

    const body = (res.json as Mock).mock.calls[0][0];
    expect(body.detail).toBe("timeout");
  });
});
