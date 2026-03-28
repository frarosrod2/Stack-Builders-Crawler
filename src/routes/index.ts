import { Router } from "express";
import { EntriesController } from "../controllers/entries.controller.js";
import { usageLogController } from "../controllers/usage-log.controller.js";
import { EntryService } from "../services/entry.service.js";
import { UsageLogService } from "../services/usage-log.service.js";

const router = Router();

const entriesController = new EntriesController(
  new EntryService(),
  new UsageLogService(),
);

router.get("/entries", entriesController.getEntries);
router.get("/logs", usageLogController);

export default router;
