import { Router } from "express";
import { crawlController } from "../controllers/crawl.controller.js";
import { filterController } from "../controllers/filter.controller.js";

const router = Router();

router.get("/crawl", crawlController);
router.get("/filter", filterController);

export default router;