import db from "../../config/database";

import fs from "fs/promises";

export interface CreateAttachmentInput {
  ticketId: number;
  uploadedBy: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

export const createAttachment = async (
  data: CreateAttachmentInput
) => {
  const ticket = await db("tickets")
    .where("id", data.ticketId)
    .first();

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const user = await db("users")
    .where({
      id: data.uploadedBy,
      is_active: true,
    })
    .first();

  if (!user) {
    throw new Error("User account not found or inactive");
  }

  // Students can only upload to their own tickets
  if (
    user.role === "STUDENT" &&
    Number(ticket.student_id) !== Number(data.uploadedBy)
  ) {
    throw new Error(
      "You do not have access to this ticket"
    );
  }

  const [attachment] = await db("ticket_attachments")
    .insert({
      ticket_id: data.ticketId,
      uploaded_by: data.uploadedBy,
      file_name: data.fileName,
      file_path: data.filePath,
      file_type: data.fileType,
      file_size: data.fileSize,
    })
    .returning([
      "id",
      "ticket_id",
      "uploaded_by",
      "file_name",
      "file_path",
      "file_type",
      "file_size",
      "created_at",
    ]);

  return attachment;
};

export const getTicketAttachments = async (
  ticketId: number,
  userId: number,
  userRole: "STUDENT" | "STAFF" | "MANAGER"
) => {
  const ticket = await db("tickets")
    .where("id", ticketId)
    .first();

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Student can only view attachments on their own ticket
  if (
    userRole === "STUDENT" &&
    Number(ticket.student_id) !== Number(userId)
  ) {
    throw new Error(
      "You do not have access to this ticket"
    );
  }

  const attachments = await db(
    "ticket_attachments as ta"
  )
    .leftJoin(
      "users as u",
      "ta.uploaded_by",
      "u.id"
    )
    .where("ta.ticket_id", ticketId)
    .select(
      "ta.id",
      "ta.ticket_id",
      "ta.uploaded_by",
      "u.name as uploaded_by_name",
      "u.role as uploaded_by_role",
      "ta.file_name",
      "ta.file_path",
      "ta.file_type",
      "ta.file_size",
      "ta.created_at"
    )
    .orderBy("ta.created_at", "asc");

  return attachments;
};

export const deleteAttachment = async (
  attachmentId: number,
  userId: number,
  userRole: "STUDENT" | "STAFF" | "MANAGER"
) => {
  const attachment = await db(
    "ticket_attachments as ta"
  )
    .join(
      "tickets as t",
      "ta.ticket_id",
      "t.id"
    )
    .where("ta.id", attachmentId)
    .select(
      "ta.id",
      "ta.ticket_id",
      "ta.uploaded_by",
      "ta.file_path",
      "t.student_id"
    )
    .first();

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  // Students can only delete their own attachments
  if (userRole === "STUDENT") {
    if (
      Number(attachment.student_id) !== Number(userId)
    ) {
      throw new Error(
        "You do not have access to this attachment"
      );
    }

    if (
      Number(attachment.uploaded_by) !== Number(userId)
    ) {
      throw new Error(
        "You can only delete your own attachments"
      );
    }
  }

  // Delete database record
  await db("ticket_attachments")
    .where("id", attachmentId)
    .del();

  // Delete physical file
  try {
    await fs.unlink(attachment.file_path);
  } catch (error: any) {
    // File may already be missing
    if (error.code !== "ENOENT") {
      console.error(
        "Failed to delete physical attachment:",
        error
      );
    }
  }

  return {
    id: attachment.id,
    filePath: attachment.file_path,
  };
};