import { Router } from "express";
import {
    authenticate,
    requireRole,
} from "../../middleware/auth.middleware";
import { getDashboardStats } from "../../controllers/dashboard/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get(
    "/stats",
    requireRole("STAFF", "MANAGER"),
    getDashboardStats
);

export default router;