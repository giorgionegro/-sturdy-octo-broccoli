import { SlashCommandBuilder } from '@discordjs/builders';
import {
	CmdRequirementError,
	CommandInteractionHelper,
	YouTubeInterface,
	YouTubePlaylist,
	YouTubeVideo
} from 'bot-classes';
import { ResponseEmojis } from 'bot-config';
import { BaseCommand } from '../BaseCommand';
import { command } from '../decorators/command';
import Controls from './Controls';
import Playlist from './Playlist';

export default class Play implements BaseCommand {
	register() {


		return new SlashCommandBuilder()
			.setName('play')
			.setDescription('If the bot is not busy, you can play something. Then it will continue the queue.')
			.addStringOption(option => option.setName('query').setDescription('A search query. First result from the search query will be used.'));
	}

	@command({
		ephemeral: false,
		enforceVoiceConnection: true,
		msgOnExpire: 'Controls has expired. Please use `/controls` to get get it back for another 15 minutes.'
	})
	async runner(handler: CommandInteractionHelper) {
		const query = handler.commandInteraction.options.getString('query');
		const youtubeInterface = YouTubeInterface.fromGuild(handler.guild);
		//if query is a youtube playlist url reinterpret it as a playlist
		if (query != null) {
			if (query.startsWith('https://www.youtube.com/playlist?list=')) {
				const playlistUrl = query;
				const youtubePlaylist = YouTubePlaylist.fromUrl(playlistUrl);

				if (!youtubePlaylist.id) throw new CmdRequirementError('URL provided is not valid, try again?');

				await handler.respondWithEmoji('Searching for videos in the playlist. Please wait...', ResponseEmojis.Loading);

				const videoIdsFromPlaylist = await youtubePlaylist.fetchVideosStr('id');
				const awaitingAppendedIds = videoIdsFromPlaylist.map(id => youtubeInterface.queue.add(id)); // .map(audioInterface.queue.add) won't work.
				const resolvedAppendedIds = await Promise.all(awaitingAppendedIds);
				const filteredAppendedIds = resolvedAppendedIds.filter(Boolean);
				const totalAppendedIds = filteredAppendedIds.length;

				if (totalAppendedIds > 0) {
					await handler.respondWithEmoji(`Added ${totalAppendedIds} video${totalAppendedIds > 1 ? 's' : ''} to the queue.`, ResponseEmojis.Success);
				} else {
					throw new CmdRequirementError('Failed to add playlist items to the queue. Is the URL valid?');
				}


			}
			else if (query) {
				const [video] = await YouTubeVideo.search(query, 1);

				if (!video?.id?.videoId) throw new CmdRequirementError('I could not find a video. Try something less specific?');

				const youtubeVideo = YouTubeVideo.fromId(video.id.videoId);

				if (youtubeInterface.busy) {
					await handler.respondWithEmoji('As I am currently busy, I will add the video to the end of the queue.', ResponseEmojis.Info);
					await youtubeInterface.queue.add(youtubeVideo.id);
				} else {
					await youtubeInterface.queue.prepend(youtubeVideo.id);
					youtubeInterface.setPointer(1);
					await Controls.generateControls(handler, youtubeInterface);

					handler.status = 'SUCCESS';

					await youtubeInterface.runner(handler);
				}
			} else if (!youtubeInterface.busy) {
				youtubeInterface.setPointer(1);
				await Controls.generateControls(handler, youtubeInterface);

				handler.status = 'SUCCESS';

				await youtubeInterface.runner(handler);
			} else {
				throw new CmdRequirementError('I am busy!');
			}
		}
	}
}
