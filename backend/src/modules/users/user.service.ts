import bcrypt from "bcryptjs";
import db from "../../config/database";
import {
    CreateStaffInput,
    UpdateStaffInput,
} from "../../validators/staff.validator";

export const createStaff = async (input: CreateStaffInput) => {
    const existingUser = await db("users")
        .where("email", input.email.toLowerCase())
        .first();

    if (existingUser) {
        throw new Error("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const [staff] = await db("users")
        .insert({
            name: input.name,
            email: input.email.toLowerCase(),
            password_hash: passwordHash,
            role: "STAFF",
            student_id: null,
            phone: input.phone ?? null,
            is_active: true,
        })
        .returning([
            "id",
            "name",
            "email",
            "role",
            "phone",
            "is_active",
            "created_at",
            "updated_at",
        ]);

    return staff;
};

export const getAllStaff = async () => {
    const staff = await db("users")
        .where("role", "STAFF")
        .select(
            "id",
            "name",
            "email",
            "role",
            "phone",
            "is_active",
            "created_at",
            "updated_at"
        )
        .where("role", "STAFF")
        .orderBy("name", "asc");

    return staff;
};

export const getStaffById = async (staffId: number) => {
    const staff = await db("users")
        .where("id", staffId)
        .where("role", "STAFF")
        .select(
            "id",
            "name",
            "email",
            "phone",
            "is_active",
            "created_at",
            "updated_at"
        )
        .first();

    if (!staff) {
        throw new Error("Staff member not found");
    }

    return staff;
};

export const updateStaff = async (
    staffId: number,
    input: UpdateStaffInput
) => {
    const existingStaff = await db("users")
        .where("id", staffId)
        .where("role", "STAFF")
        .first();

    if (!existingStaff) {
        throw new Error("Staff member not found");
    }

    if (input.email) {
        const duplicateEmail = await db("users")
            .where("email", input.email.toLowerCase())
            .whereNot("id", staffId)
            .first();

        if (duplicateEmail) {
            throw new Error("A user with this email already exists");
        }
    }

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
        updateData.name = input.name;
    }

    if (input.email !== undefined) {
        updateData.email = input.email.toLowerCase();
    }

    if (input.phone !== undefined) {
        updateData.phone = input.phone;
    }

    updateData.updated_at = db.fn.now();

    const [updatedStaff] = await db("users")
        .where("id", staffId)
        .where("role", "STAFF")
        .update(updateData)
        .returning([
            "id",
            "name",
            "email",
            "role",
            "phone",
            "is_active",
            "created_at",
            "updated_at",
        ]);

    return updatedStaff;
};

export const updateStaffStatus = async (
    staffId: number,
    isActive: boolean
) => {
    const staff = await db("users")
        .where("id", staffId)
        .where("role", "STAFF")
        .first();

    if (!staff) {
        throw new Error("Staff member not found");
    }

    const [updatedStaff] = await db("users")
        .where("id", staffId)
        .where("role", "STAFF")
        .update({
            is_active: isActive,
            updated_at: db.fn.now(),
        })
        .returning([
            "id",
            "name",
            "email",
            "role",
            "phone",
            "is_active",
            "created_at",
            "updated_at",
        ]);

    return updatedStaff;
};