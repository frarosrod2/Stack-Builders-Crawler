import { Procedure } from "@vitest/spy";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { UsageLogParams } from "../src/dtos/usage-log-params.dto";
import { UsageLog } from "../src/models/usage-log.model";
import { UsageLogRepository } from "../src/repositories/usage-log.repository";
import { UsageLogService } from "../src/services/usage-log.service";

vi.mock("../src/repositories/usage-log.repository");

const makeDbLog = (overrides: Partial<UsageLog> = {}): UsageLog => ({
  id: 1,
  timestamp: "2026-03-28T00:00:00.000Z",
  filter_applied: "long_titles",
  items_found: 12,
  execution_time_ms: 350,
  user_agent: "Mozilla/5.0",
  client_ip: "10.0.0.1",
  ...overrides,
});

describe("UsageLogService", () => {
  let createMock: Mock<Procedure>;
  let findAllMock: Mock<Procedure>;
  let service: UsageLogService;

  beforeEach(() => {
    createMock = vi.fn().mockReturnValue(makeDbLog());
    findAllMock = vi.fn().mockReturnValue([]);

    vi.mocked(UsageLogRepository).mockImplementation(function () {
      return { create: createMock, findAll: findAllMock };
    });

    service = new UsageLogService();
  });

  describe("createLog", () => {
    it("delegates to the repository with the exact params", () => {
      const params: UsageLogParams = {
        timestamp: "2024-01-01T00:00:00.000Z",
        filterApplied: "long_titles",
        itemsFound: 5,
        executionTimeMs: 200,
        userAgent: "curl/7.0",
        clientIp: "192.168.1.1",
      };

      service.createLog(params);

      expect(createMock).toHaveBeenCalledOnce();
      expect(createMock).toHaveBeenCalledWith(params);
    });

    it("returns void (does not expose the created row)", () => {
      const result = service.createLog({
        timestamp: "2024-01-01T00:00:00.000Z",
        filterApplied: "none",
        itemsFound: 0,
        executionTimeMs: 0,
        userAgent: null,
        clientIp: null,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("findLogs", () => {
    it("maps snake_case DB fields to camelCase response", () => {
      findAllMock.mockReturnValue([makeDbLog()]);

      const [log] = service.findLogs();

      expect(log.filterApplied).toBe("long_titles");
      expect(log.itemsFound).toBe(12);
      expect(log.executionTimeMs).toBe(350);
      expect(log.userAgent).toBe("Mozilla/5.0");
      expect(log.clientIp).toBe("10.0.0.1");
    });

    it("preserves id and timestamp from the DB row", () => {
      findAllMock.mockReturnValue([
        makeDbLog({ id: 42, timestamp: "2024-06-15T12:00:00.000Z" }),
      ]);

      const [log] = service.findLogs();

      expect(log.id).toBe(42);
      expect(log.timestamp).toBe("2024-06-15T12:00:00.000Z");
    });

    it("returns empty array when there are no logs", () => {
      findAllMock.mockReturnValue([]);

      expect(service.findLogs()).toEqual([]);
    });

    it("returns multiple logs in the same order as the repository", () => {
      findAllMock.mockReturnValue([
        makeDbLog({ id: 3 }),
        makeDbLog({ id: 2 }),
        makeDbLog({ id: 1 }),
      ]);

      const logs = service.findLogs();

      expect(logs.map((l) => l.id)).toEqual([3, 2, 1]);
    });

    it("normalises an unknown filter_applied value to 'none'", () => {
      findAllMock.mockReturnValue([
        makeDbLog({ filter_applied: "corrupted_value" }),
      ]);

      const [log] = service.findLogs();

      expect(log.filterApplied).toBe("none");
    });

    it("normalises a null filter_applied to 'none'", () => {
      findAllMock.mockReturnValue([makeDbLog({ filter_applied: null })]);

      const [log] = service.findLogs();

      expect(log.filterApplied).toBe("none");
    });

    it("passes the limit argument down to the repository", () => {
      service.findLogs(25);

      expect(findAllMock).toHaveBeenCalledWith(25);
    });

    it("uses default limit of 100 when not specified", () => {
      service.findLogs();

      expect(findAllMock).toHaveBeenCalledWith(100);
    });
  });
});
