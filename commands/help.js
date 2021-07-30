module.exports = {
  name: 'help',
  execute(message, arg, bot, prefix) {
    const commands = [
      { name: 'lb <full>', desc: 'View clan war leaderboard', main: true },
      { name: 'link #TAG', desc: `Link your CR account to the bot (so you don't have to type in your tag each time you call *${prefix}player* or *${prefix}stats*)`, main: true },
      { name: "player #TAG", desc: "View information about a player", main: true },
      { name: 'apply #TAG', desc: 'Apply to join the clan', main: true },
      { name: 'race <#TAG>', desc: 'View current river race stats', main: true },
      { name: 'stats #TAG', desc: 'View war stats of a member', main: true },
      { name: 'delete #TAG', desc: 'Delete most recent fame score from a specific member', main: false },
      { name: 'add', desc: 'Add fame scores from recent weeks', main: false },
      { name: 'setColor HEXCODE', desc: 'Set the clan color (ex: #F1F1F1)', main: false, setup: true },
      { name: 'setAdminRole @ROLE', desc: 'Set the role that can use admin commands (only the server owner can set this role)', main: false, setup: true },
      { name: 'setClanTag #TAG', desc: 'Set the clan tag for this server', main: false, setup: true },
      { name: 'setApplyChannel', desc: 'Set the channel where new server members should be applying (use command in the channel to set). `Default: Any Channel`', main: false, setup: true },
      { name: 'setApplicationsChannel', desc: 'Set the channel where all applications should be posted (use command in the channel to set). `Default: No Channel`', main: false, setup: true },
      { name: 'setCommandChannel', desc: 'Set the channel where all commands should be allowed (use command in the channel to set). `Default: Any Channel`', main: false, setup: true },
      { name: 'setPrefix PREFIX', desc: 'Set a custom prefix for all bot commands. `Default: ?`', main: false, setup: true }
    ];

    commands.sort((a, b) => {
      if (a.name > b.name) return 1;
      else if (b.name > a.name) return -1;
      return 0;
    });

    const mainCommands = commands.filter(c => c.main).map(c => `• **${prefix}${c.name}** - ${c.desc}\n`).join('');
    const setupCommands = commands.filter(c => c.setup).map(c => `• **${prefix}${c.name}** - ${c.desc}\n`).join('');
    const adminCommands = commands.filter(c => !c.main && !c.setup).map(c => `• **${prefix}${c.name}** - ${c.desc}\n`).join('');

    const helpEmbed = {
      title: '__Commands__',
      color: '#ff237a',
      description: `${mainCommands}\n__**Admin**__\n${adminCommands}\n**__Setup__**\n${setupCommands}`
    }

    message.channel.send({ embed: helpEmbed });
  },
};