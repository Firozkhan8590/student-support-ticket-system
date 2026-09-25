import db from "../../config/database";
import { calculateSLAStatus } from "../../utils/sla.util";

export const getDashboardStats = async () => {
    const totalTicketsResult = await db("tickets")
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

    const unassignedResult = await db("tickets")
        .whereNull("assigned_to")
        .whereNotIn("status", ["CLOSED", "RESOLVED"])
        .count("* as count")
        .first();

    // SLA statistics
    const slaTickets = await db("ticket_sla as sla")
        .join("tickets as t", "sla.ticket_id", "t.id")
        .select(
            "t.created_at",
            "sla.first_response_due_at",
            "sla.first_responded_at",
            "sla.resolution_due_at",
            "sla.resolved_at",
            "sla.first_response_breached",
            "sla.resolution_breached"
        );

    const slaCounts = {
        ON_TRACK: 0,
        AT_RISK: 0,
        BREACHED: 0,
        COMPLETED: 0,
    };

    slaTickets.forEach((ticket) => {
        const result = calculateSLAStatus({
            createdAt: ticket.created_at,
            firstResponseDueAt: ticket.first_response_due_at,
            firstRespondedAt: ticket.first_responded_at,
            resolutionDueAt: ticket.resolution_due_at,
            resolvedAt: ticket.resolved_at,
            firstResponseBreached: ticket.first_response_breached,
            resolutionBreached: ticket.resolution_breached,
        });

        slaCounts[result.status]++;
    });

    const totalTickets = Number(totalTicketsResult?.count || 0);

    const statusCounts: Record<string, number> = {};

    statusResults.forEach((item) => {
        statusCounts[item.status] = Number(item.count);
    });

    const priorityCounts: Record<string, number> = {};

    priorityResults.forEach((item) => {
        priorityCounts[item.priority] = Number(item.count);
    });

    const categoryResults = await db("tickets as t")
        .leftJoin("ticket_categories as c", "t.category_id", "c.id")
        .select(
            "t.category_id",
            "c.name as category_name"
        )
        .count("t.id as ticket_count")
        .groupBy("t.category_id", "c.name");

    const staffResults = await db("tickets as t")
        .leftJoin("users as u", "t.assigned_to", "u.id")
        .whereNotNull("t.assigned_to")
        .select(
            "t.assigned_to",
            "u.name as staff_name"
        )
        .count("t.id as ticket_count")
        .groupBy("t.assigned_to", "u.name");

    const resolutionTimeResult = await db("tickets")
        .whereNotNull("resolved_at")
        .select(
            db.raw(`
      AVG(
        EXTRACT(EPOCH FROM ("resolved_at" - "created_at")) / 60
      ) as average_minutes
    `)
        )
        .first();

    const averageResolutionMinutes = Math.round(
        Number(resolutionTimeResult?.average_minutes || 0)
    );

    const averageResolutionHours =
        Math.round((averageResolutionMinutes / 60) * 100) / 100;

    const formatResolutionTime = (minutes: number) => {
        if (minutes <= 0) {
            return "0m";
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours === 0) {
            return `${remainingMinutes}m`;
        }

        if (remainingMinutes === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${remainingMinutes}m`;
    };

    return {
        totalTickets,

        ticketsByStatus: {
            OPEN: statusCounts.OPEN || 0,
            ASSIGNED: statusCounts.ASSIGNED || 0,
            IN_PROGRESS: statusCounts.IN_PROGRESS || 0,
            PENDING_STUDENT: statusCounts.PENDING_STUDENT || 0,
            RESOLVED: statusCounts.RESOLVED || 0,
            CLOSED: statusCounts.CLOSED || 0,
            REOPENED: statusCounts.REOPENED || 0,
        },

        ticketsByPriority: {
            LOW: priorityCounts.LOW || 0,
            MEDIUM: priorityCounts.MEDIUM || 0,
            HIGH: priorityCounts.HIGH || 0,
            URGENT: priorityCounts.URGENT || 0,
        },

        unassignedTickets: Number(
            unassignedResult?.count || 0
        ),

        sla: {
            ON_TRACK: slaCounts.ON_TRACK,
            AT_RISK: slaCounts.AT_RISK,
            BREACHED: slaCounts.BREACHED,
            COMPLETED: slaCounts.COMPLETED,
        },

        ticketsByCategory: categoryResults.map((item) => ({
            categoryId: item.category_id,
            categoryName: item.category_name,
            ticketCount: Number(item.ticket_count),
        })),

        ticketsByStaff: staffResults.map((item) => ({
            staffId: item.assigned_to,
            staffName: item.staff_name,
            ticketCount: Number(item.ticket_count),
        })),

        averageResolutionTime: {
            minutes: averageResolutionMinutes,
            hours: averageResolutionHours,
            formatted: formatResolutionTime(
                averageResolutionMinutes
            ),
        },
    };
};