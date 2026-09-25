exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE "ticket_activities"
    DROP CONSTRAINT IF EXISTS "ticket_activities_activity_type_check"
  `);

  await knex.raw(`
    ALTER TABLE "ticket_activities"
    ADD CONSTRAINT "ticket_activities_activity_type_check"
    CHECK (
      "activity_type" IN (
        'CREATED',
        'ASSIGNED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'CATEGORY_CHANGED',
        'COMMENT_ADDED',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
        'ESCALATED'
      )
    )
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE "ticket_activities"
    DROP CONSTRAINT IF EXISTS "ticket_activities_activity_type_check"
  `);

  await knex.raw(`
    ALTER TABLE "ticket_activities"
    ADD CONSTRAINT "ticket_activities_activity_type_check"
    CHECK (
      "activity_type" IN (
        'CREATED',
        'ASSIGNED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'CATEGORY_CHANGED',
        'COMMENT_ADDED',
        'RESOLVED',
        'CLOSED',
        'REOPENED'
      )
    )
  `);
};