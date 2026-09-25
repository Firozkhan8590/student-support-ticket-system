import bcrypt from "bcryptjs";
import db from "../../config/database";
import { generateToken } from "../../utils/jwt";

interface LoginInput {
    email: string;
    password: string;
}

export const login = async ({ email, password }: LoginInput) => {
    const user = await db("users")
        .where({
            email,
            is_active: true,
        })
        .first();

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatch) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.student_id,
            phone: user.phone,
        },
    };
};

export const register = async ({
    name,
    email,
    password,
    studentId,
    phone,
}: {
    name: string;
    email: string;
    password: string;
    studentId: string;
    phone?: string;
}) => {
    const existingEmail = await db("users")
        .where("email", email)
        .first();

    if (existingEmail) {
        throw new Error("Email is already registered");
    }

    const existingStudent = await db("users")
        .where("student_id", studentId)
        .first();

    if (existingStudent) {
        throw new Error("Student ID is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db("users")
        .insert({
            name,
            email,
            password_hash: passwordHash,
            role: "STUDENT",
            student_id: studentId,
            phone: phone || null,
            is_active: true,
        })
        .returning([
            "id",
            "name",
            "email",
            "role",
            "student_id",
            "phone",
        ]);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.student_id,
            phone: user.phone,
        },
    };
};