import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteractionHelper, YouTubeInterface } from 'bot-classes';
import { ResponseEmojis } from 'bot-config';
import { BaseCommand } from '../BaseCommand';
import { command } from '../decorators/command';
import * as Console from 'console';

export default class Skip implements BaseCommand {
	register() {
		return new SlashCommandBuilder().setName('skip').setDescription('Skip the current audio.');
	}

	@command({
		ephemeral: false,
		enforceVoiceConnection: true
	})
	async runner(handler: CommandInteractionHelper) {
		const audioInterface = YouTubeInterface.fromGuild(handler.guild);
		//Console.log(audioInterface);
		//Console.warn("Skipping");
		await handler.respondWithEmoji('skipping', ResponseEmojis.Danger);
		const skipped = audioInterface.emitAudioFinish();

		if (skipped) await handler.commandInteraction.deleteReply();
		else await handler.respondWithEmoji('I cannot skip as I am not f anything!', ResponseEmojis.Danger);
	}
}
