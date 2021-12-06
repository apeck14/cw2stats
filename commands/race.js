const { ApiRequest } = require("../functions/api");
const { getEmoji, getClanBadge, formatTag } = require("../functions/util");
const { orange } = require("../data/colors");

module.exports = {
    name: 'race',
    aliases: ['race', 'r'],
    description: 'View any clan\'s current race',
    parameters: ['1-3', '#TAG'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');

        const { channels, color, clans, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { tag1, tag2, tag3 } = clans;
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        let tag;

        if (!args[0] || args[0] === '1') {
            if (!tag1) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan1 #ABC123\`\`\``;
            tag = tag1;
        }
        else if (args[0] === '2') {
            if (!tag2) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan2 #ABC123\`\`\``;
            tag = tag2;
        }
        else if (args[0] === '3') {
            if (!tag3) throw `**No clan linked.**\n\n**__Usage__**\n\`\`\`${prefix}setClan3 #ABC123\`\`\``;
            tag = tag3;
        }
        else tag = '#' + formatTag(args[0]);

        const bannedTags = ['#9GQ8R29Y', '#9UV202Q2'];

        if (bannedTags.includes(tag) && (message.guild.id !== '722956243261456536' && message.guild.id !== '592511340736937984')) {
            console.log(`Banned Tag Used: ${tag}`)
            throw '**This tag has been banned.**';
        }

        const rr = await ApiRequest('currentriverrace', tag)
            .catch((e) => {
                if (e.response?.status === 404) message.channel.send({ embeds: [{ description: '**Clan is not in a river race, or invalid tag.**', color: orange }] });
            });

        if (!rr) return;
        else if (rr.state === 'matchmaking') return message.channel.send({ embeds: [{ description: ':mag: **Matchmaking is underway!**', color: orange }] });
        else if (rr.clans.length <= 1) return message.channel.send({ embeds: [{ description: '**Clan is not in a river race.**', color: orange }] });

        const isCololsseum = rr.periodType === 'colosseum';
        const score = (isCololsseum) ? 'fame' : 'periodPoints';
        const rrClans = rr.clans
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
            const dayOfWeek = rr.periodIndex % 7; // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)
            if (!isCololsseum || dayOfWeek <= 3) return 0;
            else return dayOfWeek - 3;
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
        for (const c of rrClans) {
            c.avgFame = avgFame(c);
            c.projFame = projectedFame(c);
        }

        //set ranks (in case of ties) and average fame
        for (let i = 0; i < rrClans.length; i++) {
            const tiedClans = rrClans.filter(c => c.medals === rrClans[i].medals);

            for (const c of tiedClans) {
                rrClans.find(x => x.tag === c.tag).rank = i + 1;
            }

            i += tiedClans.length - 1;
        }

        const desc = () => {
            let str = ``;

            for (const c of rrClans) {
                const badgeEmoji = getEmoji(bot, getClanBadge(c.badgeId, c.clanWarTrophies));
                const fameEmoji = getEmoji(bot, 'fame');

                if (c.tag === tag)
                    str += `**${c.rank}. ${badgeEmoji} __${c.name}__**\n${fameEmoji} **${c.medals}**\nProj. Fame: **${c.projFame.toFixed(0)}**\nAtks. Left: **${200 - c.attacksUsedToday}**\nFame/Atk: **${c.avgFame.toFixed(1)}**\n\n`;
                else
                    str += `**${c.rank}.** ${badgeEmoji} **${c.name}**\n${fameEmoji} ${c.medals}\nProj. Fame: ${c.projFame.toFixed(0)}\nAtks. Left: ${200 - c.attacksUsedToday}\nFame/Atk: ${c.avgFame.toFixed(1)}\n\n`;
            }

            return str;
        }

        return message.channel.send({
            embeds: [{
                color: color,
                title: (isCololsseum) ? `__Colosseum Week__` : `__Current River Race__`,
                description: desc(),
                thumbnail: {
                    url: 'https://clashroyale.com/uploaded-images-blog/_175xAUTO_fit_center-center_80/icon_pvp.png?mtime=20200830211028'
                },
                footer: {
                    text: (isCololsseum) ? 'Missed attacks negatively affect fame/atk' : ''
                }
            }]
        });
    }
}