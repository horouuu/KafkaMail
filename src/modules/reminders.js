const moment = require("moment");
const schedule = require("node-schedule");
const Reminder = require("../data/Reminder");
const {
  createReminderInDB,
  getExistingReminderInThread,
  deleteAllRemindersOfThread,
} = require("../data/reminders");
const {
  parseDurationString,
  getCountdownDurationFromMoment,
  COLORS_SYSTEM_MSG,
} = require("../utils");

const { findById } = require("../data/threads");

module.exports = ({ bot, knex, config, commands }) => {
  function formatReminder(rem) {
    return `Reminder in \`${getCountdownDurationFromMoment(
      rem.fire_at
    )}\`\nCreated by \`${rem.author_name}\` at \`${rem.created_at}\` (UTC)`;
  }

  async function reminderCallback(thread, reminder) {
    thread.postSystemMessage(
      `Reminder set by \`${reminder.author_name}\`!\n<@${reminder.author_id}>`,
      {
        allowedMentions: { users: true },
      }
    );
    try {
      await deleteAllRemindersOfThread(thread.id);
    } catch (e) {
      console.error(e);
    }
  }

  function scheduleReminder(thread, reminder) {
    const threadId = reminder.thread_id;
    const fireAtDate = moment
      .utc(reminder.fire_at, "YYYY-MM-DD HH:mm:ss")
      .toDate();
    const jobName = `${threadId}-${reminder.fire_at}`;

    schedule.scheduleJob(jobName, fireAtDate, () =>
      reminderCallback(thread, reminder)
    );
  }

  async function initReminders() {
    try {
      const reminders = await knex("reminders").select();
      let countFired = 0;
      let countScheduled = 0;
      for (const reminder of reminders) {
        const thread = await findById(reminder.thread_id);
        if (moment.utc(reminder.fire_at).valueOf() < moment.utc().valueOf()) {
          reminderCallback(thread, reminder);
          countFired += 1;
        } else {
          scheduleReminder(thread, reminder);
          countScheduled += 1;
        }
      }

      console.log(
        `Rescheduled ${countScheduled} reminders and fired ${countFired} expired reminders.`
      );
    } catch (e) {
      console.error(e);
    }
  }

  commands.addInboxThreadCommand(
    "reminder clear",
    [],
    async (msg, args, thread) => {
      try {
        const deleted = await deleteAllRemindersOfThread(thread.id);

        if (deleted.length == 0) {
          thread.postSystemMessage(
            "There are no reminders set in this channel!"
          );
          return;
        } else {
          thread.postSystemMessage(
            `Deleted:\n\n${formatReminder(deleted[0])}`,
            { color: COLORS_SYSTEM_MSG.COLORS_DELETION }
          );

          schedule.scheduledJobs[`${thread.id}-${deleted[0].fire_at}`].cancel();
        }
      } catch (e) {
        console.error(e);
        thread.postSystemMessage(
          "Something went wrong when deleting reminders."
        );
      }
    }
  );

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
          scheduleReminder(thread, outRem);
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

  initReminders();
};
