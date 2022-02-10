const { red, orange } = require('../data/colors');
const BANNED_TAGS = require('../data/bannedTags.js');
const { formatTag } = require('../functions/util');

module.exports = {
    name: 'messageCreate',
    once: false,
    execute: async (bot, db, message) => {
        if (!message.guild || message.author.bot) return;

        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');

        const { prefix } = await guilds.findOne({ guildID: message.channel.guild.id });

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const alias = args.shift().toLowerCase();

        const cmdFile = bot.commands.get(bot.aliases.get(alias));

        if (cmdFile) {
            const channelPermissions = message.channel.permissionsFor(bot.user);
            const requiredPerms = ['ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'];
            const missingPerms = requiredPerms.filter(p => !channelPermissions.has(p));

            if (!channelPermissions.has('SEND_MESSAGES')) return;
            else if (missingPerms.length > 0)
                return message.channel.send({ content: `🚨 **__Missing Permissions:__** 🚨\n${missingPerms.map(p => `\n• **${p.replace(/_/g, ' ')}**`).join('')}` });

            try {
                if (cmdFile.disabled)
                    return message.channel.send({ embeds: [{ color: orange, description: ':tools: This command has been **temporarily disabled**.' }] });

                //return message.channel.send({ embeds: [{ color: orange, description: ':tools: Unfortunately RoyaleAPI has unexpectedly shut down their proxy. Other options are being looked into, and any cost-efficient solution will be implemented. Sorry for the inconvenience.' }] });

                message.channel.sendTyping();

                //check if banned tag
                if ((message.guild.id !== '722956243261456536' && message.guild.id !== '592511340736937984' && message.author.id !== '493245767448789023') && BANNED_TAGS.includes(`#${formatTag(args[0])}`)) {
                    console.log(`Banned Tag Used: ${args[0]}`)
                    throw '**This tag has been banned from CW2 Stats.**';
                }

                await cmdFile.execute(message, args, bot, db);
            }
            catch (e) {
                if (channelPermissions.has('EMBED_LINKS')) {
                    if (e.name) {
                        if (e.response?.status === 403) return message.channel.send({ embeds: [{ color: red, description: '**Invalid API token.**', footer: { text: 'If this problem persists, please DM Apehk#5688 on Discord.' } }] });
                        else if (e.response?.status === 429) return message.channel.send({ embeds: [{ color: red, description: '**API Rate Limit reached.** Please try again.' }] });
                        else if (e.response?.status === 500) return message.channel.send({ embeds: [{ color: red, description: '**Unknown error.** Please try again later.' }] });
                        else if (e.response?.status === 503) return message.channel.send({ embeds: [{ color: red, description: '**Clash Royale is in maintenence.** Please try again later.' }] });

                        message.channel.send({ embeds: [{ color: red, description: '**Unexpected error.**', footer: { text: 'If this problem persists, please DM Apehk#5688 on Discord.' } }] });
                        console.log(`${e?.stack}`);
                    }
                    else message.channel.send({ embeds: [{ color: red, description: e }] });
                }

                statistics.updateOne({}, { $inc: { commandsUsed: 1 } });
            }

        }
    }
}