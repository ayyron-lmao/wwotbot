
import {User, Client, Message, Guild, TextChannel} from 'discord.js';
import {Command, CommandManager, HelpText} from './command';
import {ConfigManager} from './config';
import {getFeed, Feed, FeederException} from 'feederjs';
import {Insults} from './insult';

// create an instance of a Discord Client, and call it bot
const bot: Client = new Client();
const cmdManager: CommandManager = new CommandManager('!');
const config: ConfigManager = new ConfigManager('config.json');
const options = { year: '2-digit', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
const americanDateTime = new Intl.DateTimeFormat('en-US', options).format;
config.load();

function main() {
  console.log('I am starting up!');
  cmdManager.registerCommand(new PongCommand());
  cmdManager.registerCommand(new FeedCommand());
  cmdManager.registerCommand(new HelpCommand());
  // log our bot in
  bot.login(config.get('token', ''));
}

// know when we are ready!
bot.on('ready', () => {
  // setup rss checker
  setInterval(checkRssUpdates, 10000);
  console.log('I am ready!');
});

// create an event listener for messages
bot.on('message', (message: Message) => {
  if (message.author.id === bot.user.id) return;
  cmdManager.call(message);
  message.mentions.users.forEach((user: User, key, map) =>{
    if (user.username === bot.user.username) {
      var ins = new Insults('https://www.insult-generator.org/');
      ins.getInsult((data) => {message.reply('Stop tagging me you ' + data + '!');});
    }
  });
  if (message.content.indexOf('ayy') >= 0 || message.content.indexOf('Ayy') >= 0) {
    var lmaos = ['ayy lmao! :alien:', 'remember the ayylmao! :alien: :face_with_cowboy_hat:', ('Your new name is ' + message.author + 'ayy Lmao! :alien:'), "https://goo.gl/WRuXn3"];
    var lmao = lmaos[Math.floor(Math.random()*lmaos.length)];
    message.reply(lmao);
  }
});

class PongCommand extends Command {
  constructor() {
    super('ping');
  }
  execute(args: string[], message: Message): boolean{
    message.reply('pong!');
    return true;
  }

  getHelp(): HelpText {
    return new HelpText("!ping", "prompts a pong!");
  }
}

class HelpCommand extends Command {
  constructor() {
    super('help');
  }
  execute(args: string[], message: Message): boolean{
    message.reply('Remember this shit!\n' + cmdManager.getHelpMessages());
    return true;
  }

  getHelp(): HelpText {
    return new HelpText("!help", "I HAVEN'T CRIED IN A WHILE!");
  }
}

class FeedCommand extends Command {
  constructor() {
    super('feed');
    let removeCmd: Command = new RemoveFeedCommand();
    this.subCommands.set(removeCmd.cmd, removeCmd);
  }

  execute(args: string[], message: Message): boolean{
    if (args.length = 2) {
      var temp: any = {};
      var cmd: string = args[0];
      temp.url = args[1];
      getFeed(temp.url, (feed) => {
        if (feed instanceof FeederException){
          console.log('error getting feed: ' + feed.message);
          message.reply('I had an issue getting that feed: ' + feed.message);
        } else {
          temp.name = feed.title;
          temp.lastUpdate = '2000-01-01T00:00:00-00:00';
          config.set('rss.'+cmd, temp);
          //config.loadData();
          message.reply('I have registered \'' + temp.name + '\'.');
        }
      });
      return true;
    } else {
      return false;
    }
  }

  getHelp(): HelpText {
    return new HelpText("!feed <command> <url to feed>", "adds a new feed!");
  }
}

class RemoveFeedCommand extends Command {
  constructor() {
    super('remove');
  }
  execute(args: string[], message: Message): boolean{
    if (args.length = 2) {
      var rssConfig = config.get('rss', {});
      var cmd = args[1];
      if (rssConfig[cmd]) {
        message.reply('Unsub\'d \'' + rssConfig[cmd].name + '\' News Feed Fam: ' + rssConfig[cmd].name +
          ', ' + rssConfig[cmd].url);
        delete rssConfig[cmd];
        config.save();
      } else {
        message.reply('I can\'t find this news feed: ' + cmd);
      }
      return true;
    } else {
      return false;
    }
  }

  getHelp(): HelpText {
    return new HelpText("!feed remove <command to remove>", "deletes a feed, that you already added!");
  }
}

function checkRssUpdates() {
  // get feeds to check
  var feeds: any = config.get('rss', {});
  Object.keys(feeds).forEach((value: any, index) => {
    // retreive feed from site
    getFeed(feeds[value].url, (feed: Feed) => {
        // get dates
        var feedConf = getFeedConfig(feed.title);
        var lastUpdate = new Date(feedConf.lastUpdate);
        var updateTime = new Date(cleanDate(feed.entrys[0].updated));
        // check dates to see if new
        if (feedConf.lastUpdate.length == 0 || updateTime > lastUpdate) {
          // its new, so fucking update
          messageAllGuildsDefaultChannel("**" + feed.title + " News Update!**\n\n" +feed.entrys[0].title + 
            ' (' + americanDateTime(new Date(cleanDate(feed.entrys[0].updated))) +
            ')\n' + feed.entrys[0].link[0].href);
          // update the config with the latest update date.
          feedConf.lastUpdate = cleanDate(feed.entrys[0].updated);
          config.save();
          console.log(feed.title + ' udpate!');
        }
    });
  });
}

function cleanDate(date) {
  return date.replace('Z', '');
}

function getFeedConfig(name) {
  let feeds: any = config.get('rss', {});
  let xResult: any = null;
  Object.keys(feeds).forEach((value: any, index) => {
    if (feeds[value].name === name) {
      xResult = feeds[value];
    }
  });
  return xResult;
}

function messageAllGuildsDefaultChannel(message: string) {
  bot.guilds.every((element: Guild, index, array) => {
    let channel: TextChannel = element.defaultChannel as TextChannel;
    channel.send(message)
      .then((message: Message) => { console.log('Sent message to:' + message.guild.name); })
      .catch(console.error);
    return true;
  });
}


main();