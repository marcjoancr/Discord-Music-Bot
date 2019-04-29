const Discord = require("discord.js");
const { prefix, token, google_api_key } = require('./../config.json');

const ytdl = require('ytdl-core');
const YouTube = require('simple-youtube-api');

const youtube = new YouTube(google_api_key);
const queue = new Map();

module.exports.run = async (bot, msg, args) => {

  const voiceChannel = msg.member.voiceChannel;
  if (!voiceChannel) return msg.channel.send(':x:**Please connect to a voice channel.**');

  const permissions = voiceChannel.permissionsFor(msg.client.user);
  if (!permissions.has('CONNECT'))
    return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
  if (!permissions.has('SPEAK'))
    return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');

  const serverQueue = queue.get(msg.guild.id);
  const command = args[0];

  if (!command) return msg.channel.send(`:x:**Missing args**, add option or url after the command.`);
  if (args.length == 1) {
    switch (command) {
      case "help":
        msg.channel.send(`:information_source: **${prefix}music play <url>**`);
        break;

      //Skips to the next song
      case "s":
      case "skip":
        if (!serverQueue) return msg.channel.send(':x: **There is nothing playing.**');
        serverQueue.connection.dispatcher.end('Skip command has been used!');
        return msg.channel.send(':track_next: **Song skipped!**');
        break;

      //Ends the queue and the bot leaves the voice channel
      case "st":
      case "stop":
        if (!msg.guild.me.voiceChannel) return msg.channel.send("I'm not connected to any channel.");
        if (msg.guild.me.voiceChannelID !== msg.member.voiceChannelID) return msg.channel.send(`:x:<@${msg.author.id}>, **you're not in the same channel.**`);
        if (!serverQueue) {
          voiceChannel.leave();
          return msg.channel.send(`:electric_plug:**Successfully disconnected.**`);
        }
        serverQueue.songs = [];
  		  serverQueue.connection.dispatcher.end('Stop command has been used!');
        msg.channel.send(`:electric_plug:**Successfully disconnected.**`);
        break;

      //Get the list of songs added to the queue
      case "q":
      case "queue":
        if (!serverQueue) return msg.channel.send(':x: **There is nothing playing.**');
        let count = 1;
        msg.channel.send(`
__**Song queue:**__
${serverQueue.songs.map(song => `**${count++}.** __${song.title}__ - Added by __${song.addedBy}__`).join('\n')}

**Now playing:** ${serverQueue.songs[0].title} - Added by ${serverQueue.songs[0].addedBy}
        `);
        break;

      //Get the actual song is playing
      case "np":
        if (!serverQueue) return msg.channel.send(':x: **There is nothing playing.**');
        msg.channel.send(`**Now playing** :notes: \`${serverQueue.songs[0].title}\``);
        break;

      //Pause the song is playing
      case "p":
      case "pause":
        if (serverQueue && serverQueue.playing) {
    			serverQueue.playing = false;
    			serverQueue.connection.dispatcher.pause();
    			return msg.channel.send(':pause_button: **Paused the music for you!**');
    		}
        msg.channel.send(':x: **There is nothing playing.**');
        break;

      //Resume the song if it's paused
      case "r":
      case "resume":
        if (serverQueue && !serverQueue.playing) {
    			serverQueue.playing = true;
    			serverQueue.connection.dispatcher.resume();
  			  return msg.channel.send(':arrow_forward: **Resumed the music for you!**');
    		}
        msg.channel.send(':x: **There is nothing playing.**');
        break;
      default:
        playCommand(msg, voiceChannel, serverQueue, args);
        break;
    }
  } else {
    switch (command) {
    //Plays the song passed as argument if its an url, and search the song in YouTube if its not
    case "pl":
    case "play":
      playCommand(msg, voiceChannel, serverQueue, args);
      break;

    //Displays a command not found message
    default:
      playCommand(msg, voiceChannel, serverQueue, args);
      break;
    }
  }
};

async function playCommand(msg, voiceChannel, serverQueue, args) {
  if (msg.guild.me.voiceChannel && voiceChannel !== msg.guild.me.voiceChannel) return msg.channel.send(`Sorry, I'm already in **${msg.guild.me.voiceChannel}**.`);
  const url = args[0];
  const searchVideoString = args.slice(0).join(' ');

  if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {//Gets the playlist
		const playlist = await youtube.getPlaylist(url);
		const videos = await playlist.getVideos();
    for (const video of Object.values(videos)) {
			const video2 = await youtube.getVideoByID(video.id);
			await handleVideo(video2, msg, voiceChannel, true);
		}
		return msg.channel.send(`:white_check_mark: Playlist :notepad_spiral: **${playlist.title}** has been added to the queue!`);
	} else {
    try {//Gets the video
      msg.channel.send(`:globe_with_meridians: **Searching** :mag_right: \`${searchVideoString}\``);
      var video = await youtube.getVideo(url);
    } catch (error) {
      try {
        var videos = await youtube.searchVideos(searchVideoString, 1);
        var video = await youtube.getVideoByID(videos[0].id);
      } catch (err) {
        return msg.channel.send(`:x: **I could not obtain any search results**.`);
      }
    }
    return await handleVideo(video, msg, voiceChannel);
  }
}

async function handleVideo(video, msg, voiceChannel, playlist = false) {
  const song = {//Creates a song object
    id: video.id,
    title: video.title,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    addedBy: msg.author.username
  };
  if (!serverQueue) {//Creates a queue in case it doesn't exists
    const queueContruct = {
      textChannel: msg.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 1,
      playing: true
    };

    queue.set(msg.guild.id, queueContruct);
    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(msg.guild, queueContruct.songs[0]);
    } catch (err) {
      queue.delete(msg.guild.id);
      return msg.channel.send(`:x:**I could not join the voice channel:** \`${err}\``);
    }
  } else {
    serverQueue.songs.push(song);
		if (playlist) return undefined;
    return msg.channel.send(`:ballot_box_with_check: **Song** \`${song.title}\` **added to queue** - By ${song.addedBy}`);
  }
}

async function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.textChannel.send(`:coffin: **Queue ended.**`);
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  let dispatcher = serverQueue.connection.playStream﻿(await ytdl(song.url, { filter: 'audioonly' }));
  dispatcher.on('end', () => {
    serverQueue.songs.shift();
    play(guild, serverQueue.songs[0])
  })
  .on('error', error => {
    serverQueue.textChannel.send(`**Something went wrong** :x: ${error}`);
  });
  serverQueue.textChannel.send(`**Playing** :notes: \`${song.title}\` - Added by ${song.addedBy}`);
  return;
}

module.exports.config = {
  name: "music"
}
