const knex = require("../knex");
const moment = require("moment");

/**
 * Creates a new reminder row in the database
 * @param {Object} data
 * @returns {Promise<Object>} The ID of the created reminder
 */

async function createReminderInDB(data) {
  const rem = {
    ...data,
    created_at: moment.utc().format("YYYY-MM-DD HH:mm:ss"),
  };

  if (!(await knex("reminders"))) {
    console.log("Can't find table.");
  }

  const existing = await knex("reminders")
    .where("thread_id", data.thread_id)
    .select();

  let out = null;

  if (existing.length > 0) {
    out = { existing: true, reminder: existing };
  } else {
    const id = await knex("reminders").insert(rem);
    const created = await knex("reminders").where("id", id[0]).select();
    out = { existing: false, reminder: created };
  }

  return out;
}

async function getExistingReminderInThread(threadId) {
  const reminder = await knex("reminders")
    .where("thread_id", threadId)
    .select();

  return reminder;
}

module.exports = { createReminderInDB, getExistingReminderInThread };
