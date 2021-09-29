const { red } = require("../util/otherUtil");

module.exports = {
    name: 'info',
    async execute(message, arg, bot, db) {
        const guilds = db.collection('Guilds');
        const statistics = db.collection('Statistics');
        const matches = db.collection('Matches');

        const { channels, clanTag, adminRoleID, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID, applyChannelID, applicationsChannelID } = channels;
        const { commandsUsed, linkedClans } = (await statistics.find({}).toArray())[0];

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        const serverCount = () => {
            let sum = 0;

            bot.guilds.cache.each(() => {
                sum++;
            });

            return sum;
        };

        const players = await matches.distinct('tag');

        const tag = clanTag || '*NOT SET*';
        const adminRole = (adminRoleID) ? `<@${adminRoleID}>` : '*NOT SET*';
        const colorHex = color || '*NOT SET*';
        const cmdChnl = (commandChannelID) ? `<#${commandChannelID}>` : '*NOT SET*';
        const applyChnl = (applyChannelID) ? `<#${applyChannelID}>` : '*NOT SET*';
        const appChnl = (applicationsChannelID) ? `<#${applicationsChannelID}>` : '*NOT SET*';

        return message.channel.send({
            embed: {
                title: '__Bot & Server Info__',
                color: '#ff237a',
                description: `**Total Servers**: ${serverCount()}\n**Commands Used**: ${commandsUsed}\n**Clans**: ${linkedClans}\n**Players**: ${players.length}\n\n**__Server__**\n**Clan Tag**: ${tag}\n**Color**: ${colorHex}\n**Admin Role**: ${adminRole}\n**Command Channel**: ${cmdChnl}\n**Apply Channel**: ${applyChnl}\n**Applications Channel**: ${appChnl}`
            }
        });
    },
};