exports.up = async function (knex) {
  // Users table
  await knex.schema.createTable("users", function (table) {
    table.bigIncrements("id").primary();

    table.string("name", 100).notNullable();

    table.string("email", 150).notNullable().unique();

    table.string("password_hash", 255).notNullable();

    table
      .enu("role", ["STUDENT", "STAFF", "MANAGER"], {
        useNative: false,
        enumName: "user_role",
      })
      .notNullable()
      .defaultTo("STUDENT");

    table.string("student_id", 50).unique();

    table.string("phone", 20);

    table.boolean("is_active").notNullable().defaultTo(true);

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now());

    table.index(["role"]);
    table.index(["is_active"]);
  });

  // Ticket categories table
  await knex.schema.createTable("ticket_categories", function (table) {
    table.bigIncrements("id").primary();

    table.string("name", 100).notNullable().unique();

    table.text("description");

    table
      .enu("default_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"], {
        useNative: false,
        enumName: "ticket_priority",
      })
      .notNullable()
      .defaultTo("MEDIUM");

    table.integer("sla_hours").notNullable().defaultTo(24);

    table.boolean("is_active").notNullable().defaultTo(true);

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now());

    table.index(["is_active"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("ticket_categories");
  await knex.schema.dropTableIfExists("users");
};