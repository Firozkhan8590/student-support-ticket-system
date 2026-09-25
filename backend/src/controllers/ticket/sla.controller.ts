import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { processSLABreaches } from "../../modules/tickets/sla.service";

export const processSLABreachesController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await processSLABreaches();

    return res.status(200).json({
      success: true,
      message: "SLA breaches processed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Process SLA breaches error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process SLA breaches",
    });
  }
};