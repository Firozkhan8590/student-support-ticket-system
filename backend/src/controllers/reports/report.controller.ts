import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as reportService from "../../modules/reports/report.service";

const checkReportAccess = (
    req: AuthRequest,
    res: Response
) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });

        return false;
    }

    if (
        req.user.role !== "STAFF" &&
        req.user.role !== "MANAGER"
    ) {
        res.status(403).json({
            success: false,
            message:
                "Only staff and managers can access reports",
        });

        return false;
    }

    return true;
};

export const getTicketReport = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!checkReportAccess(req, res)) {
            return;
        }

        const report =
            await reportService.getTicketReport();

        return res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error(
            "Get ticket report error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to generate ticket report",
        });
    }
};

export const getStaffPerformanceReport = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!checkReportAccess(req, res)) {
            return;
        }

        const report =
            await reportService.getStaffPerformanceReport();

        return res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error(
            "Get staff performance report error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to generate staff performance report",
        });
    }
};

export const getCategoryReport = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!checkReportAccess(req, res)) {
            return;
        }

        const report =
            await reportService.getCategoryReport();

        return res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error(
            "Get category report error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to generate category report",
        });
    }
};