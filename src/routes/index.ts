import { Router } from "express";
import { entriesController } from "../controllers/entries.controller.js";
import { usageLogController } from "../controllers/usage-log.controller.js";

const router = Router();

router.get("/entries", entriesController);
router.get("/logs", usageLogController);

export default router;