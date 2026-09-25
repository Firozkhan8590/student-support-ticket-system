exports.up = async function (knex) {
  await knex.schema.createTable("ticket_attachments", function (table) {
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
      .bigInteger("uploaded_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.string("file_name", 255).notNullable();

    table.string("file_path", 500).notNullable();

    table.string("file_type", 100).nullable();

    table.bigInteger("file_size").nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["ticket_id"]);
    table.index(["uploaded_by"]);
    table.index(["created_at"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("ticket_attachments");
};