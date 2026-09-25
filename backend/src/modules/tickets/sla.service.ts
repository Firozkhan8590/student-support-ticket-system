import db from "../../config/database";

export const processSLABreaches = async () => {
  return db.transaction(async (trx) => {
    const now = new Date();

    // First response SLA breaches
    const firstResponseBreaches = await trx("ticket_sla as sla")
      .join("tickets as t", "sla.ticket_id", "t.id")
      .whereNull("sla.first_responded_at")
      .where("sla.first_response_breached", false)
      .where("sla.first_response_due_at", "<", now)
      .whereNotIn("t.status", ["CLOSED", "RESOLVED"])
      .select(
        "sla.ticket_id",
        "sla.first_response_due_at"
      );

    // Mark first response breaches
    if (firstResponseBreaches.length > 0) {
      const ticketIds = firstResponseBreaches.map(
        (ticket) => ticket.ticket_id
      );

      await trx("ticket_sla")
        .whereIn("ticket_id", ticketIds)
        .update({
          first_response_breached: true,
          updated_at: trx.fn.now(),
        });
    }

    // Resolution SLA breaches
    const resolutionBreaches = await trx("ticket_sla as sla")
      .join("tickets as t", "sla.ticket_id", "t.id")
      .whereNull("sla.resolved_at")
      .where("sla.resolution_breached", false)
      .where("sla.resolution_due_at", "<", now)
      .whereNotIn("t.status", ["CLOSED", "RESOLVED"])
      .select(
        "sla.ticket_id",
        "sla.resolution_due_at"
      );

    // Mark resolution breaches
    if (resolutionBreaches.length > 0) {
      const ticketIds = resolutionBreaches.map(
        (ticket) => ticket.ticket_id
      );

      await trx("ticket_sla")
        .whereIn("ticket_id", ticketIds)
        .update({
          resolution_breached: true,
          updated_at: trx.fn.now(),
        });
    }

    return {
      firstResponseBreaches: firstResponseBreaches.length,
      resolutionBreaches: resolutionBreaches.length,
      processedAt: now,
    };
  });
};