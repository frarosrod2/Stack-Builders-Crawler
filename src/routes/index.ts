import { Router } from "express";
import { EntriesController } from "../controllers/entries.controller.js";
import { UsageLogController } from "../controllers/usage-log.controller.js";
import { UsageLogService } from "../services/usage-log.service.js";

const router = Router();

const entriesController = new EntriesController(
  new UsageLogService(),
);
const usageLogController = new UsageLogController(
  new UsageLogService(),
);

router.get("/entries", (req, res) => entriesController.getEntries(req, res));
router.get("/logs", (req, res) => usageLogController.findLogs(req, res));

export default router;
