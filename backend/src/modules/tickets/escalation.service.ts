import db from "../../config/database";
import { EscalateTicketInput } from "../../validators/escalation.validator";

export const escalateTicket = async (
  ticketId: number,
  actorId: number,
  input: EscalateTicketInput
) => {
  return db.transaction(async (trx) => {
    // 1. Check ticket
    const ticket = await trx("tickets")
      .where("id", ticketId)
      .first();

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // 2. Check target user
   const targetUser = await trx("users")
        .where("id", Number(input.escalatedTo))
        .where("is_active", true)
        .first();

    if (!targetUser) {
      throw new Error("Escalation target user not found or inactive");
    }

    // 3. Target must be STAFF or MANAGER
    if (!["STAFF", "MANAGER"].includes(targetUser.role)) {
      throw new Error(
        "Ticket can only be escalated to STAFF or MANAGER"
      );
    }

    // 4. Prevent escalation to yourself
    if (Number(input.escalatedTo) === Number(actorId)) {
        throw new Error("You cannot escalate a ticket to yourself");
    }

    // 5. Check actor
    const actor = await trx("users")
      .where("id", actorId)
      .first();

    if (!actor) {
      throw new Error("Escalating user not found");
    }

    // 6. Create escalation record
    const [escalation] = await trx("ticket_escalations")
      .insert({
        ticket_id: ticketId,
        escalated_from: actorId,
        escalated_to: input.escalatedTo,
        reason: input.reason,
        notes: input.notes ?? null,
      })
      .returning([
        "id",
        "ticket_id",
        "escalated_from",
        "escalated_to",
        "reason",
        "notes",
        "created_at",
      ]);

    // 7. Update ticket ownership
    await trx("tickets")
      .where("id", ticketId)
      .update({
        assigned_to: input.escalatedTo,
        updated_at: trx.fn.now(),
      });

    // 8. Create activity
    await trx("ticket_activities").insert({
      ticket_id: ticketId,
      user_id: actorId,
      activity_type: "ESCALATED",
      description: `Ticket escalated from ${actor.name} to ${targetUser.name}`,
      metadata: JSON.stringify({
        escalationId: escalation.id,
        escalatedFrom: actorId,
        escalatedTo: input.escalatedTo,
        reason: input.reason,
      }),
    });

    return {
      escalation,
      assignedTo: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    };
  });
};