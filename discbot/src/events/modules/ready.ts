import { registerCommands } from 'bot-functions';
import { ActivityType, Client } from 'discord.js';

const ready = (client: Client) => {
	console.log(`Bot logged in as ${client.user?.username}!`);
	client.user?.setActivity({
		name: 'la messa, non disturbare',
		type: "LISTENING"
	});

	registerCommands();
};

export { ready };
