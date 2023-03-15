import AdvancementConfig from "./advancement-config.mjs";
import { TYPES } from "../../data/advancement/scale-value-data.mjs";

/**
 * Configuration application for scale values.
 */
export default class ScaleValueConfig extends AdvancementConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["everyday-heroes", "advancement", "config", "scale-value", "two-column"],
			template: "systems/everyday-heroes/templates/advancement/scale-value-config.hbs",
			width: 540
		});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	getData() {
		const config = this.advancement.configuration;
		const type = TYPES[config.type];
		return foundry.utils.mergeObject(super.getData(), {
			previewIdentifier: this.advancement._source.identifier || this.advancement.title?.slugify()
				|| this.advancement.constructor.metadata.title.slugify(),
			type: type.metadata,
			types: Object.fromEntries(
				Object.entries(this.advancement.constructor.TYPES).map(([key, d]) => {
					return [key, game.i18n.localize(d.metadata.label)];
				})
			),
			faces: Object.fromEntries(TYPES.dice.FACES.map(die => [die, `d${die}`])),
			levels: this._prepareLevelData()
		});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Prepare the data to display at each of the scale levels.
	 * @returns {object}
	 * @internal
	 */
	_prepareLevelData() {
		let lastValue = null;
		return Array.fromRange(CONFIG.EverydayHeroes.maxLevel, 1).reduce((obj, level) => {
			obj[level] = { placeholder: this._formatPlaceholder(lastValue), value: null };
			const value = this.advancement.configuration.scale[level];
			if ( value ) {
				this._mergeScaleValues(value, lastValue);
				obj[level].className = "new-scale-value";
				obj[level].value = value;
				lastValue = value;
			}
			return obj;
		}, {});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Formats the placeholder for this scale value.
	 * @param {*} placeholder
	 * @returns {object}
	 * @internal
	 */
	_formatPlaceholder(placeholder) {
		if ( this.advancement.configuration.type === "dice" ) return {
			number: placeholder?.number ?? "",
			denomination: placeholder?.denomination ? `d${placeholder.denomination}` : ""
		};
		return { value: placeholder?.value ?? "" };
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * For scale values with multiple properties, have missing properties inherit from earlier filled-in values.
	 * @param {*} value - The primary value.
	 * @param {*} lastValue - The previous value.
	 */
	_mergeScaleValues(value, lastValue) {
		for ( const k of Object.keys(lastValue ?? {}) ) {
			if ( value[k] === null ) value[k] = lastValue[k];
		}
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	static _cleanedObject(object) {
		return Object.entries(object).reduce((obj, [key, value]) => {
			if ( Object.keys(value ?? {}).some(k => value[k]) ) obj[key] = value;
			else obj[`-=${key}`] = null;
			return obj;
		}, {});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	async prepareConfigurationUpdate(configuration) {
		// Ensure multiple values in a row are not the same
		let lastValue = null;
		for ( const [lvl, value] of Object.entries(configuration.scale) ) {
			if ( this.advancement.testEquality(lastValue, value) ) configuration.scale[lvl] = null;
			else if ( Object.keys(value ?? {}).some(k => value[k]) ) {
				this._mergeScaleValues(value, lastValue);
				lastValue = value;
			}
		}
		configuration.scale = this.constructor._cleanedObject(configuration.scale);
		return configuration;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	async _updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);
		const typeChange = "configuration.type" in formData;
		if ( typeChange && (updates.configuration.type !== this.advancement.configuration.type) ) {
			// Clear existing scale value data to prevent error during type update
			await this.advancement.update(Array.fromRange(CONFIG.EverydayHeroes.maxLevel, 1).reduce((obj, lvl) => {
				obj[`configuration.scale.-=${lvl}`] = null;
				return obj;
			}, {}));
			updates.configuration.scale ??= {};
			const OriginalType = TYPES[this.advancement.configuration.type];
			const NewType = TYPES[updates.configuration.type];
			for ( const [lvl, data] of Object.entries(updates.configuration.scale) ) {
				const original = new OriginalType(data, { parent: this.advancement });
				updates.configuration.scale[lvl] = NewType.convertFrom(original)?.toObject();
			}
		}
		return super._updateObject(event, foundry.utils.flattenObject(updates));
	}
}
