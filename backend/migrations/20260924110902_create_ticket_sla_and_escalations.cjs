exports.up = async function (knex) {
  // SLA tracking for each ticket
  await knex.schema.createTable("ticket_sla", function (table) {
    table.bigIncrements("id").primary();

    table
      .bigInteger("ticket_id")
      .unsigned()
      .notNullable()
      .unique()
      .references("id")
      .inTable("tickets")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.timestamp("first_response_due_at").nullable();

    table.timestamp("first_responded_at").nullable();

    table.timestamp("resolution_due_at").nullable();

    table.timestamp("resolved_at").nullable();

    table.boolean("first_response_breached").notNullable().defaultTo(false);

    table.boolean("resolution_breached").notNullable().defaultTo(false);

    table.boolean("is_breached").notNullable().defaultTo(false);

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["first_response_due_at"]);
    table.index(["resolution_due_at"]);
    table.index(["is_breached"]);
  });

  // Ticket escalation history
  await knex.schema.createTable("ticket_escalations", function (table) {
    table.bigIncrements("id").primary();

    table
      .bigInteger("ticket_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("tickets")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .bigInteger("escalated_from")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    table
      .bigInteger("escalated_to")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    table.string("reason", 255).notNullable();

    table.text("notes").nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["ticket_id"]);
    table.index(["escalated_to"]);
    table.index(["created_at"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("ticket_escalations");
  await knex.schema.dropTableIfExists("ticket_sla");
};