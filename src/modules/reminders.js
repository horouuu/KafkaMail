module.exports = ({ bot, knex, config, commands }) => {
  function reminderCallback(thread) {}

  commands.addInboxThreadCommand(
    "reminder",
    "<duration:string$>",

    async (msg, args, thread) => {
      const regex = new RegExp("^[0-9]+([smhd])$");
      const duration = args.duration;
      if (!regex.test(duration)) {
        thread.postSystemMessage(
          `Invalid input for 'duration': \`${duration}\`.\nYou can only input a number followed by \`s\`, \`m\`, \`h\`, or \`d\`.\n\nExample: \`!reminder 7d\``
        );
        return;
      }

      
    },
    { allowSuspended: true }
  );
};
