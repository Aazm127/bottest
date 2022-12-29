const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const settings = require('./config.json');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const colors = require("colors");

function getFormat(level, msg)
{
	var lvl = "";

	if (level == "info")
		lvl = colors.bgGreen(level);
	else if (level == "warn")
		lvl = colors.bgYellow(level);
	else if (level == "error")
		lvl = colors.bgRed(level);
	else
		lvl = colors.bgCyan(level);

	var date = colors.rainbow(new Date(Date.now).toLocaleTimeString());

	return `${lvl} ${date}: ${msg}`;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
	console.log(getFormat("info", `Logged in as ${c.user.tag}`));
});

const commands = new Collection();
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.set(command.data.toJSON().name, command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(settings.token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(settings.clientId, settings.guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	
	const command = require("./commands/" + commandFiles.find(c => c == interaction.commandName + ".js"));

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(settings.token);