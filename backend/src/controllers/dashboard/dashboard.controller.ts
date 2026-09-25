import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as dashboardService from "../../modules/dashboard/dashboard.service";

export const getDashboardStats = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (
            req.user.role !== "STAFF" &&
            req.user.role !== "MANAGER"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only staff and managers can access dashboard statistics",
            });
        }

        const stats =
            await dashboardService.getDashboardStats();

        return res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch dashboard statistics",
        });
    }
};