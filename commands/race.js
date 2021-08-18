const { getClanBadge } = require("../util/clanUtil");
const { request, red, orange } = require("../util/otherUtil");

module.exports = {
    name: 'race',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');

        let { channels, color, clanTag, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        if (arg) clanTag = (arg[0] === '#') ? arg.toUpperCase().replace('O', '0') : '#' + arg.toUpperCase().replace('O', '0');

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });
        if (!clanTag) return message.channel.send({ embed: { color: red, description: `**No clan tag linked!** Please use \`${prefix}setClanTag\` to link your clan.` } });

        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanTag.substr(1)}/currentriverrace`);
        if (!rr) return message.channel.send({ embed: { color: red, description: `**Invalid clan tag!**` } });
        else if (rr.clans.length <= 1) return message.channel.send({ embed: { color: orange, description: `**This clan is not in a race.**` } }); //no race happening

        const isCololsseum = rr.periodType === 'colosseum';
        const score = (isCololsseum) ? 'fame' : 'periodPoints';
        const clans = rr.clans
            .sort((a, b) => b[score] - a[score])
            .map(c => ({
                name: c.name,
                tag: c.tag,
                medals: c[score],
                attacksUsedToday: c.participants.reduce((a, b) => a + b.decksUsedToday, 0),
                badgeId: c.badgeId,
                clanWarTrophies: c.clanScore
            }));

        const battleDaysCompleted = () => {
            if (!isCololsseum || (rr.periodIndex - rr.periodLogs[rr.periodLogs.length - 1].periodIndex) <= 4) return 0;
            else return rr.periodIndex - rr.periodLogs[rr.periodLogs.length - 1].periodIndex - 4;
        }

        const avgFame = c => {
            if (isCololsseum) {
                if (c.attacksUsedToday === 0 && battleDaysCompleted() === 0) return 0;
                return c.medals / (c.attacksUsedToday + (200 * battleDaysCompleted()));
            }
            else {
                if (c.attacksUsedToday === 0) return 0;
                return c.medals / c.attacksUsedToday;
            }
        }

        const projectedFame = c => {
            let projFame;

            if (isCololsseum) projFame = c.medals + (c.avgFame * (200 - c.attacksUsedToday + (200 * (3 - battleDaysCompleted())))); //projected weekly fame
            else projFame = c.medals + ((200 - c.attacksUsedToday) * c.avgFame); //projected daily fame

            return Math.round(projFame / 50) * 50;
        }

        //set average and projected fame
        for (const c of clans) {
            c.avgFame = avgFame(c);
            c.projFame = projectedFame(c);
        }

        //set ranks (in case of ties) and average fame
        for (let i = 0; i < clans.length; i++) {
            const tiedClans = clans.filter(c => c.medals === clans[i].medals);

            for (const c of tiedClans) {
                clans.find(x => x.tag === c.tag).rank = i + 1;
            }

            i += tiedClans.length - 1;
        }

        const desc = () => {
            let str = ``;

            for (const c of clans) {
                console.log(c)
                console.log(getClanBadge(c.badgeId, c.clanWarTrophies))
                const badgeEmoji = bot.emojis.cache.find(e => e.name === getClanBadge(c.badgeId, c.clanWarTrophies));
                const fameEmoji = bot.emojis.cache.find(e => e.name === 'fame');

                if (c.tag === clanTag)
                    str += `**${c.rank}. <:${badgeEmoji.name}:${badgeEmoji.id}> __${c.name}__**\n<:${fameEmoji.name}:${fameEmoji.id}> **${c.medals}**\nProj. Fame: **${c.projFame.toFixed(0)}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nFame/Atk: **${c.avgFame.toFixed(1)}**\n\n`;
                else
                    str += `**${c.rank}.** <:${badgeEmoji.name}:${badgeEmoji.id}> **${c.name}**\n<:${fameEmoji.name}:${fameEmoji.id}> ${c.medals}\nProj. Fame: ${c.projFame.toFixed(0)}\nAtks. Left: ${200 - c.attacksUsedToday}\nFame/Atk: ${c.avgFame.toFixed(1)}\n\n`;
            }

            return str;
        }

        const raceEmbed = {
            color: color,
            title: `__Current River Race__`,
            description: desc(),
            thumbnail: {
                url: 'https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest?cb=20180425130200'
            },
            footer: {
                text: (isCololsseum) ? 'Missed attacks negatively affect avg. fame' : ''
            }
        }

        message.channel.send({ embed: raceEmbed });
    }
}