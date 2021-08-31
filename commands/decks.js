const { groupBy, uniqWith, isEqual } = require("lodash");
const { getPlayerData } = require("../util/clanUtil");
const { average, orange, red } = require("../util/otherUtil");

module.exports = {
    name: 'decks',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const decks = db.collection('Decks');
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        //account must be linked
        const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });
        let tag;

        if (!linkedAccount) return message.channel.send({ embed: { color: orange, description: `Please **link** your tag to use this feature!\n\n__Usage:__\n\`${prefix}link #ABC123\`` } });
        else tag = linkedAccount.tag;

        const player = await getPlayerData('#988VP2JCR');
        if (!player) return message.channel.send({ embed: { color: red, description: `**Player not found.** Please re-link your tag with the correct tag.` } });

        const cardsGroupedByLevel = groupBy(player.cards, c => 13 - (c.maxLevel - c.level));

        for (const lvl in cardsGroupedByLevel) {
            cardsGroupedByLevel[lvl] = cardsGroupedByLevel[lvl].map(c => c.name.toLowerCase().replace(/\s+/g, '-'));
        }

        const allDecks = await decks.find({}).toArray();
        const deckSets = [];
        let cardsAvailable = [];

        for (let lvl = 13; lvl >= 1; lvl--) {
            cardsAvailable = cardsAvailable.concat(cardsGroupedByLevel[`${lvl}`]);

            if (cardsAvailable.length < 8) continue;

            let tempDecks = [];

            //push all decks to decks containing cards from cardsAvailable
            for (const d of allDecks) {
                let allCardsAvailable = true;

                for (const c of d.cards) {
                    if (!cardsAvailable.includes(c)) allCardsAvailable = false;
                }

                if (allCardsAvailable) tempDecks.push(d);
            }

            tempDecks = tempDecks.map(d => ({ cards: d.cards, rating: d.rating, dateAdded: d.dateAdded }))

            const decks = uniqWith(tempDecks, isEqual); //remove duplicate decks

            if (decks.length < 4) continue;

            //loop through all decks for deck sets
            for (let i = 0; i < decks.length - 1; i++) {
                let decksUsed = [decks[i]];

                for (let x = i + 1; x < decks.length; x++) {
                    let allCardsAvailable = true;

                    for (const c of decks[x].cards) {
                        //check if card is in any of current decks
                        for (const d of decksUsed) {
                            if (d.cards.includes(c)) {
                                allCardsAvailable = false;
                                break;
                            }
                        }
                    }

                    if (allCardsAvailable) decksUsed.push(decks[x]);
                    if (decksUsed.length === 4) deckSets.push(decksUsed);
                }
            }

            if (deckSets.length > 0) break;
        }

        const uniqueDeckSets = uniqWith(deckSets, isEqual);

        if (uniqueDeckSets.length === 0) return message.channel.send({ embed: { color: orange, description: `**No deck sets found.** Try again when you have unlocked more cards.` } });

        //sort by average rating then average time of dateAdded's
        uniqueDeckSets.sort((a, b) => {
            const avgRatingA = average(a.map(d => d.rating));
            const avgRatingB = average(b.map(d => d.rating));
            const avgTimeA = average(a.map(d => (new Date(d.dateAdded)).getTime()));
            const avgTimeB = average(b.map(d => (new Date(d.dateAdded)).getTime()));

            if (avgRatingA === avgRatingB) return avgTimeB - avgTimeA;
            return avgRatingB - avgRatingA;
        });

        function getDeckUrl(cards) {
            const cardData = [
                {
                    "key": "knight",
                    "name": "Knight",
                    "sc_key": "Knight",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 0,
                    "description": "A tough melee fighter. The Barbarian's handsome, cultured cousin. Rumor has it that he was knighted based on the sheer awesomeness of his mustache alone.",
                    "id": 26000000
                },
                {
                    "key": "archers",
                    "name": "Archers",
                    "sc_key": "Archer",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 0,
                    "description": "A pair of lightly armored ranged attackers. They'll help you take down ground and air units, but you're on your own with hair coloring advice.",
                    "id": 26000001
                },
                {
                    "key": "goblins",
                    "name": "Goblins",
                    "sc_key": "Goblins",
                    "elixir": 2,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 1,
                    "description": "Three fast, unarmored melee attackers. Small, fast, green and mean!",
                    "id": 26000002
                },
                {
                    "key": "giant",
                    "name": "Giant",
                    "sc_key": "Giant",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 0,
                    "description": "Slow but durable, only attacks buildings. A real one-man wrecking crew!",
                    "id": 26000003
                },
                {
                    "key": "pekka",
                    "name": "P.E.K.K.A",
                    "sc_key": "Pekka",
                    "elixir": 7,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 4,
                    "description": "A heavily armored, slow melee fighter. Swings from the hip, but packs a huge punch.",
                    "id": 26000004
                },
                {
                    "key": "minions",
                    "name": "Minions",
                    "sc_key": "Minions",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 0,
                    "description": "Three fast, unarmored flying attackers. Roses are red, minions are blue, they can fly, and will crush you!",
                    "id": 26000005
                },
                {
                    "key": "balloon",
                    "name": "Balloon",
                    "sc_key": "Balloon",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 6,
                    "description": "As pretty as they are, you won't want a parade of THESE balloons showing up on the horizon. Drops powerful bombs and when shot down, crashes dealing area damage.",
                    "id": 26000006
                },
                {
                    "key": "witch",
                    "name": "Witch",
                    "sc_key": "Witch",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 5,
                    "description": "Summons Skeletons, shoots destructo beams, has glowing pink eyes that unfortunately don't shoot lasers.",
                    "id": 26000007
                },
                {
                    "key": "barbarians",
                    "name": "Barbarians",
                    "sc_key": "Barbarians",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 3,
                    "description": "A horde of melee attackers with mean mustaches and even meaner tempers.",
                    "id": 26000008
                },
                {
                    "key": "golem",
                    "name": "Golem",
                    "sc_key": "Golem",
                    "elixir": 8,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 10,
                    "description": "Slow but durable, only attacks buildings. When destroyed, explosively splits into two Golemites and deals area damage!",
                    "id": 26000009
                },
                {
                    "key": "skeletons",
                    "name": "Skeletons",
                    "sc_key": "Skeletons",
                    "elixir": 1,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 2,
                    "description": "Three fast, very weak melee fighters. Surround your enemies with this pile of bones!",
                    "id": 26000010
                },
                {
                    "key": "valkyrie",
                    "name": "Valkyrie",
                    "sc_key": "Valkyrie",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 2,
                    "description": "Tough melee fighter, deals area damage around her. Swarm or horde, no problem! She can take them all out with a few spins.",
                    "id": 26000011
                },
                {
                    "key": "skeleton-army",
                    "name": "Skeleton Army",
                    "sc_key": "SkeletonArmy",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 2,
                    "description": "Spawns an army of Skeletons. Meet Larry and his friends Harry, Gerry, Terry, Mary, etc.",
                    "id": 26000012
                },
                {
                    "key": "bomber",
                    "name": "Bomber",
                    "sc_key": "Bomber",
                    "elixir": 2,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 2,
                    "description": "Small, lightly protected skeleton who throws bombs. Deals area damage that can wipe out a swarm of enemies.",
                    "id": 26000013
                },
                {
                    "key": "musketeer",
                    "name": "Musketeer",
                    "sc_key": "Musketeer",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 0,
                    "description": "Don't be fooled by her delicately coiffed hair, the Musketeer is a mean shot with her trusty boomstick.",
                    "id": 26000014
                },
                {
                    "key": "baby-dragon",
                    "name": "Baby Dragon",
                    "sc_key": "BabyDragon",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 2,
                    "description": "Burps fireballs from the sky that deal area damage. Baby dragons hatch cute, hungry and ready for a barbeque.",
                    "id": 26000015
                },
                {
                    "key": "prince",
                    "name": "Prince",
                    "sc_key": "Prince",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 7,
                    "description": "Don't let the little pony fool you. Once the Prince gets a running start, you WILL be trampled. Deals double damage once he gets charging.",
                    "id": 26000016
                },
                {
                    "key": "wizard",
                    "name": "Wizard",
                    "sc_key": "Wizard",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 4,
                    "description": "The most awesome man to ever set foot in the Arena, the Wizard will blow you away with his handsomeness... and/or fireballs.",
                    "id": 26000017
                },
                {
                    "key": "mini-pekka",
                    "name": "Mini P.E.K.K.A",
                    "sc_key": "MiniPekka",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 0,
                    "description": "The Arena is a certified butterfly-free zone. No distractions for P.E.K.K.A, only destruction.",
                    "id": 26000018
                },
                {
                    "key": "spear-goblins",
                    "name": "Spear Goblins",
                    "sc_key": "SpearGoblins",
                    "elixir": 2,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 1,
                    "description": "Three unarmored ranged attackers. Who the heck taught these guys to throw spears!? Who thought that was a good idea?!",
                    "id": 26000019
                },
                {
                    "key": "giant-skeleton",
                    "name": "Giant Skeleton",
                    "sc_key": "GiantSkeleton",
                    "elixir": 6,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 4,
                    "description": "The bigger the skeleton, the bigger the bomb. Carries a bomb that blows up when the Giant Skeleton dies.",
                    "id": 26000020
                },
                {
                    "key": "hog-rider",
                    "name": "Hog Rider",
                    "sc_key": "HogRider",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 5,
                    "description": "Fast melee troop that targets buildings and can jump over the river. He followed the echoing call of \"Hog Riderrrrr\" all the way through the Arena doors.",
                    "id": 26000021
                },
                {
                    "key": "minion-horde",
                    "name": "Minion Horde",
                    "sc_key": "MinionHorde",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 10,
                    "description": "Six fast, unarmored flying attackers. Three's a crowd, six is a horde!",
                    "id": 26000022
                },
                {
                    "key": "ice-wizard",
                    "name": "Ice Wizard",
                    "sc_key": "IceWizard",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 8,
                    "description": "This chill caster throws ice shards that slow down enemies' movement and attack speed. Despite being freezing cold, he has a handlebar mustache that's too hot for TV.",
                    "id": 26000023
                },
                {
                    "key": "royal-giant",
                    "name": "Royal Giant",
                    "sc_key": "RoyalGiant",
                    "elixir": 6,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 7,
                    "description": "Destroying enemy buildings with his massive cannon is his job; making a raggedy blond beard look good is his passion.",
                    "id": 26000024
                },
                {
                    "key": "guards",
                    "name": "Guards",
                    "sc_key": "SkeletonWarriors",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 12,
                    "description": "Three ruthless bone brothers with shields. Knock off their shields and all that's left are three ruthless bone brothers.",
                    "id": 26000025
                },
                {
                    "key": "princess",
                    "name": "Princess",
                    "sc_key": "Princess",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 5,
                    "description": "This stunning Princess shoots flaming arrows from long range. If you're feeling warm feelings towards her, it's probably because you're on fire.",
                    "id": 26000026
                },
                {
                    "key": "dark-prince",
                    "name": "Dark Prince",
                    "sc_key": "DarkPrince",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 7,
                    "description": "The Dark Prince deals area damage and lets his spiked club do the talking for him - because when he does talk, it sounds like he has a bucket on his head.",
                    "id": 26000027
                },
                {
                    "key": "three-musketeers",
                    "name": "Three Musketeers",
                    "sc_key": "ThreeMusketeers",
                    "elixir": 9,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 7,
                    "description": "Trio of powerful, independent markswomen, fighting for justice and honor. Disrespecting them would not be just a mistake, it would be a cardinal sin!",
                    "id": 26000028
                },
                {
                    "key": "lava-hound",
                    "name": "Lava Hound",
                    "sc_key": "LavaHound",
                    "elixir": 7,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 10,
                    "description": "The Lava Hound is a majestic flying beast that attacks buildings. The Lava Pups are less majestic angry babies that attack anything.",
                    "id": 26000029
                },
                {
                    "key": "ice-spirit",
                    "name": "Ice Spirit",
                    "sc_key": "IceSpirits",
                    "elixir": 1,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 8,
                    "description": "Spawns one lively little Ice Spirit to freeze a group of enemies. Stay frosty.",
                    "id": 26000030
                },
                {
                    "key": "fire-spirit",
                    "name": "Fire Spirit",
                    "sc_key": "FireSpirits",
                    "elixir": 1,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 4,
                    "description": "The Fire Spirit is on a kamikaze mission to give you a warm hug. It'd be adorable if it wasn't on fire.",
                    "id": 26000031
                },
                {
                    "key": "miner",
                    "name": "Miner",
                    "sc_key": "Miner",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 4,
                    "description": "The Miner can burrow his way underground and appear anywhere in the Arena. It's not magic, it's a shovel. A shovel that deals reduced damage to Crown Towers.",
                    "id": 26000032
                },
                {
                    "key": "sparky",
                    "name": "Sparky",
                    "sc_key": "ZapMachine",
                    "elixir": 6,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 11,
                    "description": "Sparky slowly charges up, then unloads MASSIVE area damage. Overkill isn't in her vocabulary.",
                    "id": 26000033
                },
                {
                    "key": "bowler",
                    "name": "Bowler",
                    "sc_key": "Bowler",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 13,
                    "description": "This big blue dude digs the simple things in life - Dark Elixir drinks and throwing rocks. His massive boulders roll through their target, hitting everything behind for a strike!",
                    "id": 26000034
                },
                {
                    "key": "lumberjack",
                    "name": "Lumberjack",
                    "sc_key": "RageBarbarian",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 14,
                    "description": "He chops trees by day and hunts The Log by night. His bottle of Rage spills everywhere when he's defeated.",
                    "id": 26000035
                },
                {
                    "key": "battle-ram",
                    "name": "Battle Ram",
                    "sc_key": "BattleRam",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 3,
                    "description": "Two Barbarians holding a big log charge at the nearest building, dealing significant damage if they connect; then they go to town with their swords!",
                    "id": 26000036
                },
                {
                    "key": "inferno-dragon",
                    "name": "Inferno Dragon",
                    "sc_key": "InfernoDragon",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 9,
                    "description": "Shoots a focused beam of fire that increases in damage over time. Wears a helmet because flying can be dangerous.",
                    "id": 26000037
                },
                {
                    "key": "ice-golem",
                    "name": "Ice Golem",
                    "sc_key": "IceGolemite",
                    "elixir": 2,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 8,
                    "description": "He's tough, targets buildings and explodes when destroyed, slowing nearby enemies. Made entirely out of ice... or is he?! Yes.",
                    "id": 26000038
                },
                {
                    "key": "mega-minion",
                    "name": "Mega Minion",
                    "sc_key": "MegaMinion",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 3,
                    "description": "Flying, armored and powerful. What could be its weakness?! Cupcakes.",
                    "id": 26000039
                },
                {
                    "key": "dart-goblin",
                    "name": "Dart Goblin",
                    "sc_key": "BlowdartGoblin",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 9,
                    "description": "Runs fast, shoots far and chews gum. How does he blow darts with a mouthful of Double Trouble Gum? Years of didgeridoo lessons.",
                    "id": 26000040
                },
                {
                    "key": "goblin-gang",
                    "name": "Goblin Gang",
                    "sc_key": "GoblinGang",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 9,
                    "description": "Spawns five Goblins - three with knives, two with spears - at a discounted Elixir cost. It's like a Goblin Value Pack!",
                    "id": 26000041
                },
                {
                    "key": "electro-wizard",
                    "name": "Electro Wizard",
                    "sc_key": "ElectroWizard",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 11,
                    "description": "He lands with a \"POW!\", stuns nearby enemies and shoots lightning with both hands! What a show off.",
                    "id": 26000042
                },
                {
                    "key": "elite-barbarians",
                    "name": "Elite Barbarians",
                    "sc_key": "AngryBarbarians",
                    "elixir": 6,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 10,
                    "description": "Spawns a pair of leveled up Barbarians. They're like regular Barbarians, only harder, better, faster and stronger.",
                    "id": 26000043
                },
                {
                    "key": "hunter",
                    "name": "Hunter",
                    "sc_key": "Hunter",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 10,
                    "description": "He deals BIG damage up close - not so much at range. What he lacks in accuracy, he makes up for with his impressively bushy eyebrows.",
                    "id": 26000044
                },
                {
                    "key": "executioner",
                    "name": "Executioner",
                    "sc_key": "AxeMan",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 14,
                    "description": "He throws his axe like a boomerang, striking all enemies on the way out AND back. It's a miracle he doesn't lose an arm.",
                    "id": 26000045
                },
                {
                    "key": "bandit",
                    "name": "Bandit",
                    "sc_key": "Assassin",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 13,
                    "description": "The Bandit dashes to her target and delivers an extra big hit! While dashing, she can't be touched. The mask keeps her identity safe, and gives her bonus cool points!",
                    "id": 26000046
                },
                {
                    "key": "royal-recruits",
                    "name": "Royal Recruits",
                    "sc_key": "RoyalRecruits",
                    "elixir": 7,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 7,
                    "description": "Deploys a line of recruits armed with spears, shields and wooden buckets. They dream of ponies and one day wearing metal buckets.",
                    "id": 26000047
                },
                {
                    "key": "night-witch",
                    "name": "Night Witch",
                    "sc_key": "DarkWitch",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 14,
                    "description": "Summons Bats to do her bidding, even after death! If you get too close, she isn't afraid of pitching in with her mean-looking battle staff.",
                    "id": 26000048
                },
                {
                    "key": "bats",
                    "name": "Bats",
                    "sc_key": "Bats",
                    "elixir": 2,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 5,
                    "description": "Spawns a handful of tiny flying creatures. Think of them as sweet, purple... balls of DESTRUCTION!",
                    "id": 26000049
                },
                {
                    "key": "royal-ghost",
                    "name": "Royal Ghost",
                    "sc_key": "Ghost",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 12,
                    "description": "He drifts invisibly through the Arena until he's startled by an enemy... then he attacks! Then he's invisible again! Zzzz.",
                    "id": 26000050
                },
                {
                    "key": "ram-rider",
                    "name": "Ram Rider",
                    "sc_key": "RamRider",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 10,
                    "description": "Together they charge through the Arena; snaring enemies, knocking down towers ... and chewing grass!?",
                    "id": 26000051
                },
                {
                    "key": "zappies",
                    "name": "Zappies",
                    "sc_key": "MiniSparkys",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 11,
                    "description": "Spawns a pack of miniature Zap machines. Who controls them...? Only the Master Builder knows.",
                    "id": 26000052
                },
                {
                    "key": "rascals",
                    "name": "Rascals",
                    "sc_key": "Rascals",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 13,
                    "description": "Spawns a mischievous trio of Rascals! The boy takes the lead, while the girls pelt enemies from behind... with slingshots full of Double Trouble Gum!",
                    "id": 26000053
                },
                {
                    "key": "cannon-cart",
                    "name": "Cannon Cart",
                    "sc_key": "MovingCannon",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 15,
                    "description": "A Cannon on wheels?! Bet they won't see that coming! Once you break its shield, it becomes a Cannon not on wheels.",
                    "id": 26000054
                },
                {
                    "key": "mega-knight",
                    "name": "Mega Knight",
                    "sc_key": "MegaKnight",
                    "elixir": 7,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 7,
                    "description": "He lands with the force of 1,000 mustaches, then jumps from one foe to the next dealing huge area damage. Stand aside!",
                    "id": 26000055
                },
                {
                    "key": "skeleton-barrel",
                    "name": "Skeleton Barrel",
                    "sc_key": "SkeletonBalloon",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 12,
                    "description": "It's a Skeleton party in the sky, until all the balloons pop... then it's a Skeleton party on the ground!",
                    "id": 26000056
                },
                {
                    "key": "flying-machine",
                    "name": "Flying Machine",
                    "sc_key": "DartBarrell",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 6,
                    "description": "The Master Builder has sent his first contraption to the Arena! It's a fast and fun flying machine, but fragile!",
                    "id": 26000057
                },
                {
                    "key": "wall-breakers",
                    "name": "Wall Breakers",
                    "sc_key": "Wallbreakers",
                    "elixir": 2,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 5,
                    "description": "A daring duo of dangerous dive bombers. Nothing warms a Wall Breaker's cold and undead heart like blowing up buildings.",
                    "id": 26000058
                },
                {
                    "key": "royal-hogs",
                    "name": "Royal Hogs",
                    "sc_key": "RoyalHogs",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 7,
                    "description": "The King's personal pets are loose! They love to chomp on apples and towers alike - who let the hogs out?!",
                    "id": 26000059
                },
                {
                    "key": "goblin-giant",
                    "name": "Goblin Giant",
                    "sc_key": "GoblinGiant",
                    "elixir": 6,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 9,
                    "description": "This jolly green Goblin Giant stomps towards enemy buildings. He carries two Spear Goblins everywhere he goes. It's a weird but functional arrangement.",
                    "id": 26000060
                },
                {
                    "key": "fisherman",
                    "name": "Fisherman",
                    "sc_key": "Fisherman",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 15,
                    "description": "His Ranged Attack can pull enemies towards him, and pull himself to enemy buildings. He's also mastered the ancient art of 'Fish Slapping'.",
                    "id": 26000061
                },
                {
                    "key": "magic-archer",
                    "name": "Magic Archer",
                    "sc_key": "EliteArcher",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 13,
                    "description": "Not quite a Wizard, nor an Archer - he shoots a magic arrow that passes through and damages all enemies in its path. It's not a trick, it's magic!",
                    "id": 26000062
                },
                {
                    "key": "electro-dragon",
                    "name": "Electro Dragon",
                    "sc_key": "ElectroDragon",
                    "elixir": 5,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 11,
                    "description": "Spits out bolts of electricity hitting up to three targets. Suffers from middle child syndrome to boot.",
                    "id": 26000063
                },
                {
                    "key": "firecracker",
                    "name": "Firecracker",
                    "sc_key": "Firecracker",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 14,
                    "description": "Shoots a firework that explodes upon impact, damaging the target and showering anything directly behind it with sparks. This is what happens when Archers get bored!",
                    "id": 26000064
                },
                {
                    "key": "elixir-golem",
                    "name": "Elixir Golem",
                    "sc_key": "ElixirGolem",
                    "elixir": 3,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 14,
                    "description": "Splits into two Elixir Golemites when destroyed, which split into two sentient Blobs when defeated. A Blob gives your opponent 1 Elixir when destroyed!",
                    "id": 26000067
                },
                {
                    "key": "battle-healer",
                    "name": "Battle Healer",
                    "sc_key": "BattleHealer",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 15,
                    "description": "With each attack, she unleashes a powerful healing aura that restores Hitpoints to herself and friendly Troops. When she isn't attacking, she passively heals herself!",
                    "id": 26000068
                },
                {
                    "key": "skeleton-dragons",
                    "name": "Skeleton Dragons",
                    "sc_key": "SkeletonDragons",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 4,
                    "description": "This pair of skeletal scorchers deal Area Damage and fly above the Arena. They also play a mean rib cage xylophone duet.",
                    "id": 26000080
                },
                {
                    "key": "mother-witch",
                    "name": "Mother Witch",
                    "sc_key": "WitchMother",
                    "elixir": 4,
                    "type": "Troop",
                    "rarity": "Legendary",
                    "arena": 15,
                    "description": "Places a curse on enemy Troops with each attack. When a cursed Troop is destroyed, it turns into a building-targeting Hog that fights alongside the Mother Witch!\n\nShe also bakes great cookies.",
                    "id": 26000083
                },
                {
                    "key": "electro-spirit",
                    "name": "Electro Spirit",
                    "sc_key": "ElectroSpirit",
                    "elixir": 1,
                    "type": "Troop",
                    "rarity": "Common",
                    "arena": 11,
                    "description": "Jumps on enemies, dealing Area Damage and stunning up to 9 enemy Troops. Locked in an eternal battle with Knight for the best mustache.",
                    "id": 26000084
                },
                {
                    "key": "electro-giant",
                    "name": "Electro Giant",
                    "sc_key": "ElectroGiant",
                    "elixir": 8,
                    "type": "Troop",
                    "rarity": "Epic",
                    "arena": 11,
                    "description": "He channels electricity through his Zap Pack, a unique device that stuns and damages any Troop attacking him within its range.\n\nDon't tell him that his finger guns aren't real! He'll zap you.",
                    "id": 26000085
                },
                {
                    "key": "cannon",
                    "name": "Cannon",
                    "sc_key": "Cannon",
                    "elixir": 3,
                    "type": "Building",
                    "rarity": "Common",
                    "arena": 3,
                    "description": "Defensive building. Shoots cannonballs with deadly effect, but cannot target flying troops.",
                    "id": 27000000
                },
                {
                    "key": "goblin-hut",
                    "name": "Goblin Hut",
                    "sc_key": "GoblinHut",
                    "elixir": 5,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 9,
                    "description": "Building that spawns Spear Goblins. Don't look inside... you don't want to see how they're made.",
                    "id": 27000001
                },
                {
                    "key": "mortar",
                    "name": "Mortar",
                    "sc_key": "Mortar",
                    "elixir": 4,
                    "type": "Building",
                    "rarity": "Common",
                    "arena": 6,
                    "description": "Defensive building with a long range. Shoots big boulders that deal area damage, but cannot hit targets that get too close!",
                    "id": 27000002
                },
                {
                    "key": "inferno-tower",
                    "name": "Inferno Tower",
                    "sc_key": "InfernoTower",
                    "elixir": 5,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 4,
                    "description": "Defensive building, roasts targets for damage that increases over time. Burns through even the biggest and toughest enemies!",
                    "id": 27000003
                },
                {
                    "key": "bomb-tower",
                    "name": "Bomb Tower",
                    "sc_key": "BombTower",
                    "elixir": 4,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 12,
                    "description": "Defensive building that houses a Bomber. Deals area damage to anything dumb enough to stand near it.",
                    "id": 27000004
                },
                {
                    "key": "barbarian-hut",
                    "name": "Barbarian Hut",
                    "sc_key": "BarbarianHut",
                    "elixir": 7,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 14,
                    "description": "Building that periodically spawns Barbarians to fight the enemy. Time to make the Barbarians!",
                    "id": 27000005
                },
                {
                    "key": "tesla",
                    "name": "Tesla",
                    "sc_key": "Tesla",
                    "elixir": 4,
                    "type": "Building",
                    "rarity": "Common",
                    "arena": 11,
                    "description": "Defensive building. Whenever it's not zapping the enemy, the power of Electrickery is best kept grounded.",
                    "id": 27000006
                },
                {
                    "key": "elixir-collector",
                    "name": "Elixir Collector",
                    "sc_key": "Elixir Collector",
                    "elixir": 6,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 13,
                    "description": "You gotta spend Elixir to make Elixir! This building makes 8 Elixir over its Lifetime. Does not appear in your starting hand.",
                    "id": 27000007
                },
                {
                    "key": "x-bow",
                    "name": "X-Bow",
                    "sc_key": "Xbow",
                    "elixir": 6,
                    "type": "Building",
                    "rarity": "Epic",
                    "arena": 6,
                    "description": "Nice tower you got there. Would be a shame if this X-Bow whittled it down from this side of the Arena...",
                    "id": 27000008
                },
                {
                    "key": "tombstone",
                    "name": "Tombstone",
                    "sc_key": "Tombstone",
                    "elixir": 3,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 2,
                    "description": "Building that periodically spawns Skeletons to fight the enemy... and when destroyed, spawns 3 more Skeletons! Creepy.",
                    "id": 27000009
                },
                {
                    "key": "furnace",
                    "name": "Furnace",
                    "sc_key": "FirespiritHut",
                    "elixir": 4,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 10,
                    "description": "The Furnace spawns one Fire Spirit at a time. It also makes great brick-oven pancakes.",
                    "id": 27000010
                },
                {
                    "key": "goblin-cage",
                    "name": "Goblin Cage",
                    "sc_key": "GoblinCage",
                    "elixir": 4,
                    "type": "Building",
                    "rarity": "Rare",
                    "arena": 1,
                    "description": "When the Goblin Cage is destroyed, a Goblin Brawler is unleashed into the Arena! Goblin Brawler always skips leg day.",
                    "id": 27000012
                },
                {
                    "key": "goblin-drill",
                    "name": "Goblin Drill",
                    "sc_key": "GoblinDrill",
                    "elixir": 4,
                    "type": "Building",
                    "rarity": "Epic",
                    "arena": 13,
                    "description": "Building capable of burrowing underground and appearing anywhere in the Arena. Spawns Goblins one at a time until destroyed. Then spawns a few more, to make sure everything nearby has been properly stabbed.",
                    "id": 27000013
                },
                {
                    "key": "fireball",
                    "name": "Fireball",
                    "sc_key": "Fireball",
                    "elixir": 4,
                    "type": "Spell",
                    "rarity": "Rare",
                    "arena": 0,
                    "description": "Annnnnd... Fireball. Incinerates a small area, dealing high damage. Reduced damage to Crown Towers.",
                    "id": 28000000
                },
                {
                    "key": "arrows",
                    "name": "Arrows",
                    "sc_key": "Arrows",
                    "elixir": 3,
                    "type": "Spell",
                    "rarity": "Common",
                    "arena": 0,
                    "description": "Arrows pepper a large area, damaging all enemies hit. Reduced damage to Crown Towers.",
                    "id": 28000001
                },
                {
                    "key": "rage",
                    "name": "Rage",
                    "sc_key": "Rage",
                    "elixir": 2,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 14,
                    "description": "Increases troop movement and attack speed. Buildings attack faster and summon troops quicker, too. Chaaaarge!",
                    "id": 28000002
                },
                {
                    "key": "rocket",
                    "name": "Rocket",
                    "sc_key": "Rocket",
                    "elixir": 6,
                    "type": "Spell",
                    "rarity": "Rare",
                    "arena": 6,
                    "description": "Deals high damage to a small area. Looks really awesome doing it. Reduced damage to Crown Towers.",
                    "id": 28000003
                },
                {
                    "key": "goblin-barrel",
                    "name": "Goblin Barrel",
                    "sc_key": "GoblinBarrel",
                    "elixir": 3,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 3,
                    "description": "Spawns three Goblins anywhere in the Arena. It's going to be a thrilling ride, boys!",
                    "id": 28000004
                },
                {
                    "key": "freeze",
                    "name": "Freeze",
                    "sc_key": "Freeze",
                    "elixir": 4,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 8,
                    "description": "Freezes and damages enemy troops and buildings, making them unable to move or attack. Everybody chill. Reduced damage to Crown Towers.",
                    "id": 28000005
                },
                {
                    "key": "mirror",
                    "name": "Mirror",
                    "sc_key": "Mirror",
                    "elixir": 1,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 12,
                    "description": "Mirrors your last card played for +1 Elixir. Does not appear in your starting hand.",
                    "id": 28000006
                },
                {
                    "key": "lightning",
                    "name": "Lightning",
                    "sc_key": "Lightning",
                    "elixir": 6,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 8,
                    "description": "Bolts of lightning damage and stun up to three enemy troops or buildings with the most hitpoints in the target area. Reduced damage to Crown Towers.",
                    "id": 28000007
                },
                {
                    "key": "zap",
                    "name": "Zap",
                    "sc_key": "Zap",
                    "elixir": 2,
                    "type": "Spell",
                    "rarity": "Common",
                    "arena": 5,
                    "description": "Zaps enemies, briefly stunning them and dealing damage inside a small radius. Reduced damage to Crown Towers.",
                    "id": 28000008
                },
                {
                    "key": "poison",
                    "name": "Poison",
                    "sc_key": "Poison",
                    "elixir": 4,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 9,
                    "description": "Covers the area in a deadly toxin, damaging enemy troops and buildings over time. Yet somehow leaves the grass green and healthy. Go figure! Reduced damage to Crown Towers.",
                    "id": 28000009
                },
                {
                    "key": "graveyard",
                    "name": "Graveyard",
                    "sc_key": "Graveyard",
                    "elixir": 5,
                    "type": "Spell",
                    "rarity": "Legendary",
                    "arena": 12,
                    "description": "Surprise! It's a party. A Skeleton party, anywhere in the Arena. Yay!",
                    "id": 28000010
                },
                {
                    "key": "the-log",
                    "name": "The Log",
                    "sc_key": "Log",
                    "elixir": 2,
                    "type": "Spell",
                    "rarity": "Legendary",
                    "arena": 6,
                    "description": "A spilt bottle of Rage turned an innocent tree trunk into \"The Log\". Now, it seeks revenge by crushing anything in its path! Reduced damage to Crown Towers.",
                    "id": 28000011
                },
                {
                    "key": "tornado",
                    "name": "Tornado",
                    "sc_key": "Tornado",
                    "elixir": 3,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 15,
                    "description": "Drags enemy troops to its center while dealing damage over time, just like a magnet. A big, swirling, Tornado-y magnet.",
                    "id": 28000012
                },
                {
                    "key": "clone",
                    "name": "Clone",
                    "sc_key": "Clone",
                    "elixir": 3,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 15,
                    "description": "Duplicates all friendly troops in the target area. Cloned troops are fragile, but pack the same punch as the original! Doesn't affect buildings.",
                    "id": 28000013
                },
                {
                    "key": "earthquake",
                    "name": "Earthquake",
                    "sc_key": "Earthquake",
                    "elixir": 3,
                    "type": "Spell",
                    "rarity": "Rare",
                    "arena": 12,
                    "description": "Deals Damage per second to Troops and Crown Towers. Deals huge Building Damage! Does not affect flying units (it is an EARTHquake, after all).",
                    "id": 28000014
                },
                {
                    "key": "barbarian-barrel",
                    "name": "Barbarian Barrel",
                    "sc_key": "BarbLog",
                    "elixir": 2,
                    "type": "Spell",
                    "rarity": "Epic",
                    "arena": 3,
                    "description": "It rolls over and damages anything in its path, then breaks open and out pops a Barbarian! How did he get inside?!",
                    "id": 28000015
                },
                {
                    "key": "heal-spirit",
                    "name": "Heal Spirit",
                    "sc_key": "Heal",
                    "elixir": 1,
                    "type": "Troop",
                    "rarity": "Rare",
                    "arena": 13,
                    "description": "A mischievous Spirit that leaps at enemies, dealing Damage and leaving behind a powerful healing effect that restores Hitpoints to friendly Troops!\n\nR.I.P. Heal\n2017 - 2020\nAlas, we hardly used ye.",
                    "id": 28000016
                },
                {
                    "key": "giant-snowball",
                    "name": "Giant Snowball",
                    "sc_key": "Snowball",
                    "elixir": 2,
                    "type": "Spell",
                    "rarity": "Common",
                    "arena": 8,
                    "description": "It's HUGE! Once it began rolling down Frozen Peak, there was no stopping it. Enemies hit are knocked back and slowed down. Reduced damage to Crown Towers.",
                    "id": 28000017
                },
                {
                    "key": "royal-delivery",
                    "name": "Royal Delivery",
                    "sc_key": "RoyalDelivery",
                    "elixir": 3,
                    "type": "Spell",
                    "rarity": "Common",
                    "arena": 15,
                    "description": "No need to sign for this package!\n\nDropped from the sky, it deals Area Damage to enemy Troops before delivering a Royal Recruit.\n\nThe empty box is also handy for espionage.",
                    "id": 28000018
                }
            ]

            let url = 'https://link.clashroyale.com/deck/en?deck=';

            for (const c of cards) {
                url += `${cardData.find(ca => ca.key === c).id};`;
            }

            return url.substring(0, url.length - 1);
        }

        let desc = `\n**__Best War Deck Set__**\nRating: **${(average(uniqueDeckSets[0].map(d => d.rating))).toFixed(1)}**\n`;

        for (let i = 0; i < uniqueDeckSets[0].length; i++) {
            desc += `[**${i + 1}**](${getDeckUrl(uniqueDeckSets[0][i].cards)}): `;
            for (const c of uniqueDeckSets[0][i].cards) {
                const cardEmoji = bot.emojis.cache.find(e => e.name === c.replace(/-/g, "_") && e.guild.name.indexOf('Emoji') > -1);
                desc += `<:${cardEmoji.name}:${cardEmoji.id}>`;
            }

            desc += '\n';
        }

        if (uniqueDeckSets.length >= 2) {
            desc += `\n**__Alternative__**\nRating: **${(average(uniqueDeckSets[1].map(d => d.rating))).toFixed(1)}**\n`;

            for (let i = 0; i < uniqueDeckSets[1].length; i++) {
                desc += `[**${i + 1}**](${getDeckUrl(uniqueDeckSets[1][i].cards)}): `;
                for (const c of uniqueDeckSets[1][i].cards) {
                    const cardEmoji = bot.emojis.cache.find(e => e.name === c.replace(/-/g, "_") && e.guild.name.indexOf('Emoji') > -1);
                    desc += `<:${cardEmoji.name}:${cardEmoji.id}>`;
                }

                desc += '\n';
            }
        }

        message.channel.send({
            embed: {
                description: desc,
                color: color,
                author: {
                    name: `${player.name} | ${player.tag}`
                }
            }
        });
    }
}