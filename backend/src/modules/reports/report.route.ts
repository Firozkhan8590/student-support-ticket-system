import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getCategoryReport, getStaffPerformanceReport, getTicketReport } from "../../controllers/reports/report.controller";



const router = Router();

router.use(authenticate);

router.get("/tickets", getTicketReport);
router.get(
    "/staff-performance",
    getStaffPerformanceReport
);
router.get("/categories", getCategoryReport);

export default router;