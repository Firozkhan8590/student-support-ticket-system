import { Request, Response } from "express";
import * as authService from "../../modules/auth/auth.service";
import { AuthRequest } from "../../middleware/auth.middleware";


export const login = async (
    req: Request,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const result = await authService.login({
            email,
            password,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Authentication failed",
        });
    }
};

export const register = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            name,
            email,
            password,
            studentId,
            phone,
        } = req.body;

        if (!name || !email || !password || !studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and student ID are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const result = await authService.register({
            name,
            email,
            password,
            studentId,
            phone,
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Registration failed",
        });
    }
};

export const me = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user = await authService.getCurrentUser(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "User not found",
        });
    }
};