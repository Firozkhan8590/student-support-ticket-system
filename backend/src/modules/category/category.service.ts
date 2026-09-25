import db from "../../config/database";

interface CreateCategoryInput {
    name: string;
    description?: string;
    defaultPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    slaHours: number;
}

interface UpdateCategoryInput {
    name?: string;
    description?: string;
    defaultPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    slaHours?: number;
}

export const createCategory = async (
    data: CreateCategoryInput
) => {
    const existingCategory = await db("ticket_categories")
        .whereRaw("LOWER(name) = LOWER(?)", [data.name])
        .first();

    if (existingCategory) {
        throw new Error("Category already exists");
    }

    const [category] = await db("ticket_categories")
        .insert({
            name: data.name,
            description: data.description || null,
            default_priority: data.defaultPriority || "MEDIUM",
            sla_hours: data.slaHours,
            is_active: true,
        })
        .returning([
            "id",
            "name",
            "description",
            "default_priority",
            "sla_hours",
            "is_active",
            "created_at",
            "updated_at",
        ]);

    return category;
};

export const getCategories = async () => {
    return db("ticket_categories")
        .select(
            "id",
            "name",
            "description",
            "default_priority",
            "sla_hours",
            "is_active",
            "created_at",
            "updated_at"
        )
        .orderBy("name", "asc");
};

export const getCategoryById = async (id: number) => {
    const category = await db("ticket_categories")
        .where("id", id)
        .first();

    if (!category) {
        throw new Error("Category not found");
    }

    return category;
};

export const updateCategory = async (
    id: number,
    data: UpdateCategoryInput
) => {
    const existingCategory = await db("ticket_categories")
        .where("id", id)
        .first();

    if (!existingCategory) {
        throw new Error("Category not found");
    }

    if (data.name) {
        const duplicate = await db("ticket_categories")
            .whereRaw("LOWER(name) = LOWER(?)", [data.name])
            .whereNot("id", id)
            .first();

        if (duplicate) {
            throw new Error("Category name already exists");
        }
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
        updateData.name = data.name;
    }

    if (data.description !== undefined) {
        updateData.description = data.description;
    }

    if (data.defaultPriority !== undefined) {
        updateData.default_priority = data.defaultPriority;
    }

    if (data.slaHours !== undefined) {
        updateData.sla_hours = data.slaHours;
    }

    const [updatedCategory] = await db("ticket_categories")
        .where("id", id)
        .update(updateData)
        .returning([
            "id",
            "name",
            "description",
            "default_priority",
            "sla_hours",
            "is_active",
            "created_at",
            "updated_at",
        ]);

    return updatedCategory;
};

export const updateCategoryStatus = async (
    id: number,
    isActive: boolean
) => {
    const category = await db("ticket_categories")
        .where("id", id)
        .first();

    if (!category) {
        throw new Error("Category not found");
    }

    const [updatedCategory] = await db("ticket_categories")
        .where("id", id)
        .update({
            is_active: isActive,
        })
        .returning([
            "id",
            "name",
            "description",
            "default_priority",
            "sla_hours",
            "is_active",
            "created_at",
            "updated_at",
        ]);

    return updatedCategory;
};