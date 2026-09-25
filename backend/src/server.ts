import "dotenv/config";
import app from "./app";

import authRoutes from "./modules/auth/auth.route";
import categoryRoutes from "./modules/category/category.route";
import ticketRoutes from "./modules/tickets/ticket.route";
import userRoutes from "./modules/users/user.route";
import dashboardRoutes from "./modules/dashboard/dashboard.route";
import attachmentRoutes from "./modules/attachments/attachment.route";
import reportRoutes from "./modules/reports/report.route";

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tickets", attachmentRoutes);
app.use("/api/reports", reportRoutes);
app.listen(PORT, () => {
  console.log(
    `🚀 Student Support API running on port ${PORT}`
  );
});