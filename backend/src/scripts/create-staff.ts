import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "../config/database";

const createStaff = async () => {
  try {
    const email = "staff@college.edu";
    const password = "Password@123";
    const name = "Support Staff";

    const existingUser = await db("users")
      .where("email", email)
      .first();

    if (existingUser) {
      console.log("Staff account already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db("users")
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role: "STAFF",
        student_id: null,
        phone: null,
        is_active: true,
      })
      .returning([
        "id",
        "name",
        "email",
        "role",
        "is_active",
      ]);

    console.log("✅ Staff account created:");
    console.log(user);
  } catch (error) {
    console.error("❌ Failed to create staff:", error);
  } finally {
    await db.destroy();
  }
};

createStaff();