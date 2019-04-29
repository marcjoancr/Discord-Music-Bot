const Discord = require("discord.js");

module.exports.run = async (bot, message, args) => {

  if (args.length == 0) {
    let onlineMembers = message.guild.members.filter(m =>
      m.presence.status === 'online'
      || m.presence.status === 'idle'
      || m.presence.status === 'dnd'
    ).size;
    let serverIcon = message.guild.iconURL == null ? bot.user.avatarURL : message.guild.iconURL;
    message.channel.send(new Discord.RichEmbed()
      .setColor("#0a8403")
      .setAuthor(`${message.guild.name}`, `${serverIcon}`)
      .addField('Server ID', `${message.guild.id}`, true)
      .addField('Server Region', `${message.guild.region}`, true)
      .addField('Server Owner', `${message.guild.owner}`, true)
      .addField('\u200b', '\u200b')
      .addField('Online Members', `${onlineMembers}`, true)
      .addField('Total Members', `${message.guild.memberCount}`, true)
      .addField(`Roles' List`, `${message.guild.roles.size}`, true)
      .addField('\u200b', '\u200b')
      .addField(`Total Channels`, `${message.guild.channels.size}`, true)
      .addField(`AFK Channel (Timeout: ${message.guild.afkTimeout}s)`, `${message.guild.afkChannel}`, true)
      .addField('\u200b', '\u200b')
      .setFooter(`Server created ${message.guild.createdAt}`)
      .setTimestamp()
    );
  } else if (args.length > 0) {
    if (args[0] == 'roles') {
      let rolesServerList = "";
      message.guild.roles.forEach((role) => {
        rolesServerList += role + " "
      });
      message.channel.send(new Discord.RichEmbed()
        .setColor("#4a04f5")
        .setAuthor(`${message.guild.name}`, `${message.guild.iconURL}`)
        .addField(`Roles' List (${message.guild.roles.size})`, `${rolesServerList}`, false)
        .addField('\u200b', '\u200b')
        .setTimestamp()
      );
    } else {
      message.channel.send(":interrobang: Sorry, I could not find the command: **" + command + "**");
    }
  }
};

module.exports.config = {
  name: "server"
}
