import {Message} from 'discord.js';

class CommandManager {
  private commandList: Map<string, Command> = new Map();
  private flag: string;

  constructor(flag: string) {
    this.flag = flag;
  }

  public registerCommand(command: Command) {
    if (this.commandList.has(command.cmd)) {
      throw "Command '" + command.cmd + "' already registered.";
    }
    this.commandList.set(command.cmd, command);
  }

  public unRegisterCommand(command: Command) {
    if (!this.commandList.has(command.cmd)) {
      throw "Command '" + command.cmd + "' is not registered. Cannot unregister.";
    }
    this.commandList.delete(command.cmd);
  }

  public call(message: Message): void {
    if (message.content.startsWith(this.flag)) {
      let args: string[] = message.content.substr(this.flag.length).split(' ');
      let cmd: string = args[0];
      if (this.commandList.has(cmd)) {
        let subargs: string[] = args.slice(1);
        if (!this.commandList.get(cmd).callChildren(subargs).execute(subargs, message)) {
          // false means the command was not successful
          message.reply('I don\'t understand that, try this: ' + this.commandList.get(cmd).getHelp().toString());
        }
      } else {
        message.reply("No Comprende!\n" + this.getHelpMessages());
      }
    }
  }

  public getHelpMessages(): string { 
    let msg = '';
    this.commandList.forEach((cmd: Command) => {
      msg += cmd.getHelp().toString() + '\n';
      cmd.getChildren().forEach((value: Command) => { msg += value.getHelp().toString() + '\n'; });
    });
    return msg;
  }
}

abstract class Command {
  private _cmd: string;
  //private callback: any;
  protected subCommands: Map<string, Command> = new Map();

  constructor(acmd: string) {
    this._cmd = acmd;
  }

  callChildren(args: string[]): Command {
    return this.subCommands.has(args[0]) ? this.subCommands.get(args[0]).callChildren(args.slice(1)) : this;
  }

  getChildren(): Map<string, Command> {
    return this.subCommands;
  }

  get cmd(): string {return this._cmd;}

  abstract execute(args: string[], message: Message): boolean;

  abstract getHelp(): HelpText;
}

class HelpText {
  private syntax: string;
  private description: string;

  constructor(syntax: string, description: string) {
    this.syntax = syntax;
    this.description = description;
  }

  public toString() {
    return this.syntax + " | " + this.description;
  }
}

export {HelpText, Command, CommandManager};