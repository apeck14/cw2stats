const mongoUtil = require("../util/mongoUtil");
const { red, green, request, orange } = require("../util/otherUtil");

module.exports = {
    name: 'setclantag',
    execute: async (message, arg) => {
        const db = await mongoUtil.db("General");
        const guilds = db.collection("Guilds");

        //must be server owner or admin role
        const { channels, prefix, adminRoleID, clanTag } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        arg = arg.toUpperCase().replace('O', '0');
        const tag = (arg[0] === '#') ? arg : '#' + arg;
        const clan = await request(`https://proxy.royaleapi.dev/v1/clans/%23${(arg[0] === '#') ? arg.substr(1) : arg}`);

        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: `Only the **server owner** or users with the set admin role can set the clan tag!\n\n__Usage:__\n\`${prefix}setClanTag #TAG\`` } });
        else if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) return message.channel.send({ embed: { color: red, description: `**No tag given!** Try again.\n\n__Usage:__\n\`${prefix}setClanTag #TAG\`` } });
        else if (!clan) return message.channel.send({ embed: { color: red, description: `**Invalid tag!** Try again.\n\n__Usage:__\n\`${prefix}setClanTag #TAG\`` } });

        //clan tag already linked or clan tag already in use by someone else
        if (clanTag === tag) return message.channel.send({ embed: { color: orange, description: `Server is **already** linked to that clan!` } });
        else if (await guilds.findOne({ clanTag: tag })) return message.channel.send({ embed: { color: orange, description: `This clan has already been linked to a different server.`, footer: { text: `If you believe this is an error, contact Apehk#5688 via Discord.` } } });

        //----------------------------------------------------------------------------------------------------------------------------------------
        try {
            guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { clanTag: tag } });
            message.channel.send({ embed: { color: green, description: `✅ Server successfully linked to **${clan.name}**!` } });
        } catch (e) {
            console.log(e);
            message.channel.send({ embed: { color: red, description: `**Unexpected error.** Try again.` } });
        }

    },
};