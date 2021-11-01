const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
const { MongoClient } = require('mongodb');
const mdbClient = new MongoClient(process.env.uri, { useUnifiedTopology: true, useNewUrlParser: true });

if (mdbClient.isConnected()) {
    console.log('already connected');

    try {
        addDecks();
    }
    catch (e) {
        console.error(e);
    }
}
else {
    mdbClient
        .connect()
        .then(() => {
            addDecks();
        })
        .catch((e) => {
            console.error(e);
        });
}

async function addDecks() {
    const db = await mdbClient.db('General');
    const decks = db.collection('Decks');

    puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }).then(async browser => {
        console.log('Updating decks...');
        const page = await browser.newPage();

        await page.setDefaultNavigationTimeout(0);

        const dir = await fs.promises.opendir('./cards');

        let totalDecksAdded = 0;

        for await (const dirent of dir) { //loop through all cards
            const c = dirent.name.replace('.png', '');
            const url = `https://royaleapi.com/decks/popular?time=7d&inc=${c}&players=PvP&type=NormalBattle&size=20&sort=win&min_trophies=0&max_trophies=10000&min_elixir=1&max_elixir=9&mode=digest`;

            await page.goto(url);

            const allDecks = await page.$$('div.deck_segment');
            const ratings = await page.$$('table.stats td:nth-child(1)');

            if (allDecks.length === ratings.length) {
                let decksAdded = 0;

                for (let i = 0; i < allDecks.length; i++) {
                    const today = new Date();

                    const deck = {
                        cards: (await page.evaluate(el => el.getAttribute("data-name"), allDecks[i])).split(',').sort(), //alphabetize
                        rating: parseInt(await page.evaluate(el => el.textContent, ratings[i])),
                        dateAdded: `${today.getUTCMonth() + 1}/${today.getUTCDate()}/${today.getUTCFullYear()}`
                    }

                    const deckExists = await decks.findOne({ cards: deck.cards });

                    if (deckExists) {
                        decks.updateOne({ cards: deck.cards }, { $set: { dateAdded: deck.dateAdded, rating: deck.rating } });
                    }
                    else {
                        await decks.insertOne(deck);
                        decksAdded++;
                    }
                }

                totalDecksAdded += decksAdded;
            }

            if (c !== 'zappies') {
                const timeout = ((Math.random() * 8) + 3) * 1000;
                await page.waitForTimeout(timeout);
            }
        }

        console.log(`Finished! (${totalDecksAdded} decks added)`);

        return await browser.close();
    })
}