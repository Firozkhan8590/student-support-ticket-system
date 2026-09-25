import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "../config/database";

const createManager = async () => {
  try {
    const email = "manager@college.edu";
    const password = "Manager@123";
    const name = "Support Manager";

    const existingUser = await db("users")
      .where("email", email)
      .first();

    if (existingUser) {
      console.log("⚠️ Manager account already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db("users")
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role: "MANAGER",
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

    console.log("✅ Manager account created:");
    console.log(user);
  } catch (error) {
    console.error("❌ Failed to create manager:", error);
  } finally {
    await db.destroy();
  }
};

createManager();