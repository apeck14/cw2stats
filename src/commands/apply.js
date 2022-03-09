const { getPlayer, getClan } = require("../util/api");
const { pink, green } = require('../static/colors');
const { getClanBadge, getEmoji, getArenaEmoji, formatTag, hexToRgbA, getLeague, sortArrOfBadges } = require("../util/functions");
const { getPBRating, getCardsRating, getChallsRating, getCW1Rating } = require("../util/ratings");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { createCanvas, registerFont, loadImage } = require("canvas");

module.exports = {
    data: {
        name: 'apply',
        description: 'Apply to join the clan.',
        options: [
            {
                type: 3,
                name: 'tag',
                description: '#PLAYERTAG',
                required: true
            }
        ]
    },
    run: async (i, db, client) => {
        const guilds = db.collection('Guilds');
        const { channels } = await guilds.findOne({ guildID: i.channel.guild.id });
        const { applicationsChannelID } = channels;

        let tag = i.options.getString('tag');

        const player = await getPlayer(tag).catch(async e => {
            if (e?.response?.status === 404) throw '**Player not found.**';

            throw e?.response?.statusText || 'Unexpected Error.';
        });

        //create profile badges image
        const profileBadges = [];

        for (const b of player?.badges) {
            if (b.name === 'Classic12Wins') { //ccs
                if (b.progress < 10) profileBadges.push('cc');
                else if (b.progress < 100) profileBadges.push('cc-10');
                else profileBadges.push('cc-100');
            }
            else if (b.name === 'Grand12Wins') { //gcs
                if (b.progress < 10) profileBadges.push('gc');
                else if (b.progress < 100) profileBadges.push('gc-10');
                else profileBadges.push('gc-100');
            }
            else if (b.name === '1000Wins') profileBadges.push('wins-1000'); //1000 wins
            else if (b.name.indexOf('Played') >= 0) profileBadges.push(`years-${b.name[6]}`); //years played
            else if (b.name.indexOf('LadderTop1000') >= 0) profileBadges.push({ name: 'ladder', progress: `#${b.progress}` }); //ladder
            else if (b.name === 'TopLeague') profileBadges.push(getLeague(b.progress)); //TOP LEAGUE
            else if (b.name.indexOf('LadderTournamentTop1000') >= 0) profileBadges.push({ name: 'gt', progress: `#${b.progress}` }); //GTs
            else if (b.name === 'Crl20Wins') profileBadges.push({ ...b, name: 'crl' }); //CRL
            else if (b.name === 'Crl20Wins2021') profileBadges.push({ ...b, name: 'crl-2021' }); //CRL2021
        }

        let badgeCanvas;

        //create profile badges image
        if (profileBadges.length > 0) {
            sortArrOfBadges(profileBadges);

            const rows = Math.ceil(profileBadges.length / 5);
            badgeCanvas = createCanvas(575, rows * 148);
            const context = badgeCanvas.getContext('2d');

            registerFont('./src/static/fonts/Supercell-Magic.ttf', { family: 'Supercell-Magic' });
            context.font = `14px Supercell-Magic`;
            context.fillStyle = 'white';

            let dx = 0; //distance from left edge
            let dy = 0; //distance from top edge

            //128 | 5 | 128 | 5 | 128 | 5 | 128 | 5 | 128
            //10

            for (let i = 0; i < profileBadges.length; i++) {
                if (i % 5 === 0 && i !== 0) {
                    dx = 0;
                    dy += 148; //move to next row
                }

                const b = profileBadges[i];
                const badgeImg = await loadImage(`./src/static/images/profile/${b?.name || b}.png`);

                context.drawImage(badgeImg, dx, dy, 128, 128);

                if (b instanceof Object) { //write text on badge (GTs/LADDER/CRL/CRL21)
                    const textWidth = context.measureText(b.progress).width;
                    const x = dx + ((128 - textWidth) / 2);
                    const y = dy + 105;

                    context.fillText(b.progress, x, y);
                }

                dx += badgeImg.width - 15;
            }
        }

        let clanBadge;

        if (!player.clan) {
            player.clan = { name: 'None' };
            clanBadge = getClanBadge(-1);
        }
        else { //get clan badge
            const clan = await getClan(player.clan.tag);
            clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies);
        }

        const badgeEmoji = getEmoji(client, clanBadge);
        const levelEmoji = getEmoji(client, `level${player.expLevel}`);
        const ladderEmoji = getEmoji(client, getArenaEmoji(player.trophies));
        const pbEmoji = getEmoji(client, getArenaEmoji(player.bestTrophies));
        const level14 = getEmoji(client, 'level14c');
        const level13 = getEmoji(client, `level13`);
        const level12 = getEmoji(client, `level12`);
        const level11 = getEmoji(client, `level11`);

        const ccWins = player.badges.find(b => b.name === "Classic12Wins")?.progress || 0;
        const gcWins = player.badges.find(b => b.name === "Grand12Wins")?.progress || 0;
        const lvl14Cards = player.cards.filter(c => c.maxLevel - c.level === 0).length;
        const lvl13Cards = player.cards.filter(c => c.maxLevel - c.level === 1).length;
        const lvl12Cards = player.cards.filter(c => c.maxLevel - c.level === 2).length;
        const lvl11Cards = player.cards.filter(c => c.maxLevel - c.level === 3).length;

        const playerGraph = {
            type: 'radar',
            data: {
                labels: ['PB', 'Cards', 'Challs', 'CW1'],
                datasets: [{
                    data: [
                        getPBRating(player.bestTrophies),
                        getCardsRating(player.cards),
                        getChallsRating(player.challengeMaxWins, ccWins, gcWins),
                        getCW1Rating(player.warDayWins)
                    ],
                    borderColor: pink,
                    backgroundColor: hexToRgbA(pink)
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
                                size: 26,
                                weight: 900
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
        const canvas = new ChartJSNodeCanvas({ width: width, height: height });
        const image = await canvas.renderToBuffer(playerGraph);

        const applicationEmbed = {
            color: pink,
            title: '__New Application!__',
            description: ``,
            thumbnail: {
                url: 'attachment://playerGraph.png'
            }
        }

        applicationEmbed.description += `${levelEmoji} [**${player.name}**](https://royaleapi.com/player/${formatTag(tag).substr(1)})\n`;
        applicationEmbed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${player.bestTrophies}\n${badgeEmoji} **${player.clan.name}**\n\n`; //clan & ladder
        applicationEmbed.description += `**__Stats__**\n**CW1 War Wins**: ${player.warDayWins}\n**Most Chall. Wins**: ${player.challengeMaxWins}\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n`; //stats
        applicationEmbed.description += `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}`; //cards
        applicationEmbed.description += `\n\n**Request By**: ${`<@!${i.user.id}>`}`;

        i.editReply({
            embeds: [{
                color: green,
                description: `✅ Request sent for **${player.name}**! A Co-Leader will contact you shortly.`
            }]
        });

        const response = {
            embeds: [applicationEmbed],
            files: [{
                attachment: image,
                name: 'playerGraph.png'
            }]
        }

        if (profileBadges.length > 0) {
            response.files.push({
                attachment: badgeCanvas.toBuffer(),
                name: 'badges.png'
            });

            applicationEmbed.image = {
                url: 'attachment://badges.png'
            }
        }

        return client.channels.cache.get(applicationsChannelID).send(response);
    }
}
