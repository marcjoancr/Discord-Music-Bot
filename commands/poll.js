const Discord = require("discord.js");

module.exports.run = async (bot, message, args) => {
  let poll_channel;
  message.guild.channels.forEach(channel => {
    if (channel.type == 'text' && channel.name == 'polls') {
      poll_channel = channel;
    }
  });
  if (!poll_channel) {
    poll_channel = await message.guild.createChannel('polls', 'text', [{
      id: message.guild.id,
      deny: ['MANAGE_MESSAGES', 'SEND_MESSAGES']
    }]);
  }

  if (!args[0]) return message.channel.send(':x: Subject needed');

  const color = Math.floor(Math.random()*16777215);

  embed_message = {
    "embed": {
      "title": args.slice(0).join(' '),
      "color": color,
      "timestamp": message.createdAt,
      "footer": {
        "icon_url": bot.iconURL,
        "text": "asked: "
      },
      "author": {
        "name": message.author.username,
        "icon_url": message.author.avatarURL
      }
    }
  }
  poll_channel.send(embed_message)
    .then(function (poll) {
      poll.react('✅');
      poll.react('❌');
    }).catch(function(err) {
      console.log('Something went wrong: ' + err);
     });
};

module.exports.config = {
  name: "poll"
};
