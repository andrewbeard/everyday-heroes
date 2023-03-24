import FormulaField from "../../fields/formula-field.mjs";
import MappingField from "../../fields/mapping-field.mjs";
import { simplifyBonus } from "../../../utils.mjs";
import Proficiency from "../../../documents/proficiency.mjs";

/**
 * Data model template for actors that have ability scores.
 * @mixin
 *
 * @property {Object<string, AbilityData>} abilities - Ability scores.
 * @property {object} bonuses
 * @property {object} bonuses.ability
 * @property {string} bonuses.ability.check - Global ability check bonus.
 * @property {string} bonuses.ability.dc - Global ability DC bonus.
 * @property {string} bonuses.ability.save - Global ability save bonus.
 */
export default class AbilitiesTemplate extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			abilities: new MappingField(new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.NumberField({
					nullable: false, initial: 10, min: 0, integer: true, label: "EH.Ability.Score[one]"
				}),
				max: new foundry.data.fields.NumberField({
					integer: true, min: 0, initial: 20, label: "EH.Ability.Max.Label"
				}),
				saveProficiency: new foundry.data.fields.SchemaField({
					multiplier: new foundry.data.fields.NumberField({
						nullable: false, initial: 0, min: 0, max: 1, integer: true, label: "EH.Proficiency.Multiplier"
					})
				}, {label: "EH.Proficiency.Label[one]"}),
				bonuses: new foundry.data.fields.SchemaField({
					check: new FormulaField({label: "EH.Ability.Bonus.Check"}),
					dc: new FormulaField({label: "EH.Ability.Bonus.DC"}),
					save: new FormulaField({label: "EH.Ability.Bonus.Save"})
				})
			}), {
				initialKeys: CONFIG.EverydayHeroes.abilities, prepareKeys: true, label: "EH.Ability.Label[other]"
			}),
			bonuses: new foundry.data.fields.SchemaField({
				ability: new foundry.data.fields.SchemaField({
					check: new FormulaField({label: "EH.Ability.Bonus.Check"}),
					dc: new FormulaField({label: "EH.Ability.Bonus.DC"}),
					save: new FormulaField({label: "EH.Ability.Bonus.Save"})
				})
			}, {label: "EH.Bonuses.Label"})
		};
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Data Preparation                         */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedAbilities() {
		const rollData = this.parent.getRollData();
		const prof = this.attributes?.prof ?? 0;
		const globalDCBonus = simplifyBonus(this.bonuses.ability.dc, rollData);
		const globalCheckBonus = simplifyBonus(this.bonuses.ability.check, rollData);
		const globalSaveBonus = simplifyBonus(this.bonuses.ability.save, rollData);
		for ( const ability of Object.values(this.abilities) ) {
			ability.mod = Math.floor((ability.value - 10) / 2);

			// TODO: Add jack of all trades
			ability.checkProficiency = new Proficiency(prof);
			ability.saveProficiency = new Proficiency(prof, ability.saveProficiency.multiplier);

			ability.checkBonus = globalCheckBonus + simplifyBonus(ability.bonuses.check, rollData);
			ability.check = ability.mod + ability.checkProficiency.flat + ability.checkBonus;
			ability.saveBonus = globalSaveBonus + simplifyBonus(ability.bonuses.save, rollData);
			ability.save = ability.mod + ability.saveProficiency.flat + ability.saveBonus;
			ability.dcBonus = globalDCBonus + simplifyBonus(ability.bonuses.dc, rollData);
			ability.dc = 8 + ability.mod + prof + ability.dcBonus;
		}
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Helpers                                  */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Choose the ability with the highest modifier from the provided set.
	 * @param {Set<string>} [choices] - Abilities to consider in the comparison. If no set if provided, then the best
	 *                                  of all of the actor's abilities will be chosen.
	 * @returns {string|undefined}
	 */
	bestAbility(choices) {
		choices ??= new Set(Object.values(CONFIG.EverydayHeroes.abilities));

		const highestAbility = { key: undefined, mod: -Infinity };
		for ( const key of choices ) {
			const ability = this.abilities[key];
			if ( !ability || ability.mod <= highestAbility.mod ) continue;
			highestAbility.key = key;
			highestAbility.mod = ability.mod;
		}

		return highestAbility.key;
	}
}
