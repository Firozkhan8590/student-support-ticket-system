import { Request, Response } from "express";
import { createCategorySchema, updateCategorySchema } from "../../validators/category/category.validator";
import * as categoryService from "../../modules/category/category.service";


export const createCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const data = createCategorySchema.parse(req.body);

    const category =
      await categoryService.createCategory(data);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        errors: JSON.parse(error.message),
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create category",
    });
  }
};

export const getCategories = async (
  _req: Request,
  res: Response
) => {
  try {
    const categories =
      await categoryService.getCategories();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch categories",
    });
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category =
      await categoryService.getCategoryById(id);

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Category not found",
    });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const data = updateCategorySchema.parse(req.body);

    const category =
      await categoryService.updateCategory(id, data);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        errors: JSON.parse(error.message),
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update category",
    });
  }
};

export const updateCategoryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const category =
      await categoryService.updateCategoryStatus(
        id,
        isActive
      );

    return res.status(200).json({
      success: true,
      message: "Category status updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update category status",
    });
  }
};