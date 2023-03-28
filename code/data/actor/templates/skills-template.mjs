import FormulaField from "../../fields/formula-field.mjs";
import MappingField from "../../fields/mapping-field.mjs";
import { simplifyBonus } from "../../../utils.mjs";
import Proficiency from "../../../documents/proficiency.mjs";

/**
 * Data for a skill.
 *
 * @typedef {object} SkillData
 * @property {Set<string>} abilities - Abilities that can be used when rolling this skill, the highest will be default.
 * @property {Proficiency} proficiency - Proficiency in this skill.
 * @property {object} bonuses
 * @property {string} bonuses.check - Bonus to checks with this skill.
 * @property {string} bonuses.passive - Bonus to this skill's passive score.
 * @property {string} minimum - Minimum Challenge Die value for this skill.
 */

/**
 * Data model template for actors that have skills.
 * @mixin
 *
 * @property {object} bonuses
 * @property {object} bonuses.skill
 * @property {string} bonuses.skill.check - Global skill check bonus.
 * @property {string} bonuses.skill.passive - Global passive skill bonus.
 * @property {object} overrides
 * @property {object} overrides.skill
 * @property {string} overrides.skill.minimum - Global minimum Challenge Die value for skills.
 * @property {string} overrides.skill.proficiency.multiplier - Minimum proficiency multiplier for skills.
 * @property {string} overrides.skill.proficiency.rounding - Default proficiency rounding for skills.
 * @property {Object<string, SkillData>} skills - Actor's skills.
 */
export default class SkillsTemplate extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			bonuses: new foundry.data.fields.SchemaField({
				skill: new foundry.data.fields.SchemaField({
					check: new FormulaField({label: "EH.Skill.Bonus.Check"}),
					passive: new FormulaField({deterministic: true, label: "EH.Skill.Bonus.Passive"})
				})
			}, {label: "EH.Bonuses.Label"}),
			overrides: new foundry.data.fields.SchemaField({
				skill: new foundry.data.fields.SchemaField({
					minimum: new FormulaField({determinstic: true, label: "EH.Skill.Orverride.Min"}),
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({
							nullable: true, initial: null, min: 0.5, max: 2, step: 0.5, label: "EH.Proficiency.Multiplier"
						}),
						rounding: new foundry.data.fields.StringField({
							nullable: true, initial: null, choices: ["down", "up"], label: "EH.Proficiency.Rounding"
						})
					})
				})
			}, {label: "EH.Override.Label"}),
			skills: new MappingField(new foundry.data.fields.SchemaField({
				ability: new foundry.data.fields.StringField({label: "EH.Ability.Label[one]"}),
				proficiency: new foundry.data.fields.SchemaField({
					multiplier: new foundry.data.fields.NumberField({
						nullable: false, initial: 0, min: 0, max: 2, step: 0.5, label: "EH.Proficiency.Multiplier"
					}),
					rounding: new foundry.data.fields.StringField({
						initial: "down", choices: ["down", "up"], label: "EH.Proficiency.Rounding"
					})
				}, {label: "EH.Proficiency.Label[one]"}),
				bonuses: new foundry.data.fields.SchemaField({
					check: new FormulaField({label: "EH.Skill.Bonus.Check"}),
					passive: new FormulaField({deterministic: true, label: "EH.Skill.Bonus.Passive"})
				}),
				minimum: new FormulaField({determinstic: true, label: "EH.Skill.Orverride.Minimum"})
			}), {
				initialKeys: CONFIG.EverydayHeroes.skills, initialValue: this._initialSkillValue,
				prepareKeys: true, label: "EH.Skill.Label[other]"
			})
		};
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Populate the proper initial abilities for the skills.
	 * @param {string} key - Key for which the initial data will be created.
	 * @param {object} initial - The initial skill object.
	 * @returns {object} - Initial skills object with the ability defined.
	 * @internal
	 */
	static _initialSkillValue(key, initial) {
		initial.ability = CONFIG.EverydayHeroes.skills[key]?.ability ?? initial.ability;
		return initial;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Data Preparation                         */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedSkills() {
		const rollData = this.parent.getRollData();
		const prof = this.attributes?.prof ?? 0;
		const globalCheckBonus = simplifyBonus(this.bonuses?.ability.check, rollData)
			+ simplifyBonus(this.bonuses?.skill.check, rollData);
		const globalPassiveBonus = simplifyBonus(this.bonuses?.skill.passive, rollData);
		for ( const skill of Object.values(this.skills) ) {
			skill.proficiency = new Proficiency(prof, skill.proficiency.multiplier, skill.proficiency.rounding);
			// TODO: Add jack of all trades

			const ability = this.abilities?.[skill.ability];
			skill.bonus = globalCheckBonus + simplifyBonus(ability?.bonuses.check, rollData)
				+ simplifyBonus(skill.bonuses.check, rollData);
			skill.mod = (ability?.mod ?? 0) + skill.bonus + skill.proficiency.flat;
			skill.passive = 10 + skill.mod + globalPassiveBonus + simplifyBonus(skill.bonuses.passive, rollData);
		}
	}
}
