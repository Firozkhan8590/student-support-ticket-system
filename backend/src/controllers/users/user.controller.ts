import { Request, Response } from "express";
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} from "../../modules/users/user.service";
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
} from "../../validators/staff.validator";

export const createStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createStaffSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const staff = await createStaff(validation.data);

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: staff,
    });
  } catch (error: any) {
    console.error("Create staff error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create staff member",
    });
  }
};

export const getAllStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    const staff = await getAllStaff();

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    console.error("Get staff error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch staff members",
    });
  }
};

export const getStaffByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const staffId = Number(req.params.id);

    if (Number.isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const staff = await getStaffById(staffId);

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    console.error("Get staff by ID error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Staff member not found",
    });
  }
};

export const updateStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    const staffId = Number(req.params.id);

    if (Number.isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const validation = updateStaffSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const staff = await updateStaff(
      staffId,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: staff,
    });
  } catch (error: any) {
    console.error("Update staff error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update staff member",
    });
  }
};

export const updateStaffStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const staffId = Number(req.params.id);

    if (Number.isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const validation = updateStaffStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const staff = await updateStaffStatus(
      staffId,
      validation.data.isActive
    );

    return res.status(200).json({
      success: true,
      message: validation.data.isActive
        ? "Staff member activated successfully"
        : "Staff member deactivated successfully",
      data: staff,
    });
  } catch (error: any) {
    console.error("Update staff status error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update staff status",
    });
  }
};