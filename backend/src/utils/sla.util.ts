// backend/src/utils/sla.util.ts

export type SLAStatus =
  | "ON_TRACK"
  | "AT_RISK"
  | "BREACHED"
  | "COMPLETED";

interface SLAInput {
  createdAt: Date | string;
  firstResponseDueAt: Date | string | null;
  firstRespondedAt: Date | string | null;
  resolutionDueAt: Date | string | null;
  resolvedAt: Date | string | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
}

interface AgeingResult {
  ageInMinutes: number;
  ageLabel: string;
}

interface SLAResult {
  status: SLAStatus;
  remainingMinutes: number | null;
  overdueMinutes: number;
  ageing: AgeingResult;
}

const toDate = (value: Date | string): Date => {
  return value instanceof Date ? value : new Date(value);
};

const formatDuration = (minutes: number): string => {
  const safeMinutes = Math.max(0, Math.floor(minutes));

  const days = Math.floor(safeMinutes / (60 * 24));
  const hours = Math.floor((safeMinutes % (60 * 24)) / 60);
  const mins = safeMinutes % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins}m`);
  }

  return parts.join(" ");
};

export const calculateTicketAgeing = (
  createdAt: Date | string,
  endTime: Date = new Date()
): AgeingResult => {
  const created = toDate(createdAt);

  const differenceMs = Math.max(
    0,
    endTime.getTime() - created.getTime()
  );

  const ageInMinutes = Math.floor(differenceMs / (1000 * 60));

  return {
    ageInMinutes,
    ageLabel: formatDuration(ageInMinutes),
  };
};

export const calculateSLAStatus = (
  sla: SLAInput,
  currentTime: Date = new Date()
): SLAResult => {
  const createdAt = toDate(sla.createdAt);

  // -----------------------------
  // Ageing
  // -----------------------------

  const ageing = calculateTicketAgeing(createdAt, currentTime);

  // -----------------------------
  // Resolution completed
  // -----------------------------

  if (sla.resolvedAt) {
    return {
      status: "COMPLETED",
      remainingMinutes: 0,
      overdueMinutes: 0,
      ageing,
    };
  }

  // -----------------------------
  // Resolution SLA
  // -----------------------------

  if (!sla.resolutionDueAt) {
    return {
      status: "ON_TRACK",
      remainingMinutes: null,
      overdueMinutes: 0,
      ageing,
    };
  }

  const resolutionDue = toDate(sla.resolutionDueAt);

  const differenceMs =
    resolutionDue.getTime() - currentTime.getTime();

  const differenceMinutes = Math.floor(
    differenceMs / (1000 * 60)
  );

  // Already breached
  if (differenceMinutes <= 0 || sla.resolutionBreached) {
    return {
      status: "BREACHED",
      remainingMinutes: 0,
      overdueMinutes: Math.abs(differenceMinutes),
      ageing,
    };
  }

  // Less than 25% of remaining SLA → At Risk
  const totalSLAMs =
    resolutionDue.getTime() - createdAt.getTime();

  const remainingRatio =
    (resolutionDue.getTime() - currentTime.getTime()) /
    totalSLAMs;

  if (remainingRatio <= 0.25) {
    return {
      status: "AT_RISK",
      remainingMinutes: differenceMinutes,
      overdueMinutes: 0,
      ageing,
    };
  }

  return {
    status: "ON_TRACK",
    remainingMinutes: differenceMinutes,
    overdueMinutes: 0,
    ageing,
  };
};

export const formatRemainingTime = (
  minutes: number | null
): string => {
  if (minutes === null) {
    return "N/A";
  }

  if (minutes <= 0) {
    return "Overdue";
  }

  return formatDuration(minutes);
};