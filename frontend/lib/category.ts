import api from "@/lib/api";

/* =========================
   TYPES
========================= */

export type CategoryPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface TicketCategory {
  id: number;

  name: string;

  description?: string | null;

  default_priority: CategoryPriority;

  sla_hours: number;

  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}

/* =========================
   CREATE CATEGORY
========================= */

export interface CreateCategoryData {
  name: string;
  description?: string;
  defaultPriority?: CategoryPriority;
  slaHours: number;
}

/* =========================
   UPDATE CATEGORY
========================= */

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  defaultPriority?: CategoryPriority;
  slaHours?: number;
}

/* =========================
   GET ALL CATEGORIES
========================= */

export const getCategories = async (): Promise<
  TicketCategory[]
> => {
  const response = await api.get("/categories");

  return response.data.data;
};

/* =========================
   GET CATEGORY BY ID
========================= */

export const getCategoryById = async (
  categoryId: number
): Promise<TicketCategory> => {
  const response = await api.get(
    `/categories/${categoryId}`
  );

  return response.data.data;
};

/* =========================
   CREATE CATEGORY
========================= */

export const createCategory = async (
  data: CreateCategoryData
): Promise<TicketCategory> => {
  const response = await api.post(
    "/categories",
    data
  );

  return response.data.data;
};

/* =========================
   UPDATE CATEGORY
========================= */

export const updateCategory = async (
  categoryId: number,
  data: UpdateCategoryData
): Promise<TicketCategory> => {
  const response = await api.put(
    `/categories/${categoryId}`,
    data
  );

  return response.data.data;
};

/* =========================
   UPDATE CATEGORY STATUS
========================= */

export const updateCategoryStatus = async (
  categoryId: number,
  isActive: boolean
): Promise<TicketCategory> => {
  const response = await api.patch(
    `/categories/${categoryId}/status`,
    {
      isActive,
    }
  );

  return response.data.data;
};