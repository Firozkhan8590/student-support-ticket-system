import api from "@/lib/api";

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: "STAFF";
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateStaffData {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface UpdateStaffStatusData {
  isActive: boolean;
}

/**
 * Get all staff members
 */
export const getAllStaff = async (): Promise<Staff[]> => {
  const response = await api.get("/users/staff");

  return response.data.data;
};

/**
 * Get one staff member
 */
export const getStaffById = async (
  staffId: number
): Promise<Staff> => {
  const response = await api.get(
    `/users/staff/${staffId}`
  );

  return response.data.data;
};

/**
 * Create staff member
 */
export const createStaff = async (
  data: CreateStaffData
): Promise<Staff> => {
  const response = await api.post(
    "/users/staff",
    data
  );

  return response.data.data;
};

/**
 * Update staff member
 */
export const updateStaff = async (
  staffId: number,
  data: UpdateStaffData
): Promise<Staff> => {
  const response = await api.put(
    `/users/staff/${staffId}`,
    data
  );

  return response.data.data;
};

/**
 * Activate / deactivate staff
 */
export const updateStaffStatus = async (
  staffId: number,
  isActive: boolean
): Promise<Staff> => {
  const response = await api.patch(
    `/users/staff/${staffId}/status`,
    {
      isActive,
    }
  );

  return response.data.data;
};