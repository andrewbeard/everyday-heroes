import { numberFormat, simplifyBonus } from "../../utils.mjs";
import SystemDataModel from "../abstract/system-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import AttackTemplate from "./templates/attack-template.mjs";
import DamageTemplate from "./templates/damage-template.mjs";
import DescribedTemplate from "./templates/described-template.mjs";
import EquipmentTemplate from "./templates/equipment-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import TypedTemplate from "./templates/typed-template.mjs";

/**
 * Data definition for Weapon items.
 * @mixes {@link AttackTemplate}
 * @mixes {@link DamageTemplate}
 * @mixes {@link DescribedTemplate}
 * @mixes {@link EquipmentTemplate}
 * @mixes {@link PhysicalTemplate}
 * @mixes {@link TypedTemplate}
 *
 * @property {object} type
 * @property {string} type.category - Equipment category of this item.
 * @property {Set<string>} properties - Weapon's properties.
 * @property {number} penetrationValue - How armor piercing is this weapon?
 * @property {boolean} jammed - Is this weapon currently jammed?
 * @property {object} range
 * @property {number} range.short - Normal range for ranged or thrown weapons.
 * @property {number} range.long - Long range for ranged or thrown weapons.
 * @property {number} range.reach - Reach for melee weapons with the "Reach" property.
 * @property {string} range.units - Units represented by the range values.
 * @property {string} reload - Action type required to reload this weapon.
 * @property {object} rounds
 * @property {number} rounds.spend - Number of rounds that have been spend from the current magazine.
 * @property {number} rounds.capacity - Capacity of this weapon's magazine.
 * @property {number} rounds.burst - Number of rounds expended while taking burst shot.
 * @property {string} rounds.type - Type of ammunition that can be loaded into this weapon.
 * @property {object} bonuses
 * @property {string} bonuses.attack - Bonus to the weapon's attack rolls.
 * @property {string} bonuses.damage - Bonus to the weapon's damage rolls.
 * @property {object} bonuses.critical
 * @property {string} bonuses.critical.damage - Extra critical damage.
 * @property {number} bonuses.critical.dice - Extra critical damage dice.
 * @property {object} overrides
 * @property {object} overrides.critical
 * @property {number} overrides.critical.threshold - Number needed to roll to score a critical hit with this weapon.
 */
export default class WeaponData extends SystemDataModel.mixin(
	AttackTemplate, DamageTemplate, DescribedTemplate, EquipmentTemplate, PhysicalTemplate, TypedTemplate
) {

	static get metadata() {
		return {
			type: "weapon",
			category: "physical",
			localization: "EH.Item.Type.Weapon",
			icon: "fa-solid fa-gun",
			image: "systems/everyday-heroes/artwork/svg/items/weapon.svg"
		};
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			_modeOverride: new foundry.data.fields.StringField({required: false, initial: undefined}),
			type: new foundry.data.fields.SchemaField({
				category: new foundry.data.fields.StringField({label: "EH.Equipment.Category.Label[one]"})
			}, {label: "EH.Item.Type.Label"}),
			properties: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
				label: "EH.Weapon.Property.Label"
			}),
			penetrationValue: new foundry.data.fields.NumberField({
				min: 0, integer: true,
				label: "EH.Equipment.Trait.PenetrationValue.Label", hint: "EH.Equipment.Trait.PenetrationValue.Hint"
			}),
			jammed: new foundry.data.fields.BooleanField({label: "Weapon.Jammed.Label"}),
			range: new foundry.data.fields.SchemaField({
				short: new foundry.data.fields.NumberField({min: 0, step: 0.1, label: "EH.Equipment.Trait.Range.Short"}),
				long: new foundry.data.fields.NumberField({min: 0, step: 0.1, label: "EH.Equipment.Trait.Range.Long"}),
				reach: new foundry.data.fields.NumberField({min: 0, step: 0.1, label: "EH.Equipment.Trait.Range.Reach"}),
				units: new foundry.data.fields.StringField({label: "EH.Measurement.Units"})
				// TODO: Set default based on default units setting
			}, {label: "EH.Equipment.Trait.Range.Label", hint: "EH.Equipment.Trait.Range.Hint"}),
			reload: new foundry.data.fields.StringField({
				label: "EH.Equipment.Trait.Reload.Label", hint: "EH.Equipment.Trait.Reload.Hint"
			}),
			rounds: new foundry.data.fields.SchemaField({
				spent: new foundry.data.fields.NumberField({
					initial: 0, min: 0, integer: true, label: "EH.Equipment.Trait.Rounds.Spent"
				}),
				capacity: new foundry.data.fields.NumberField({
					min: 0, integer: true, label: "EH.Equipment.Trait.Rounds.Capacity"
				}),
				burst: new foundry.data.fields.NumberField({
					min: 0, integer: true,
					label: "EH.Equipment.Trait.Rounds.Burst.Label", hint: "EH.Equipment.Trait.Rounds.Burst.Hint"
				}),
				type: new foundry.data.fields.StringField({label: "EH.Ammunition.Type.Label"})
			}, {label: "EH.Equipment.Trait.Rounds.Label", hint: "EH.Equipment.Trait.Rounds.Hint"}),
			target: new foundry.data.fields.SchemaField({}, {required: false, initial: undefined}),
			// TODO: Temporary fix for item conversion bug, find a better solution :)
			bonuses: new foundry.data.fields.SchemaField({
				attack: new FormulaField({label: "EH.Weapon.Bonus.Attack.Label"}),
				damage: new FormulaField({label: "EH.Weapon.Bonus.Damage.Label"}),
				critical: new foundry.data.fields.SchemaField({
					damage: new FormulaField({
						label: "EH.Weapon.Bonus.Critical.Damage.Label", hint: "EH.Weapon.Bonus.Critical.Damage.Hint"
					}),
					dice: new foundry.data.fields.NumberField({
						label: "EH.Weapon.Bonus.Critical.Dice.Label", hint: "EH.Weapon.Bonus.Critical.Dice.Hint"
					})
				})
			}, {label: "EH.Bonus.Label"}),
			overrides: new foundry.data.fields.SchemaField({
				critical: new foundry.data.fields.SchemaField({
					threshold: new foundry.data.fields.NumberField({label: "EH.Weapon.Overrides.Critical.Threshold.Label"})
				})
			}, {label: "EH.Override.Label"})
		});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Properties                               */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get actions() {
		if ( this.jammed ) {
			return [{
				label: game.i18n.localize("EH.Weapon.Action.ClearJam.Label"),
				icon: "systems/everyday-heroes/artwork/svg/action/clear-jam.svg",
				action: "item",
				data: { type: "clear-jam" }
			}];
		}
		const actions = super.actions;
		if ( this.mode === "suppressiveFire" ) {
			const fireConfig = CONFIG.EverydayHeroes.weaponSuppressiveFire[
				this.properties.has("fullAuto") ? "fullAuto" : "semiAuto"
			];
			actions.unshift({
				label: numberFormat(fireConfig.size, { unit: "foot" }),
				icon: "systems/everyday-heroes/artwork/svg/action/attack-suppressive-fire.svg",
				tooltip: game.i18n.localize("EH.Weapon.Action.SuppressiveFire.Label"),
				action: "item",
				data: { type: "suppressive-fire" }
			});
		}
		return actions;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get attackAbility() {
		if ( this.overrides.ability.attack ) return this.overrides.ability.attack;
		const melee = this.meleeAbility;
		const ranged = this.rangedAbility;

		// Finesse, higher of the abilities
		if ( this.properties.has("finesse") ) {
			const abilities = this.parent?.actor?.system.abilities;
			if ( !abilities ) return ["ranged", "thrown"].includes(this.type) ? ranged : melee;
			if ( abilities[ranged]?.mod > abilities[melee]?.mod ) return ranged;
			return melee;
		}

		return (this.type.value === "ranged") ? ranged : melee;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get attackIcon() {
		const config = CONFIG.EverydayHeroes.weaponModes[this.mode];
		if ( !config ) return "systems/everyday-heroes/artwork/svg/action/attack-melee-one-handed.svg";
		if ( !config.icons ) return config.icon;
		return config.icons[this.type.value];
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get attackMod() {
		const rollData = this.parent?.getRollData() ?? {};
		return super.attackMod
			+ simplifyBonus(this.bonuses.attack, rollData)
			+ simplifyBonus(this.ammunition?.system.bonuses.attack, rollData)
			+ simplifyBonus(this.parent?.actor?.system.bonuses?.attack?.all, rollData)
			+ simplifyBonus(this.parent?.actor?.system.bonuses?.attack?.[this.type.value], rollData);
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get attackTooltip() {
		if ( !this.mode ) return super.attackTooltip;
		const type = game.i18n.format("EH.Weapon.Action.AttackSpecific", {
			type: CONFIG.EverydayHeroes.weaponModes[this.mode].label
		});
		return game.i18n.format("EH.Action.Roll", { type });
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Is this a belt-fed weapon?
	 * @type {boolean}
	 */
	get beltFed() {
		return this.properties.has("belt");
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get canAttack() {
		return this.roundsToSpend <= this.rounds.available;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get canCritical() {
		return this.mode !== "suppressiveFire";
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get chatTags() {
		const pluralRule = new Intl.PluralRules(game.i18n.lang);
		const tags = [
			{ label: this.type.label, class: "type" },
			{
				label: `${game.i18n.localize(
					"EH.Equipment.Trait.PenetrationValue.Abbreviation")} ${numberFormat(this.penetrationValue)}`,
				class: "detail"
			},
			...this.propertiesTags,
			...this.proficiencyTags,
			...this.physicalTags
		];
		if ( this.range.short ) {
			let label;
			if ( this.range.long > this.range.short ) label = `${
				numberFormat(this.range.short)}/${
				numberFormat(this.range.long, {unit: this.range.units})}`;
			else label = numberFormat(this.range.short, {unit: this.range.units});
			tags.splice(1, 0, { label, class: "detail" });
		}
		if ( this.rounds.capacity ) {
			const label = game.i18n.localize(`EH.Ammunition.Rounds.Label[${pluralRule.select(this.rounds.capacity)}]`);
			tags.splice(2, 0, { label: `${numberFormat(this.rounds.capacity)} ${label}`, class: "detail" });
		}
		if ( this.reload ) {
			tags.splice(3, 0, { label: CONFIG.EverydayHeroes.actionTypesReload[this.reload], class: "detail" });
		}
		return tags;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get criticalThreshold() {
		// TODO: Replace actor threshold with a more customizable system
		const threshold = Math.min(
			this.parent?.actor?.system.overrides?.critical?.threshold.all ?? Infinity,
			this.parent?.actor?.system.overrides?.critical?.threshold[this.type.value] ?? Infinity,
			this.ammunition?.system.overrides?.critical?.threshold ?? Infinity,
			this.overrides.critical.threshold ?? Infinity
		);
		return threshold < Infinity ? threshold : 20;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get damageAbility() {
		if ( (this.overrides.ability.damage === "none") || !this.damage.denomination
			|| (this.mode === "offhand") ) return null;
		return this.overrides.ability.damage || this.attackAbility || null;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get damageChatActions() {
		return this.ammunition?.damageChatActions ?? super.damageChatActions;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get damageIcon() {
		const type = (this.mode === "thrown") || (this.type.value === "ranged") ? "ranged" : "melee";
		return `systems/everyday-heroes/artwork/svg/action/damage-${type}.svg`;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get hasAttack() {
		return this.mode !== "suppressiveFire";
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get hasDamageSave() {
		return this.ammunition?.system.hasDamageSave ?? false;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	get isEquippable() {
		return true;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Subset of `CONFIG.EverydayHeroes.weaponModes` that can be used by this weapon.
	 * @type {WeaponModeConfiguration[]}
	 */
	get modes() {
		const modes = {};
		for ( const [mode, config] of Object.entries(CONFIG.EverydayHeroes.weaponModes) ) {
			if ( !config.available(this) ) continue;
			modes[mode] = foundry.utils.deepClone(config);
			const icon = modes[mode].icons?.[this.type.value];
			if ( icon ) modes[mode].icon = icon;
		}
		return modes;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Icon display on the reload button.
	 * @type {string}
	 */
	get reloadIcon() {
		return "systems/everyday-heroes/artwork/svg/action/reload.svg";
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * How many rounds should be spent when this weapon is fired in the current mode.
	 * @type {number}
	 */
	get roundsToSpend() {
		if ( !this.usesRounds || !this.rounds.capacity ) return 0;
		if ( this.mode === "burst" ) return this.rounds.burst || 1;
		if ( this.mode === "suppressiveFire" ) {
			const fireConfig = CONFIG.EverydayHeroes.weaponSuppressiveFire[
				this.properties.has("fullAuto") ? "fullAuto"
					: this.properties.has("semiAuto") ? "semiAuto" : null
			];
			if ( fireConfig ) return fireConfig.rounds;
		}
		return 1;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Is range a relevant concept for this weapon?
	 * @type {boolean}
	 */
	get usesRange() {
		return (this.type.value === "ranged") || this.properties.has("thrown");
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Are rounds a relevant concept for this weapon?
	 * @type {boolean}
	 */
	get usesRounds() {
		return (this.type.value === "ranged");
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Migrations                               */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	static migrateOverride(source) {
		if ( foundry.utils.getType(source.overrides?.ability) !== "Object" ) {
			source.overrides ??= {};
			source.overrides.ability = { attack: source.overrides.ability };
		}
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Data Preparation                         */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareBaseAmmunition() {
		const ammunitionId = this.parent?.actor?.system.items?.[this.parent?.id]?.ammunition;
		const ammunition = this.parent?.actor?.items.get(ammunitionId);
		if ( !ammunition ) return;
		this.ammunition = ammunition;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareBaseMode() {
		const mode = this._modeOverride ?? this.parent?.actor?.system.items?.[this.parent?.id]?.mode;
		this.mode = this.modes[mode] ? mode : Object.keys(this.modes)[0];
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedDamage() {
		this.damage.prepareBaseData();
		this.supplementalDamage.forEach(s => s.prepareBaseData());
		if ( this.ammunition ) {
			if ( this.ammunition.system.damageMode === "regular" ) this.damage = this.ammunition.system.damage;
			else this.damage.modify(this.ammunition.system.damage);
		}
		if ( this.mode === "burst" ) this.damage.modify({ number: 1 });
		if ( this.properties.has("versatile") && (this.mode === "twoHanded") ) this.damage.modify({ denomination: 1 });
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedPenetrationValue() {
		this.penetrationValue = this._source.penetrationValue + (this.ammunition?.system.penetrationValue ?? 0);
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedProperties() {
		this.properties = new Set(CONFIG.EverydayHeroes.applicableProperties[this.parent?.type ?? "weapon"].filter(p => {
			if ( this.ammunition?.system.properties[p] === 1 ) return true;
			else if ( this.ammunition?.system.properties[p] === -1 ) return false;
			else if ( this.ammunition?.system.properties.has?.(p) ) return true;
			else return this._source.properties.includes(p);
		}));
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedRange() {
		if ( this.mode === "burst" ) this.range.long = null;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedRounds() {
		this.rounds.spent = Math.min(this.rounds.spent, this.rounds.capacity);
		this.rounds.available = this.rounds.capacity - this.rounds.spent;
		const digits = Math.max(Math.floor(Math.log10(this.rounds.capacity) + 1), 1);
		this.rounds.label = `${numberFormat(this.rounds.available, {digits})} / ${numberFormat(this.rounds.capacity)}`;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareDerivedTypeLabel() {
		this.type.label = game.i18n.format("EH.Item.Type.DetailedLabel", {
			category: CONFIG.EverydayHeroes.equipmentCategories[this.type.category]?.label ?? "",
			type: game.i18n.localize("EH.Item.Type.Weapon[one]"),
			subtype: CONFIG.EverydayHeroes.weaponTypes[this.type.value]?.label ?? ""
		}).trim().replace("  ", " ");
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	prepareFinalDC() {
		this.dc = this.ammunition?.system.dc || 8 + this.attackMod;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Socket Event Handlers                    */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	async _preCreate(data, options, user) {
		if ( this.parent.parent?.type === "npc" ) this.parent.updateSource({type: "npcWeapon"});
	}
}
