//Melee, ranged, and magic methods are turbo redundant but I think it increases readability that way
import {PrayerBook} from '../PrayerBook.js';


export class Accuracy{
	constructor(stateObj, calcs){
		this.vertex = calcs.vertex;
		this.flags = calcs.flags;
		this.state = stateObj

		var prayerBook = new PrayerBook()
		this.prayerModifiers = prayerBook.getModifiers(this.state.player.prayers)

	}

	generalFormula(a, b){
		return a * (b + 64)
	}

	compareRolls(atk, def){
		if(atk > def){
			return 1 - (def + 2) / (2 * (atk + 1))
		}
		else{
			return atk / (2 * (def + 1))
		}
	}

	melee(){
		const player = this.state.player
		const monster = this.state.monster
		const attackStyle = player.equipment.weapon.category.styles[player.attackStyle].attackStyle
		const attackType = player.equipment.weapon.category.styles[player.attackStyle].type

		var effectiveAtt = player.boostedStats.attack;
		effectiveAtt = Math.floor(effectiveAtt * this.prayerModifiers.attack)
		
		if(attackStyle == "Accurate"){
			effectiveAtt += 3
		}
		else if(attackStyle =="Controlled"){
			effectiveAtt += 1
		}

		effectiveAtt += 8

		if(this.flags.includes("Void melee")){
			effectiveAtt = Math.floor(effectiveAtt * 11 / 10)
		}

		var npcBonus = 0
		var playerBonus = 0
		switch(attackType){
			case "Stab":
				playerBonus = player.bonuses[0]
				npcBonus = monster.stats.dstab
				break;
			case "Slash":
				playerBonus = player.bonuses[1]
				npcBonus = monster.stats.dslash
				break;
			case "Crush":
				playerBonus = player.bonuses[2]
				npcBonus = monster.stats.dcrush
				break;
		}

		const npcRoll = this.generalFormula(monster.stats.def + 9, npcBonus)
		var playerRoll = this.generalFormula(effectiveAtt, playerBonus)

		//apply black mask/salve bonus
		if(this.flags.includes("Salve amulet (e)") || this.flags.includes("Salve amulet(ei)")){
			playerRoll = Math.floor(playerRoll * 6 / 5)
		}
		else if(this.flags.includes("Salve amulet") || this.flags.includes("Salve amulet(i)")){
			playerRoll = Math.floor(playerRoll * 7 / 6)
		}
		//Redundant, but separate from salve amulet for readability. The minimizer fixes this in production
		else if(this.flags.includes("Black mask") || this.flags.includes("Black mask (i)")){
			playerRoll = Math.floor(playerRoll * 7 / 6) 
		}

		if(this.flags.includes("Arclight")){
			playerRoll = Math.floor(playerRoll * 17 / 10)
		}

		return this.compareRolls(playerRoll, npcRoll)
	}

	ranged(){
		const player = this.state.player
		const monster = this.state.monster
		const attackStyle = player.equipment.weapon.category.styles[player.attackStyle].attackStyle
		const attackType = player.equipment.weapon.category.styles[player.attackStyle].type

		var effectiveRanged = player.boostedStats.ranged;
		effectiveRanged = Math.floor(effectiveRanged * this.prayerModifiers.rangedAcc)
		
		if(attackStyle == "Accurate"){
			effectiveRanged += 3
		}

		effectiveRanged += 8

		if(this.flags.includes("Elite void range") || this.flags.includes("Void range")){
			effectiveRanged = Math.floor(effectiveRanged * 11 / 10)
		}

		const npcBonus = monster.stats.drange
		const playerBonus = player.bonuses[4] //ranged attack

		const npcRoll = this.generalFormula(monster.stats.def + 9, npcBonus)
		var playerRoll = this.generalFormula(effectiveRanged, playerBonus)

		//apply black mask/salve bonus
		if(this.flags.includes("Salve amulet(ei)")){
			playerRoll = Math.floor(playerRoll * 6 / 5)
		}
		else if(this.flags.includes("Salve amulet(i)") || this.flags.includes("Black mask (i)")){
			playerRoll = Math.floor(playerRoll * 23 / 20)
		}

		if(this.flags.includes("Dragon hunter crossbow")){
			playerRoll = Math.floor(playerRoll * 13 / 10)
		}

		else if(this.flags.includes("Twisted bow")){
			const magic = Math.max(monster.stats.mage, monster.stats.mbns)
			const tbowMod = 140 + Math.floor((3*magic-10)/100) - Math.floor(Math.pow(3*magic/10 - 100, 2) / 100)
			playerRoll = Math.floor(playerRoll * Math.min(tbowMod, 140) / 100)
		}

		return this.compareRolls(playerRoll, npcRoll)
	}

	magic(){
		const player = this.state.player
		const monster = this.state.monster
		const attackStyle = player.equipment.weapon.category.styles[player.attackStyle].attackStyle
		const attackType = player.equipment.weapon.category.styles[player.attackStyle].type

		var effectiveMagic = player.boostedStats.magic;
		effectiveMagic = Math.floor(effectiveMagic * this.prayerModifiers.magic)
		
		if(attackType == "Magic" && attackStyle == "Accurate"){
			effectiveMagic += 3
		}
		else if(attackType == "Magic" && attackStyle == "Long Ranged"){
			effectiveMagic += 1
		}
		effectiveMagic += 8

		if(this.flags.includes("Elite void mage") || this.flags.includes("Void mage")){
			effectiveMagic = Math.floor(effectiveMagic * 29 / 20)
		}

		const npcBonus = monster.stats.dmagic
		const playerBonus = player.bonuses[5] //Magic attack

		const npcRoll = this.generalFormula(monster.stats.mage + 9, npcBonus)
		var playerRoll = this.generalFormula(effectiveMagic, playerBonus)

		//apply black mask/salve bonus
		if(this.flags.includes("Salve amulet(ei)")){
			playerRoll = Math.floor(playerRoll * 6 / 5)
		}
		else if(this.flags.includes("Salve amulet(i)") || this.flags.includes("Black mask (i)")){
			playerRoll = Math.floor(playerRoll * 23 / 20)
		}

		if(this.flags.includes("Smoke battlestaff")){
			playerRoll = Math.floor(playerRoll * 11 / 10)
		}

		return this.compareRolls(playerRoll, npcRoll)
	}

	output(){
		if(this.vertex == "Melee"){
			return this.melee()
		}
		else if(this.vertex == "Ranged"){
			console.log('ranged')
			return this.ranged()
		}
		else if(this.vertex == "Magic"){
			return this.magic()
		}
		else {return 0}
	}
}