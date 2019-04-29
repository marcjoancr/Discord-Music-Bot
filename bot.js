const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const fs = require("fs");

const bot = new Discord.Client({disableEveryone: true});
bot.commands = new Discord.Collection();

fs.readdir("./commands/", (err, files) => {

  if (err) console.log(err);
  let jsfile = files.filter(file => file.split(".").pop() === "js")
  if (jsfile.length <= 0){
    console.log("Couldn't find commands.");
    return;
  }
  jsfile.forEach((file, i) =>{
    let props = require(`./commands/${file}`);
    console.log(`${file} loaded!`);
    bot.commands.set(props.help.name, props);
  });

});

bot.on("ready", async () => {
  console.log(`${bot.user.username} is online on ${bot.guilds.size} servers!`);
});

bot.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();

  switch (command) {
    case "test":
      message.channel.send("Yay! I'm actually working!");
      message.delete().catch(O_o=>{});
      break;
    case "info":
      let color = message.member.displayHexColor;
      message.channel.send(new Discord.RichEmbed()
        .setColor(color)
        .setAuthor(`${message.author.username}#${message.author.discriminator}`, `${message.author.avatarURL}`)
      	.addField('Your username', `${message.author.username}`, true)
      	.addField('Your ID account', `${message.author.id}`, true)
        .addField('\u200b', '\u200b')
        .setTimestamp()
      );
      message.delete().catch(O_o=>{});
      break;
    default:
      let commandfile = bot.commands.get(command);
      if (commandfile) {
        commandfile.run(bot, message, args);
      }
      else {
        message.channel.send(":interrobang: Sorry, I could not find the command: **" + command + "**");
        message.delete().catch(O_o=>{});
      }
      break;
  }

});

bot.login(process.env.token);
