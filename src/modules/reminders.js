const moment = require("moment");
const Reminder = require("../data/Reminder");
const {
  createReminderInDB,
  getExistingReminderInThread,
} = require("../data/reminders");
const {
  parseDurationString,
  getCountdownDurationFromMoment,
} = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  function reminderCallback(thread) {}

  function formatReminder(rem) {
    return `Reminder in \`${getCountdownDurationFromMoment(
      rem.fire_at
    )}\`\nCreated by \`${rem.author_name}\` at \`${rem.created_at}\` (UTC)`;
  }

  commands.addInboxThreadCommand("reminder", [], async (msg, args, thread) => {
    const threadId = thread.id;
    const reminder = await getExistingReminderInThread(threadId);

    if (reminder.length >= 1) {
      let msg = formatReminder(reminder[0]);
      if (reminder.length > 1) {
        msg +=
          "\n\nThere seems to be more than one reminder assigned to this thread.\nPlease contact notify a developer.";
      }
      thread.postSystemMessage(msg);
    } else {
      thread.postSystemMessage(
        "There is currently no reminder set for this channel."
      );
    }
  });

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

      try {
        const res = await createReminderInDB(rem);

        const outRem = res.reminder[0];
        if (res.existing) {
          thread.postSystemMessage(
            `There is already a reminder set for this channel:\n\n${formatReminder(
              outRem
            )}`
          );
          return;
        } else {
          thread.postSystemMessage(
            `Successfully set reminder for \`${outRem.fire_at}\` (\`${duration}\`).`
          );
          const fireAtDate = moment
            .utc(outRem.fire_at, "YYYY-MM-DD HH:mm:ss")
            .toDate();
          const jobName = `${thread.id}-${outRem.fire_at}`;

          schedule.scheduleJob(jobName, fireAtDate, () =>
            reminderCallback(thread, outRem)
          );
        }
      } catch (e) {
        console.error(e);
        thread.postSystemMessage(
          "Something went wrong when creating the reminder."
        );
        return;
      }
    },
    { allowSuspended: true }
  );
};
