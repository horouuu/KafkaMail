/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  if (await knex.schema.hasTable("reminders")) {
    await knex.schema.table("reminders", (table) => {
      table.string("thread_id", 36).notNullable();
      table.increments("id").notNullable().alter();
      table.string("created_by").notNullable().alter();
      table.dateTime("created_at").notNullable().alter();
      table.dateTime("fire_at").notNullable().alter();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table("reminders", (table) => {
    table.dropColumn("thread_id");
  });
};
