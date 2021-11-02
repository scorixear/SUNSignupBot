import { SlashCommandBuilder, SlashCommandChannelOption, SlashCommandStringOption, SlashCommandUserOption } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction, SelectMenuInteraction } from "discord.js";

abstract class ButtonInteractionHandle {
  public id: string;
  constructor(id: string) {
    this.id = id;
  }

  public async handle(interaction: ButtonInteraction) {
    // set interaction as handled
    setTimeout(()=> interaction.deferUpdate(), 2000);
  }
}

abstract class SelectMenuInteractionHandle {
  public id: string;
  constructor(id: string) {
    this.id = id;
  }

  public async handle(interaction: SelectMenuInteraction) {
    // set interaction as handled
    setTimeout(()=> interaction.deferUpdate(), 2000);
  }
}

abstract class CommandInteractionHandle {
  public command: string;
  public description: ()=>string;
  public example: string;
  public category: string;
  public usage: string;
  public id: Record<string, string>;

  public slashCommandBuilder: SlashCommandBuilder;

  constructor(command: string, description: ()=>string, example: string, category: string, usage: string, options: any[]) {
    this.command = command;
    this.description = description;
    this.example = example;
    this.category = category;
    this.usage = usage;
    this.slashCommandBuilder = new SlashCommandBuilder().setName(this.command).setDescription(this.description());
    for(const option of options) {
      if(option instanceof SlashCommandChannelOption) {
        this.slashCommandBuilder.addChannelOption(option);
      } else if(option instanceof SlashCommandStringOption) {
        this.slashCommandBuilder.addStringOption(option);
      }
    }
  }

  public abstract handle(interaction: CommandInteraction): void;
}

export {ButtonInteractionHandle, SelectMenuInteractionHandle, CommandInteractionHandle}