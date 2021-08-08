const { red, green, orange } = require("../util/otherUtil");

module.exports = {
    name: 'setapplychannel',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        
        //must be server owner or admin role
        const { channels, adminRoleID } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { applyChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;
        const channelID = message.channel.id;

        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: 'Only **admins** can set this channel!' } });

        //channel already linked
        if (channelID === applyChannelID) return message.channel.send({ embed: { color: orange, description: `This channel is **already** set!` } });

        //----------------------------------------------------------------------------------------------------------------------------------------
        try {
            guilds.updateOne({ guildID: message.channel.guild.id }, { $set: { 'channels.applyChannelID': channelID } });
            message.channel.send({ embed: { color: green, description: `✅ **Apply** channel now set to <#${channelID}>!` } });
        } catch (e) {
            console.log(e);
            message.channel.send({ embed: { color: red, description: `**Unexpected error.** Try again.` } });
        }
    },
};