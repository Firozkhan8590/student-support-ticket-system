import db from "../../config/database";

export const getTicketReport = async () => {
  const totalResult = await db("tickets")
    .count("* as count")
    .first();

  const statusResults = await db("tickets")
    .select("status")
    .count("* as count")
    .groupBy("status");

  const priorityResults = await db("tickets")
    .select("priority")
    .count("* as count")
    .groupBy("priority");

  const statusCounts: Record<string, number> = {};

  statusResults.forEach((item) => {
    statusCounts[item.status] = Number(item.count);
  });

  const priorityCounts: Record<string, number> = {};

  priorityResults.forEach((item) => {
    priorityCounts[item.priority] = Number(item.count);
  });

  return {
    totalTickets: Number(totalResult?.count || 0),

    byStatus: {
      OPEN: statusCounts.OPEN || 0,
      ASSIGNED: statusCounts.ASSIGNED || 0,
      IN_PROGRESS: statusCounts.IN_PROGRESS || 0,
      PENDING_STUDENT: statusCounts.PENDING_STUDENT || 0,
      RESOLVED: statusCounts.RESOLVED || 0,
      CLOSED: statusCounts.CLOSED || 0,
      REOPENED: statusCounts.REOPENED || 0,
    },

    byPriority: {
      LOW: priorityCounts.LOW || 0,
      MEDIUM: priorityCounts.MEDIUM || 0,
      HIGH: priorityCounts.HIGH || 0,
      URGENT: priorityCounts.URGENT || 0,
    },
  };
};

export const getStaffPerformanceReport = async () => {
  const staff = await db("users")
    .where("role", "STAFF")
    .select(
      "id",
      "name",
      "email",
      "is_active"
    );

  const report = await Promise.all(
    staff.map(async (member) => {
      const assignedResult = await db("tickets")
        .where("assigned_to", member.id)
        .count("* as count")
        .first();

      const resolvedResult = await db("tickets")
        .where("assigned_to", member.id)
        .where("status", "RESOLVED")
        .count("* as count")
        .first();

      const closedResult = await db("tickets")
        .where("assigned_to", member.id)
        .where("status", "CLOSED")
        .count("* as count")
        .first();

      const pendingResult = await db("tickets")
        .where("assigned_to", member.id)
        .where("status", "PENDING_STUDENT")
        .count("* as count")
        .first();

      const resolutionTimeResult = await db("tickets")
        .where("assigned_to", member.id)
        .whereNotNull("resolved_at")
        .select(
          db.raw(`
            AVG(
              EXTRACT(
                EPOCH FROM ("resolved_at" - "created_at")
              ) / 60
            ) as average_minutes
          `)
        )
        .first();

      const averageMinutes = Math.round(
        Number(
          resolutionTimeResult?.average_minutes || 0
        )
      );

      return {
        staffId: member.id,
        staffName: member.name,
        email: member.email,
        isActive: member.is_active,

        assignedTickets: Number(
          assignedResult?.count || 0
        ),

        resolvedTickets: Number(
          resolvedResult?.count || 0
        ),

        closedTickets: Number(
          closedResult?.count || 0
        ),

        pendingTickets: Number(
          pendingResult?.count || 0
        ),

        averageResolutionMinutes: averageMinutes,

        averageResolutionHours:
          Math.round(
            (averageMinutes / 60) * 100
          ) / 100,
      };
    })
  );

  return report;
};

export const getCategoryReport = async () => {
  const categories = await db(
    "ticket_categories"
  ).select(
    "id",
    "name",
    "is_active"
  );

  const report = await Promise.all(
    categories.map(async (category) => {
      const totalResult = await db("tickets")
        .where("category_id", category.id)
        .count("* as count")
        .first();

      const openResult = await db("tickets")
        .where("category_id", category.id)
        .whereIn("status", [
          "OPEN",
          "ASSIGNED",
          "IN_PROGRESS",
          "PENDING_STUDENT",
          "REOPENED",
        ])
        .count("* as count")
        .first();

      const resolvedResult = await db("tickets")
        .where("category_id", category.id)
        .where("status", "RESOLVED")
        .count("* as count")
        .first();

      const closedResult = await db("tickets")
        .where("category_id", category.id)
        .where("status", "CLOSED")
        .count("* as count")
        .first();

      const resolutionTimeResult = await db("tickets")
        .where("category_id", category.id)
        .whereNotNull("resolved_at")
        .select(
          db.raw(`
            AVG(
              EXTRACT(
                EPOCH FROM ("resolved_at" - "created_at")
              ) / 60
            ) as average_minutes
          `)
        )
        .first();

      const averageMinutes = Math.round(
        Number(
          resolutionTimeResult?.average_minutes || 0
        )
      );

      return {
        categoryId: category.id,
        categoryName: category.name,
        isActive: category.is_active,

        totalTickets: Number(
          totalResult?.count || 0
        ),

        openTickets: Number(
          openResult?.count || 0
        ),

        resolvedTickets: Number(
          resolvedResult?.count || 0
        ),

        closedTickets: Number(
          closedResult?.count || 0
        ),

        averageResolutionMinutes:
          averageMinutes,

        averageResolutionHours:
          Math.round(
            (averageMinutes / 60) * 100
          ) / 100,
      };
    })
  );

  return report;
};