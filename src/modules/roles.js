const utils = require("../utils");
const {
  setModeratorDefaultRoleOverride,
  resetModeratorDefaultRoleOverride,

  setModeratorThreadRoleOverride,
  resetModeratorThreadRoleOverride,

  getModeratorThreadDisplayRoleName,
  getModeratorDefaultDisplayRoleName,
} = require("../data/displayRoles");
const { getOrFetchChannel } = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  if (!config.allowChangingDisplayRole) {
    return;
  }

  function resolveRoleInput(input) {
    if (utils.isSnowflake(input)) {
      return utils.getInboxGuild().roles.get(input);
    }

    const regex = new RegExp(`^(${input.toLowerCase()}.*)$`);
    return utils
      .getInboxGuild()
      .roles.filter((r) => regex.test(r.name.toLowerCase()));
  }

  function resolveRoleFromRoleArray(roleArr, input) {
    let role = null;
    let msg = null;
    if (roleArr.length == 1) {
      role = roleArr[0];
    } else if (roleArr.length > 1) {
      msg = `Multiple roles match the input \`${input}\`:`;
      for (const role of roleArr) {
        msg += `\n- ${role.name}`;
      }
    }

    return { role, msg };
  }

  // Get display role for a thread
  commands.addInboxThreadCommand(
    "role",
    [],
    async (msg, args, thread) => {
      const displayRole = await getModeratorThreadDisplayRoleName(
        msg.member,
        thread.id
      );
      if (displayRole) {
        thread.postSystemMessage(
          `Your display role in this thread is currently **${displayRole}**`
        );
      } else {
        thread.postSystemMessage(
          "Your replies in this thread do not currently display a role"
        );
      }
    },
    { allowSuspended: true }
  );

  // Reset display role for a thread
  commands.addInboxThreadCommand(
    "role reset",
    [],
    async (msg, args, thread) => {
      await resetModeratorThreadRoleOverride(msg.member.id, thread.id);

      const displayRole = await getModeratorThreadDisplayRoleName(
        msg.member,
        thread.id
      );
      if (displayRole) {
        thread.postSystemMessage(
          `Your display role for this thread has been reset. Your replies will now display the default role **${displayRole}**.`
        );
      } else {
        thread.postSystemMessage(
          "Your display role for this thread has been reset. Your replies will no longer display a role."
        );
      }
    },
    {
      aliases: ["role_reset", "reset_role"],
      allowSuspended: true,
    }
  );

  // Set display role for a thread
  commands.addInboxThreadCommand(
    "role",
    "<role:string$>",
    async (msg, args, thread) => {
      const roleArr = resolveRoleInput(args.role);
      const out = resolveRoleFromRoleArray(roleArr, args.role);

      if (out.msg) {
        thread.postSystemMessage(out.msg);
        return;
      } else if (!out.role) {
        thread.postSystemMessage(
          `No role in the server matches the input \`${args.role}\`.`
        );
        return;
      }

      const role = out.role;
      if (!msg.member.roles.includes(role.id)) {
        thread.postSystemMessage(
          `You do not have the role \`${role.name}\` assigned to you. You can only set roles you own as the display role of the thread.`
        );
        return;
      }

      await setModeratorThreadRoleOverride(msg.member.id, thread.id, role.id);
      thread.postSystemMessage(
        `Your display role for this thread has been set to **${role.name}**. You can reset it with \`${config.prefix}role reset\`.`
      );
    },
    { allowSuspended: true }
  );

  // Get default display role
  commands.addInboxServerCommand("role", [], async (msg, args, thread) => {
    const channel = await getOrFetchChannel(bot, msg.channel.id);
    const displayRole = await getModeratorDefaultDisplayRoleName(msg.member);
    if (displayRole) {
      channel.createMessage(
        `Your default display role is currently **${displayRole}**`
      );
    } else {
      channel.createMessage(
        "Your replies do not currently display a role by default"
      );
    }
  });

  // Reset default display role
  commands.addInboxServerCommand(
    "role reset",
    [],
    async (msg, args, thread) => {
      await resetModeratorDefaultRoleOverride(msg.member.id);

      const channel = await getOrFetchChannel(bot, msg.channel.id);
      const displayRole = await getModeratorDefaultDisplayRoleName(msg.member);
      if (displayRole) {
        channel.createMessage(
          `Your default display role has been reset. Your replies will now display the role **${displayRole}** by default.`
        );
      } else {
        channel.createMessage(
          "Your default display role has been reset. Your replies will no longer display a role by default."
        );
      }
    },
    {
      aliases: ["role_reset", "reset_role"],
    }
  );

  // Set default display role
  commands.addInboxServerCommand(
    "role",
    "<role:string$>",
    async (msg, args, thread) => {
      const channel = await getOrFetchChannel(bot, msg.channel.id);
      const roleArr = resolveRoleInput(args.role);
      const out = resolveRoleFromRoleArray(roleArr, args.role);

      if (out.msg) {
        channel.createMessage(out.msg);
        return;
      } else if (!out.role) {
        channel.createMessage(
          `No role in the server matches the input \`${args.role}\`.`
        );
        return;
      }

      const role = out.role;
      if (!msg.member.roles.includes(role.id)) {
        channel.createMessage(
          `You do not have the role \`${role.name}\` assigned to you. You can only set roles you own as the display role of the thread.`
        );
        return;
      }

      await setModeratorDefaultRoleOverride(msg.member.id, role.id);
      channel.createMessage(
        `Your default display role has been set to **${role.name}**. You can reset it with \`${config.prefix}role reset\`.`
      );
    }
  );
};
