/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("reminders", (table) => {
    table.increments("id");
    table.string("thread_id", 36).notNullable().index();
    table.string("author_id", 20).notNullable().index();
    table.datetime("fire_at").notNullable();
    table.datetime("created_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  if (await knex.schema.hasTable("reminders")) {
    await knex.schema.dropTable("reminders");
  }
};
