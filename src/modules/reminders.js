const moment = require("moment");
const Reminder = require("../data/Reminder");
const { createReminderInDB } = require("../data/reminders");
const {
  parseDurationString,
  getCountdownDurationFromMoment,
} = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  function reminderCallback(thread) {}

  commands.addInboxThreadCommand(
    "reminder",
    "<duration:string$>",

    async (msg, args, thread) => {
      const duration = args.duration;
      let durationMs = 0;
      try {
        durationMs = parseDurationString(duration);
      } catch (e) {
        thread.postSystemMessage(
          `Invalid input for 'duration': \`${duration}\`\nYou can only input a non-zero number followed by \`s\`, \`m\`, \`h\`, or \`d\`.\n\nExample: \`!reminder 7d\``
        );
        return;
      }

      const fireDate = new Date(new Date().getTime() + durationMs);
      const rem = new Reminder({
        thread_id: thread.id,
        author_id: msg.author.id,
        author_name: msg.author.globalName,
        fire_at: moment.utc(fireDate).format("YYYY-MM-DD HH:mm:ss"),
      });

      const res = await createReminderInDB(rem);
      const outRem = res.reminder[0];
      if (res.existing) {
        thread.postSystemMessage(
          `There is already a reminder set for this channel:\n\nReminder in \`${getCountdownDurationFromMoment(
            outRem.fire_at
          )}\`\nCreated by \`${outRem.author_name}\` at \`${
            outRem.created_at
          }\` (UTC)`
        );
        return;
      } else {
        thread.postSystemMessage(
          `Successfully set reminder for \`${outRem.fire_at}\` (\`${duration}\`).`
        );
      }
    },
    { allowSuspended: true }
  );
};
