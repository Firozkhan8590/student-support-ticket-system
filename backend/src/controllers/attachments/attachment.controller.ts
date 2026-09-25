import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as attachmentService from "../../modules/attachments/attachment.service";

export const uploadAttachment = async (
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

        const ticketId = Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File is required",
            });
        }

        const attachment =
            await attachmentService.createAttachment({
                ticketId,
                uploadedBy: Number(req.user.id),
                fileName: req.file.originalname,
                filePath: req.file.path,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
            });

        return res.status(201).json({
            success: true,
            message: "Attachment uploaded successfully",
            data: attachment,
        });
    } catch (error) {
        console.error("Upload attachment error:", error);

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to upload attachment",
        });
    }
};

export const getTicketAttachments = async (
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

        const ticketId = Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID",
            });
        }

        const attachments =
            await attachmentService.getTicketAttachments(
                ticketId,
                Number(req.user.id),
                req.user.role as
                    | "STUDENT"
                    | "STAFF"
                    | "MANAGER"
            );

        return res.status(200).json({
            success: true,
            data: attachments,
        });
    } catch (error) {
        console.error("Get attachments error:", error);

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch attachments",
        });
    }
};

export const deleteAttachment = async (
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

        const attachmentId = Number(
            req.params.attachmentId
        );

        if (
            !Number.isInteger(attachmentId) ||
            attachmentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid attachment ID",
            });
        }

        const result =
            await attachmentService.deleteAttachment(
                attachmentId,
                Number(req.user.id),
                req.user.role as
                    | "STUDENT"
                    | "STAFF"
                    | "MANAGER"
            );

        return res.status(200).json({
            success: true,
            message: "Attachment deleted successfully",
            data: result,
        });
    } catch (error) {
        console.error("Delete attachment error:", error);

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to delete attachment",
        });
    }
};