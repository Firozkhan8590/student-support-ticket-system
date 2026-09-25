exports.up = async function (knex) {
  // Ticket comments / conversation
  await knex.schema.createTable("ticket_comments", function (table) {
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
      .bigInteger("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.text("comment").notNullable();

    table.boolean("is_internal").notNullable().defaultTo(false);

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["ticket_id"]);
    table.index(["user_id"]);
    table.index(["created_at"]);
  });

  // Ticket activity / audit history
  await knex.schema.createTable("ticket_activities", function (table) {
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
      .bigInteger("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table
      .enu(
        "activity_type",
        [
          "CREATED",
          "ASSIGNED",
          "STATUS_CHANGED",
          "PRIORITY_CHANGED",
          "CATEGORY_CHANGED",
          "COMMENT_ADDED",
          "RESOLVED",
          "CLOSED",
          "REOPENED",
        ],
        {
          useNative: false,
          enumName: "ticket_activity_type",
        }
      )
      .notNullable();

    table.text("description").notNullable();

    table.jsonb("metadata").nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["ticket_id"]);
    table.index(["user_id"]);
    table.index(["activity_type"]);
    table.index(["created_at"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("ticket_activities");
  await knex.schema.dropTableIfExists("ticket_comments");
};