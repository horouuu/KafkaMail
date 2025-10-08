/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("reminders", (table) => {
    table.increments("id");
    table.string("thread_id").index();
    table.string("author_id", 20).index();
    table.datetime("fire_at");
    table.datetime("created_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
