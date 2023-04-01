import { numberFormat } from "../../utils.mjs";
import WeaponData from "./weapon-data.mjs";

/**
 * Data definition for NPC Weapon items.
 *
 * @property {object} description
 * @property {string} description.npc - Description that appears for weapon on NPC details tab.
 */
export default class NPCWeaponData extends WeaponData {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "npcWeapon",
			localization: "EH.Item.Type.NPCWeapon"
		});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new foundry.data.fields.SchemaField({
				npc: new foundry.data.fields.HTMLField({nullable: true, label: ""})
			})
		});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Properties                               */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get types() {
		return CONFIG.EverydayHeroes.weaponTypes;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Helpers                                  */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	async npcDescription() {
		let description = "<p><em>";

		// Type
		const type = CONFIG.EverydayHeroes.weaponTypes[this.type.value];
		if ( type ) description += game.i18n.format("EH.Weapon.Action.AttackSpecific", {type: type.label});
		else description += game.i18n.localize("EH.Weapon.Action.AttackGeneric");
		description += ":</em> ";

		// To Hit
		description += `<a data-action="roll-item" data-type="attack">${
			game.i18n.format("EH.Weapon.ToHit", {mod: numberFormat(this.attackMod, {sign: true})}).toLowerCase()}</a>, `;

		// Penetration Value
		description += `${game.i18n.localize("EH.Equipment.Trait.PenetrationValue.Abbreviation")} ${
			numberFormat(this.penetrationValue)}, `;

		// Range
		if ( ((this.type.value === "ranged") || this.properties.has("thrown")) && this.range.short ) {
			description += `${game.i18n.localize("EH.Equipment.Trait.Range.Label").toLowerCase()} ${
				numberFormat(this.range.short)}`;
			if ( this.range.long > this.range.short ) description += `/${numberFormat(this.range.long)}`;
			description += ` ${CONFIG.EverydayHeroes.lengthUnits[this.range.units]?.abbreviation}., `;
			// TODO: Use numberFormat with proper unit formatting
		}

		// Reach
		if ( this.type.value === "melee" ) {
			description += `${game.i18n.localize("EH.Equipment.Trait.Range.Reach").toLowerCase()} ${
				numberFormat(this.range.reach ?? 5)} `;
			description += `${CONFIG.EverydayHeroes.lengthUnits[this.range.units]?.abbreviation}., `;
			// TODO: Use numberFormat with proper unit formatting
		}

		// Targets

		// Damage types
		const modes = this.modes;
		delete modes.offhand;
		delete modes.suppressiveFire;
		const damages = [];
		for ( const [mode, config] of Object.entries(modes) ) {
			const clone = new this.constructor(this.toObject());
			clone._modeOverride = mode;
			clone.prepareBaseData();
			clone.prepareDerivedData();

			const type = game.i18n.format("EH.Damage.Specific", {
				type: CONFIG.EverydayHeroes.damageTypes[clone.damage.type]?.label
			});
			let string = `<a data-action="roll-item" data-type="damage" data-mode="${mode}">`;
			string += clone.damage.average;
			if ( clone.damage.denomination ) string += ` (${clone.damageFormula})`;
			string += ` ${type.toLowerCase()}</a>`;
			if ( config.npcHint && (Object.values(modes).length > 1) ) string += ` ${config.npcHint}`;
			damages.push(string);
		}
		const listFormatter = new Intl.ListFormat(game.i18n.lang, {type: "disjunction", style: "short"});
		description += `<em>Hit:</em> ${listFormatter.format(damages)}.</p> `;

		if ( this.description.chat ) {
			description += await TextEditor.enrichHTML(this.description.chat ?? "", {
				secrets: this.parent.isOwner, rollData: this.parent.getRollData(), async: true, relativeTo: this.parent
			});
		}

		return description;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	async npcLabel() {
		let label = `<a data-action="roll-item" data-type="activate">${this.parent.name}</a>`;
		if ( this.rounds.capacity ) {
			label += ' <span>(<a data-action="item" data-type="reload">';
			label += `${numberFormat(this.rounds.available)}/${numberFormat(this.rounds.capacity)} ${
				game.i18n.format("EH.Ammunition.Rounds.Label[other]")}`;
			if ( this.reload ) label += `; ${CONFIG.EverydayHeroes.actionTypesReload[this.reload].toLowerCase()}`;
			label += "</a>)</span>";
		}
		return label;
	}
}
