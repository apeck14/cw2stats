const { verifyClanBio } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { red, orange, green } = require("../util/otherUtil");

module.exports = {
    name: 'delete',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("General");
        const players = db.collection('Players');
        const guilds = db.collection("Guilds");

        const { channels, adminRoleID, clanTag, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        //must be server owner or admin role
        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: 'Only **admins** can use this command!' } });
        else if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        //tag must be linked and verified
        if (!clanTag) return message.channel.send({ embed: { color: red, description: `You must **link** a clan before using this command!\n\n__Usage:__\n\`${prefix}setClanTag #ABC123\`` } });
        //else if (!await verifyClanBio(clanTag)) return message.channel.send({ embed: { color: orange, description: `__**Clan not verified!**__\n\nTo verify your clan, add '**top.gg/CW2Stats**' to your clan bio!` } });

        if (!arg) return message.channel.send({ embed: { color: red, description: `**No tag given!**\n\n__Usage:__\n\`${prefix}delete #ABC123\`` } });

        const tag = (arg[0] === '#') ? arg : '#' + arg;
        const player = await players.findOne({ tag: tag });

        //player not in database or doesn't have any weeks counted
        if (!player) return message.channel.send({ embed: { color: orange, description: 'Player not found.' } });
        else if (player.fameTotals.length === 0) return message.channel.send({ embed: { color: orange, description: 'Player has no data to delete.' } });
        else if (!player.fameTotals.find(w => w.clanTag === clanTag)) return message.channel.send({ embed: { color: orange, description: 'Player has no data to delete from this clan.' } });

        const { name, fameTotals } = player;
        const mostRecentFame = () => {
            for (let i = fameTotals.length - 1; i >= 0; i--) {
                if (fameTotals[i].clanTag === clanTag) return fameTotals[i];
            }
        }

        const { fame, date } = mostRecentFame();

        //send confirmatiom embed
        const confirmEmbed = await message.channel.send({
            embed:
            {
                color: color,
                title: '__Delete Week?__',
                description: `Name: **${name}**\nTag: **${tag}**\nWeek: **${date}**\nFame: **${fame}**\n\nAre you sure you want to **delete** this data?`
            }
        });

        const emojis = ['✅', '❌'];
        for (const e of emojis) await confirmEmbed.react(e);
        const emojiCollector = await confirmEmbed.awaitReactions((r, u) => u.id === message.author.id && emojis.includes(r.emoji.name), { max: 1, time: 30000 });
        const firstReact = emojiCollector.first();

        confirmEmbed.delete();

        //if yes
        if (firstReact._emoji.name === '✅') {
            await players.updateOne({ tag: tag }, { $pull: { fameTotals: { fame: fame, date: date, clanTag: clanTag } } });

            message.channel.send({ embed: { color: green, description: `✅ Deleted **${fame}** from **${name}**! (**${date}**)` } });
        }

    }
}