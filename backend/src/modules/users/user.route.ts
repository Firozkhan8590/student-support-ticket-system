import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../middleware/auth.middleware";

import {
  createStaffController,
  getAllStaffController,
  getStaffByIdController,
  updateStaffController,
  updateStaffStatusController,
} from "../../controllers/users/user.controller";

const router = Router();

router.use(authenticate);

// Staff Management — Manager only

router.post(
  "/staff",
  requireRole("MANAGER"),
  createStaffController
);

router.get(
  "/staff",
  requireRole("MANAGER"),
  getAllStaffController
);

router.get(
  "/staff/:id",
  requireRole("MANAGER"),
  getStaffByIdController
);

router.put(
  "/staff/:id",
  requireRole("MANAGER"),
  updateStaffController
);

router.patch(
  "/staff/:id/status",
  requireRole("MANAGER"),
  updateStaffStatusController
);

export default router;