const { getPlayerData } = require("../util/clanUtil");
const { CanvasRenderService } = require('chartjs-node-canvas');
const { red, hexToRgbA } = require("../util/otherUtil");

module.exports = {
    name: 'player',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection("Guilds");
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        if (!arg) {
            const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });

            if (linkedAccount) arg = linkedAccount.tag;
            else if (!arg) return message.channel.send({ embed: { color: red, description: `**No tag given!** To use without a tag, you must link your ID.\n\n__Usage:__\n\`${prefix}player #ABC123\`` } });
        }

        arg = arg.toUpperCase().replace('O', '0');
        if (arg[0] !== '#') arg = '#' + arg;

        const player = await getPlayerData(arg);
        if (!player) return message.channel.send({ embed: { color: red, description: `**Player not found.**` } });

        const pbRating = () => {
            /*
            100: 7500
            80: 6900
            60: 6300
            40: 5700
            20: 5100
            0: 4500
            */

            if (player.pb >= 7500) return 100;
            else if (player.pb <= 4500) return 0;

            return ((player.pb - 4500) / 3000) * 100;
        }

        const cardsRating = () => {
            /*
            Lvl 13 = +1
            Lvl 12 = +0.5
            Lvl 11 = +0.2
            Lvl 10 = +0.08
            Lvl 9 = +0.04

            100: 100+
            80: 80
            60: 60
            40: 40
            20: 20
            0: 0            
            */
            let sum = 0;

            for (const c of player.cards) {
                const diff = c.maxLevel - c.level;

                if (diff === 0) sum++;
                else if (diff === 1) sum += 0.5;
                else if (diff === 2) sum += 0.2;
                else if (diff === 3) sum += 0.08;
                else if (diff === 4) sum += 0.04;
            }

            return sum;
        }

        const challRating = () => {
            /*
            Challenges: (30%)
            GC = +50
            CC = +5

            100: 100+
            80: 80
            60: 60
            40: 40
            20: 20
            0: 0
            
            Most Chall Wins: (70%)
            100: 20
            80: 16
            60: 12
            40: 8
            20: 4
            0: 0
            */

            let challengesRating = (player.challWins * 5) + (player.grandChallWins * 50);
            const mostChallWinsRating = player.mostChallWins * 5;

            if (challengesRating > 100) challengesRating = 100;

            return (challengesRating * 0.3) + (mostChallWinsRating * 0.7);
        }

        const cw1Rating = () => {
            /*
            100: 325+
            80: 260
            60: 195
            40: 130
            20: 65
            0: 0
            */
            if (player.warWins >= 350) return 100;
            return player.warWins / 3.5;
        }

        const chart = {
            type: 'radar',
            data: {
                labels: ['PB', 'Cards', 'Challs', 'CW1'],
                datasets: [{
                    data: [pbRating(), cardsRating(), challRating(), cw1Rating()],
                    borderColor: color,
                    backgroundColor: hexToRgbA(color)
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            color: 'gray'
                        },
                        ticks: {
                            stepSize: 20,
                            display: false
                        },
                        pointLabels: {
                            font: {
                                size: 22,
                                color: 'white',
                                weight: 800
                            }
                        },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }

        const width = 300;
        const height = 300;
        const canvas = new CanvasRenderService(width, height);
        const image = await canvas.renderToBuffer(chart);

        const desc = () => {
            const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
            const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
            const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;

            const top = `Clan: **${player.clan}**\n\n**Lvl.**: ${player.level}\n\n`;
            const mid = `**__Stats__**\n**PB**: ${player.pb}\n**CW1 War Wins**: ${player.warWins}\n**Most Chall. Wins**: ${player.mostChallWins}\n**Classic Chall. Wins**: ${player.challWins}\n**Grand Chall. Wins**: ${player.grandChallWins}\n\n`;
            const bottom = `**__Cards__**\n**Lvl. 13**: ${lvl13Cards}\n**Lvl. 12**: ${lvl12Cards}\n**Lvl. 11**: ${lvl11Cards}\n\n[RoyaleAPI Profile](https://royaleapi.com/player/${arg.substr(1)})`;
            return top + mid + bottom;
        }

        message.channel.send({
            embed: {
                color: color,
                title: `${player.name} (${player.tag})`,
                description: desc(),
                thumbnail: {
                    url: 'attachment://chart.png'
                },
                files: [{
                    attachment: image,
                    name: 'chart.png'
                }]
            }
        });
    }
}