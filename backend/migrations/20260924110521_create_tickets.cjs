exports.up = async function (knex) {
  await knex.schema.createTable("tickets", function (table) {
    table.bigIncrements("id").primary();

    table.string("ticket_number", 30).notNullable().unique();

    // Student who created the ticket
    table
      .bigInteger("student_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    // Ticket category
    table
      .bigInteger("category_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("ticket_categories")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.string("subject", 200).notNullable();

    table.text("description").notNullable();

    table
      .enu(
        "status",
        [
          "OPEN",
          "ASSIGNED",
          "IN_PROGRESS",
          "PENDING_STUDENT",
          "RESOLVED",
          "CLOSED",
          "REOPENED",
        ],
        {
          useNative: false,
          enumName: "ticket_status",
        }
      )
      .notNullable()
      .defaultTo("OPEN");

    table
      .enu("priority", ["LOW", "MEDIUM", "HIGH", "URGENT"], {
        useNative: false,
        enumName: "ticket_priority",
      })
      .notNullable()
      .defaultTo("MEDIUM");

    // Staff/manager currently responsible for the ticket
    table
      .bigInteger("assigned_to")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    // Used when ticket is waiting for student information/action
    table.text("pending_reason").nullable();

    // Added when staff resolves the ticket
    table.text("resolution_summary").nullable();

    table.timestamp("resolved_at").nullable();

    table.timestamp("closed_at").nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now());

    // Indexes for common ticket-management queries
    table.index(["student_id"]);
    table.index(["category_id"]);
    table.index(["status"]);
    table.index(["priority"]);
    table.index(["assigned_to"]);
    table.index(["created_at"]);
    table.index(["updated_at"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("tickets");
};