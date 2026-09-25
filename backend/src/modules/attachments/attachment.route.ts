import { Router } from "express";

import {
    authenticate,
} from "../../middleware/auth.middleware";

import {
    uploadTicketAttachment,
} from "../../middleware/upload.middleware";
import { deleteAttachment, getTicketAttachments, uploadAttachment } from "../../controllers/attachments/attachment.controller";



const router = Router();

router.use(authenticate);

// Upload attachment
router.post(
    "/:id/attachments",
    uploadTicketAttachment.single("file"),
    uploadAttachment
);

// Get ticket attachments
router.get(
    "/:id/attachments",
    getTicketAttachments
);

// Delete attachment
router.delete(
    "/:id/attachments/:attachmentId",
    deleteAttachment
);

export default router;