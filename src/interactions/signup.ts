import {ButtonInteraction, MessageActionRow, MessageButton, Message, DMChannel, MessageSelectMenu, SelectMenuInteraction, MessageCollector, GuildMember, MessageReaction, Collection, TextBasedChannels} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import config from '../config';
import {updateSignupMessage, updateUnavailable} from '../commands/Moderation/signup';
import {weaponOptions, roleOptions, guildOptions} from './signupConfig';
import editHandler from './editHandler';
import sheetHelper from './sheetHelper';
import messageCollectorHandler from './messageCollectorHandler';
import { ButtonInteractionHandle, SelectMenuInteractionHandle } from './interactionHandles';


/**
 * Local Storage for ongoing Signups
 */
 const userRegistration: Map<string, {name?: string, weapon1?: string, weapon2?: string, role?: string, guild?: string, level?: string, gearscore?: string}> = new Map();

 const userSignup: Set<string> = new Set();

 function signupRunning(userId: string) {
   return userSignup.has(userId);
 }

 function signupStarted(userId: string) {
   userSignup.add(userId);
 }

 function signupFinished(userId: string) {
   userSignup.delete(userId);
 }

class UnavailableEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);
    const userId = interaction.member.user.id;
    const event = interaction.customId.slice(this.id.length);
    if (await sqlHandler.isUnavailable(event, userId)) {
      await sqlHandler.removeUnavailable(event, userId);
      updateUnavailable(event, false);
    } else {
      if (signupRunning(userId)) {
        return;
      }
      if (await sqlHandler.isSignedIn(event, userId)) {
        if (!await sqlHandler.signOut(event, userId)) {
          return;
        }
        await updateSignupMessage(event);
      }
      await sqlHandler.setUnavailable(event, userId);
      await updateUnavailable(event, true);
      console.log('User signed out', userId, event);
    }
  }
}

class SignupEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);
    // Retrieve user id from interaction
    const userId = interaction.member.user.id;
    if (signupRunning(userId)) {
      return;
    }
    // create or retrieve Discord direct Message Channel between user and bot
    const channel = await (interaction.member as GuildMember).createDM();
    const event = interaction.customId.slice(this.id.length);
    console.log('Signup request received', userId, event);
    const player = await sheetHelper.getRowFromSheet(userId);
    // If player already registered himself once
    if (player) {
      // check if sql database has him signed up
      if (await sqlHandler.isSignedIn(event, userId)) {
        // send already signed up message to user
        channel.send(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          title: languageHandler.language.interactions.signup.already_signed_up_title,
          description: languageHandler.language.interactions.signup.already_signed_up_desc,
          color: 0xFF8888,
        }));
        // else sign up user
      } else {
        signupStarted(userId);
        await sheetHelper.sendConfirmationMessage(event, channel, player);
      }
      // else if player didn't register yet
    } else {
      signupStarted(userId);
      // send "get name" message to user
      const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        title: languageHandler.language.interactions.signup.edit.name_title,
        description: languageHandler.language.interactions.signup.edit.name_desc,
      }));

      messageCollectorHandler.createMessageCollector(
          channel,
          message,
          languageHandler.language.interactions.signup.error.name_timeout_desc,
          (msg)=> {
            signupName(userId, event, msg, false);
          },
          userId,
      );
    }
  }
}

/**
 * Called when Ingame name was entered
 */
async function signupName(userId: string, event: string, msg: Message, update: boolean) {
  // save name in temporary map to update google sheet later at once
  userRegistration.set(userId, {name: msg.content});

  let customId: string = interactionHandler.selectMenuInteractions.typeGet(SignupWeapon1Event);
  if (update) {
    customId = interactionHandler.selectMenuInteractions.typeGet(SignupUpdateWeapon1Event);
  }
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId(customId+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  msg.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.weapon1_title,
    description: languageHandler.language.interactions.signup.edit.weapon1_desc,
    components: [row],
  }));
}

 class SignupWeapon1Event extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).weapon1 = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(interactionHandler.selectMenuInteractions.typeGet(SignupWeapon2Event)+event)
                .setPlaceholder('Nothing selected')
                .addOptions(weaponOptions),
        );
    // send message to select first Weapon
    interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.weapon2_title,
      description: languageHandler.language.interactions.signup.edit.weapon2_desc,
      components: [row],
    }));
  }
}

class SignupUpdateWeapon1Event extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).weapon1 = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(interactionHandler.selectMenuInteractions.typeGet(SignupUpdateWeapon2Event)+event)
                .setPlaceholder('Nothing selected')
                .addOptions(weaponOptions),
        );
    // send message to select first Weapon
    interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.weapon2_title,
      description: languageHandler.language.interactions.signup.edit.weapon2_desc,
      components: [row],
    }));
  }
}

 class SignupWeapon2Event extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).weapon2 = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(interactionHandler.selectMenuInteractions.typeGet(SignupRoleEvent)+event)
                .setPlaceholder('Nothing selected')
                .addOptions(roleOptions),
        );
    // send message to select first Weapon
    interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.role_title,
      description: languageHandler.language.interactions.signup.edit.role_desc,
      components: [row],
    }));
  }
}

 class SignupUpdateWeapon2Event extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).weapon2 = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(interactionHandler.selectMenuInteractions.typeGet(SignupUpdateRoleEvent)+event)
                .setPlaceholder('Nothing selected')
                .addOptions(roleOptions),
        );
    // send message to select first Weapon
    interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.role_title,
      description: languageHandler.language.interactions.signup.edit.role_desc,
      components: [row],
    }));
  }
}

 class SignupRoleEvent extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).role = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    const channel = interaction.channel;
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(channel);

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(interactionHandler.selectMenuInteractions.typeGet(SignupGuildEvent)+event)
                .setPlaceholder('Nothing selected')
                .addOptions(guildOptions),
        );
    // send message to select first Weapon
    channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.guild_title,
      description: languageHandler.language.interactions.signup.edit.guild_desc,
      components: [row],
    }));
  }
}

 class SignupUpdateRoleEvent extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).role = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    const channel = interaction.channel;
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(channel);

    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(interactionHandler.selectMenuInteractions.typeGet(SignupUpdateGuildEvent)+event)
                .setPlaceholder('Nothing selected')
                .addOptions(guildOptions),
        );
    // send message to select first Weapon
    channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.guild_title,
      description: languageHandler.language.interactions.signup.edit.guild_desc,
      components: [row],
    }));
  }
}

class SignupGuildEvent extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).guild = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    const channel = interaction.channel;
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(channel);

    // send "get name" message to user
    const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.level_title,
      description: languageHandler.language.interactions.signup.edit.level_desc,
    }));
    messageCollectorHandler.createMessageCollector(
        channel,
        message,
        languageHandler.language.interactions.signup.error.level_timeout_desc,
        async (msg)=> {
          await signupLevel(interaction.user.id, interaction.channel, event, msg, false);
        },
        interaction.user.id,
    );
  }
}

class SignupUpdateGuildEvent extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    userRegistration.get(interaction.user.id).guild = interaction.values[0];
    const event = interaction.customId.slice(this.id.length);
    const channel = interaction.channel;
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(channel);

    // send "get name" message to user
    const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit.level_title,
      description: languageHandler.language.interactions.signup.edit.level_desc,
    }));
    messageCollectorHandler.createMessageCollector(
        channel,
        message,
        languageHandler.language.interactions.signup.error.level_timeout_desc,
        async (msg)=> {
          await signupLevel(interaction.user.id, interaction.channel, event, msg, true);
        },
        interaction.user.id,
    );
  }
}

 /**
  * Called when Level was collected
  */
 async function signupLevel(userId: string, channel: TextBasedChannels, event: string, msg: Message, isUpdate: boolean) {
   userRegistration.get(userId).level = msg.content;

   // send "get name" message to user
   const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
     title: languageHandler.language.interactions.signup.edit.gearscore_title,
     description: languageHandler.language.interactions.signup.edit.gearscore_desc,
   }));

   messageCollectorHandler.createMessageCollector(
       channel,
       message,
       languageHandler.language.interactions.signup.error.gearscore_timeout_desc,
       async (collectedMessage)=> {
         await signupGearscore(userId, channel, event, collectedMessage.content, isUpdate);
       },
       userId,
   );
 }

 /**
  * Called when Gearscore was collected
  */
 async function signupGearscore(userId: string, channel: TextBasedChannels, event: string, content: string, isUpdate: boolean) {
   // retrieve local stored user data
   const userData = userRegistration.get(userId);
   userData.gearscore = content;

   // if call is to update sheet
   if (isUpdate) {
     // retrieve row index in sheet
     const playerIndex = await sheetHelper.getIndexFromSheet(userId);
     await sheetHelper.updateRowInSheet([userData.name, userId, userData.weapon1, userData.weapon2, userData.role, userData.guild, userData.level, userData.gearscore], playerIndex);
     console.log('Google Sheet User Updated', userId, event);
   } else {
     // append new Row to sheet
     await googleSheetsHandler.appendData(config.googleSheetsId, {range: config.googleSheetsRange, values: [[
       userData.name,
       userId,
       userData.weapon1,
       userData.weapon2,
       userData.role,
       userData.guild,
       userData.level,
       userData.gearscore]]});
     console.log('Google Sheet User Registered', userId, event);
   }

   // delete local stored user data
   userRegistration.delete(userId);

   // send confirmation message about changed / registered information
   await sheetHelper.sendConfirmationMessage(event, channel, [userData.name, userId, userData.weapon1, userData.weapon2, userData.role, userData.guild, userData.level, userData.gearscore]);
 }

 class SignupConfirmation extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);
    // retrieve user id directly, because not clicked within a guild
    const userId = interaction.user.id;
    const event = interaction.customId.slice(this.id.length);
    // retrieve channel from interaction
    const channel = interaction.channel;

    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(channel);

    const player = await sheetHelper.getRowFromSheet(userId);
    // If player already registered himself once
    if (player) {
    // update database
      const success = await sqlHandler.signIn(event, userId);
      if (success) {
        await updateSignupMessage(event);
        if (await sqlHandler.isUnavailable(event, userId)) {
          await sqlHandler.removeUnavailable(event, userId);
          await updateUnavailable(event, false);
        }
        // send confirmation message that signup was successfull || might need catch around google sheets api call
        channel.send(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          title: languageHandler.language.interactions.signup.confirmation.success.title,
          description: languageHandler.language.interactions.signup.confirmation.success.desc,
          color: 0x00cc00,
        }));
        console.log('User signed up', userId, event);
      }
      signupFinished(userId);
    }
  }
}


 class SignupEditEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);
    const channel = interaction.channel;
    const event = interaction.customId.slice(this.id.length);
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(channel);

    const [playerIndex, player] = await sheetHelper.getIndexAndRowFromSheet(interaction.user.id);

    const msg = await channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.edit_title,
      description: languageHandler.language.interactions.signup.edit_description,
      categories: [
        {
          title: languageHandler.language.interactions.signup.confirmation.name,
          text: '1️⃣ '+player[0],
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.weapon1,
          text: '2️⃣ '+player[2],
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.weapon2,
          text: '3️⃣ '+player[3],
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.role,
          text: '4️⃣ '+player[4],
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.guild,
          text: '5️⃣ '+player[5],
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.level,
          text: '6️⃣ '+player[6],
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.gearscore,
          text: '7️⃣ '+player[7],
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.edit.everything_title,
          text: '8️⃣ '+languageHandler.language.interactions.signup.edit.everything_desc,
          inline: true,
        },
      ],
    }));


    msg.awaitReactions({filter: (react, user)=>user.id !== config.clientId, max: 1, time: 60000})
        .then(async (collected: Collection<string, MessageReaction>) => {
          msg.delete();
          if (collected.size === 0) {
            signupFinished(interaction.user.id);
            await channel.send(await messageHandler.getRichTextExplicitDefault({
              title: languageHandler.language.interactions.signup.error.timeout_title,
              description: languageHandler.language.interactions.signup.error.reactTime_desc,
              color: 0xcc0000,
            }));
            return;
          }

          // console.log(collected);
          switch (collected.firstKey()) {
            case '1️⃣':
              await editHandler.editName(channel, event, player, playerIndex, interaction.user.id);
              break;
            case '2️⃣':
              await editHandler.editWeapon1(channel, event);
              break;
            case '3️⃣':
              await editHandler.editWeapon2(channel, event);
              break;
            case '4️⃣':
              await editHandler.editRole(channel, event);
              break;
            case '5️⃣':
              await editHandler.editGuild(channel, event);
              break;
            case '6️⃣':
              await editHandler.editLevel(channel, event, player, playerIndex, interaction.user.id);
              break;
            case '7️⃣':
              await editHandler.editGearscore(channel, event, player, playerIndex, interaction.user.id);
              break;
            case '8️⃣':
              const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
                title: languageHandler.language.interactions.signup.edit.name_title,
                description: languageHandler.language.interactions.signup.edit.name_desc,
              }));

              messageCollectorHandler.createMessageCollector(
                  channel,
                  message,
                  languageHandler.language.interactions.signup.error.name_timeout_desc,
                  async (collectedMessage: Message)=> {
                    await signupName(interaction.user.id, event, collectedMessage, true);
                  },
                  interaction.user.id,
              );
              break;
          }
        });
    try {
      await msg.react('1️⃣');
      await msg.react('2️⃣');
      await msg.react('3️⃣');
      await msg.react('4️⃣');
      await msg.react('5️⃣');
      await msg.react('6️⃣');
      await msg.react('7️⃣');
      await msg.react('8️⃣');
    } catch (err) {}
  }
}

 class SignoutEvent extends ButtonInteractionHandle {
  override async handle(interaction: ButtonInteraction) {
    super.handle(interaction);
    // retrieve user id from interaction member
    const userId = interaction.member.user.id;
    if (signupRunning(userId)) {
      return;
    }
    const event = interaction.customId.slice(this.id.length);
    console.log('User signout received', userId, event);
    // create or retrieve Direct Message channel
    const channel = await (interaction.member as GuildMember).createDM();
    // retrieve Players data from google sheets

    if (await sqlHandler.isSignedIn(event, userId)) {
      if (!await sqlHandler.signOut(event, userId)) {
        // Send confirmation message to channel that user was signed out
        channel.send(await messageHandler.getRichTextExplicitDefault( {
          title: languageHandler.language.interactions.signout.error_title,
          description: languageHandler.language.interactions.signout.error_desc,
          color: 0x00cc00,
        }));
        return;
      }
      await updateSignupMessage(event);
      if (!(await sqlHandler.isUnavailable(event, userId))) {
        await sqlHandler.setUnavailable(event, userId);
        await updateUnavailable(event, true);
      }
    }


    // Send confirmation message to channel that user was signed out
    channel.send(await messageHandler.getRichTextExplicitDefault( {
      guild: interaction.guild,
      title: languageHandler.language.interactions.signout.confirmation_title,
      description: languageHandler.language.interactions.signout.confirmation_desc,
      color: 0x00cc00,
    }));
    console.log('User signed out', userId, event);
  }
}

 export default {
   UnavailableEvent,
   SignupEvent,
   SignupWeapon1Event,
   SignupUpdateWeapon1Event,
   SignupWeapon2Event,
   SignupUpdateWeapon2Event,
   SignupRoleEvent,
   SignupUpdateRoleEvent,
   SignupGuildEvent,
   SignupUpdateGuildEvent,
   SignupConfirmation,
   SignupEditEvent,
   SignoutEvent,
   signupRunning,
   signupStarted,
   signupFinished,
 };
