const allCards = require("../static/cardInfo")
const badges = require("../static/badges.js")
const { red } = require("../static/colors")
const allEmojis = require("../../allEmojis.json")

const getClanBadge = (badgeId, trophyCount, returnEmojiPath = true) => {
	if (badgeId === -1 || badgeId === null) return "no_clan" //no clan

	const badgeName = badges.find((b) => b.id === badgeId).name
	let league

	if (returnEmojiPath) {
		if (trophyCount >= 5000) league = "legendary3"
		else if (trophyCount >= 4000) league = "legendary2"
		else if (trophyCount >= 3000) league = "legendary1"
		else if (trophyCount >= 2500) league = "gold3"
		else if (trophyCount >= 2000) league = "gold2"
		else if (trophyCount >= 1500) league = "gold1"
		else if (trophyCount >= 1200) league = "silver3"
		else if (trophyCount >= 900) league = "silver2"
		else if (trophyCount >= 600) league = "silver1"
		else if (trophyCount >= 400) league = "bronze3"
		else if (trophyCount >= 200) league = "bronze2"
		else league = "bronze1"
	} else {
		//file path
		if (trophyCount >= 5000) league = "legendary-3"
		else if (trophyCount >= 4000) league = "legendary-2"
		else if (trophyCount >= 3000) league = "legendary-1"
		else if (trophyCount >= 2500) league = "gold-3"
		else if (trophyCount >= 2000) league = "gold-2"
		else if (trophyCount >= 1500) league = "gold-1"
		else if (trophyCount >= 1200) league = "silver-3"
		else if (trophyCount >= 900) league = "silver-2"
		else if (trophyCount >= 600) league = "silver-1"
		else if (trophyCount >= 400) league = "bronze-3"
		else if (trophyCount >= 200) league = "bronze-2"
		else league = "bronze-1"
	}

	return `${badgeName}_${league}`
}
const getEmoji = (emojiName) => {
	return allEmojis[emojiName]
}
const getArenaEmoji = (pb) => {
	if (pb >= 8000) return "arena24"
	else if (pb >= 7600) return "arena23"
	else if (pb >= 7300) return "arena22"
	else if (pb >= 7000) return "arena21"
	else if (pb >= 6600) return "arena20"
	else if (pb >= 6300) return "arena19"
	else if (pb >= 6000) return "arena18"
	else if (pb >= 5600) return "arena17"
	else if (pb >= 5300) return "arena16"
	else if (pb >= 5000) return "arena15"
	else if (pb >= 4600) return "arena14"
	else if (pb >= 4200) return "arena13"
	else if (pb >= 3800) return "arena12"
	else if (pb >= 3400) return "arena11"
	else if (pb >= 3000) return "arena10"
	else if (pb >= 2600) return "arena9"
	else if (pb >= 2300) return "arena8"
	else if (pb >= 2000) return "arena7"
	else if (pb >= 1600) return "arena6"
	else if (pb >= 1300) return "arena5"
	else if (pb >= 1000) return "arena4"
	else if (pb >= 600) return "arena3"
	else if (pb >= 300) return "arena2"
	else return "arena1"
}
const getLeague = (pb) => {
	if (pb >= 8000) return "league-10"
	else if (pb >= 7600) return "league-9"
	else if (pb >= 7300) return "league-8"
	else if (pb >= 7000) return "league-7"
	else if (pb >= 6600) return "league-6"
	else if (pb >= 6300) return "league-5"
	else if (pb >= 6000) return "league-4"
	else if (pb >= 5600) return "league-3"
	else if (pb >= 5300) return "league-2"
	else if (pb >= 5000) return "league-1"
	else return null
}
const getDeckUrl = (cards) => {
	let url = "https://link.clashroyale.com/deck/en?deck="

	for (let i = 0; i < cards.length; i++) {
		for (let x = 0; x < allCards.length; x++) {
			if (allCards[x].name === cards[i]) url += `${allCards[x].id};`
		}
	}

	return url.substring(0, url.length - 1)
}
//convert hex to transparent rgba value
const hexToRgbA = (hex) => {
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		let c = hex.substring(1).split("")

		if (c.length == 3) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]]
		}

		c = "0x" + c.join("")

		return "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") + ",0.25)"
	}
	return "rgba(255, 255, 255, 0.25)" //transparent white
}
const errorMsg = (i, message) => {
	i.editReply({
		embeds: [
			{
				color: red,
				description: message,
			},
		],
	})
}
const hasDuplicateCard = (existingCards, newCards) => {
	for (let i = 0; i < newCards.length; i++) {
		if (existingCards.has(newCards[i])) return true
	}

	return false
}
const hasLockedCard = (cards, playerCardsSet) => {
	for (let i = 0; i < cards.length; i++) {
		if (!playerCardsSet.has(cards[i])) return true
	}
	return false
}
const deckSetAvgLvl = (deckSetCards, playerCards) => {
	let sum = 0

	for (let i = 0; i < deckSetCards.length; i++) {
		const card = playerCards.find((c) => c.name === deckSetCards[i])

		sum += card.level
	}

	return sum / deckSetCards.length
}
const deckSetAvgDeckRating = (deckSetArr) => {
	if (deckSetArr.length === 0) return 0

	let sum = 0
	for (let i = 0; i < deckSetArr.length; i++) {
		sum += deckSetArr[i].rating
	}

	return sum / deckSetArr.length
}
const deckSetScore = (deckSetArr, playerCards) => {
	const avgCardLvl = deckSetAvgLvl([...deckSetArr[0].cards, ...deckSetArr[1].cards, ...deckSetArr[2].cards, ...deckSetArr[3].cards], playerCards)
	const avgRating = deckSetAvgDeckRating(deckSetArr)
	const cardLvlWeight = 0.975
	const ratingWeight = 0.025

	return avgCardLvl * cardLvlWeight + avgRating * ratingWeight
}
const allIncludedCardsInSet = (deckSetArr, includedCardsArr) => {
	for (let i = 0; i < includedCardsArr.length; i++) {
		const deckSetCards = new Set([...deckSetArr[0].cards, ...deckSetArr[1].cards, ...deckSetArr[2].cards, ...deckSetArr[3].cards])

		if (!deckSetCards.has(includedCardsArr[i])) return false
	}
	return true
}

module.exports = {
	getClanBadge,
	getEmoji,
	getArenaEmoji,
	getLeague,
	getDeckUrl,
	hexToRgbA,
	errorMsg,
	hasDuplicateCard,
	hasLockedCard,
	deckSetAvgLvl,
	deckSetAvgDeckRating,
	deckSetScore,
	allIncludedCardsInSet,
}
