/**
 * Construct roll parts and populate its data object.
 * @param {object} parts - Information on the parts to be constructed.
 * @param {object} data - Roll data to use and populate while constructing the parts.
 * @returns {{ parts: string[], data: object }}
 */
export function buildRoll(parts, data) {
	const finalParts = [];
	for ( let [key, value] of Object.entries(parts) ) {
		if ( !value && (value !== 0) ) continue;
		finalParts.push(`@${key}`);
		foundry.utils.setProperty(data, key, foundry.utils.getType(value) === "string"
			? Roll.replaceFormulaData(value, data) : value);
	}
	return { parts: finalParts, data };
}

/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

/**
 * Step the provided die denomination up or down based on the provided step, clamping to the ends.
 * @param {number} denomination - Starting denomination to step.
 * @param {number} step - How many steps up or down the denomination should be moved.
 * @returns {number} - New denomination.
 */
export function stepDenomination(denomination, step) {
	return CONFIG.EverydayHeroes.diceSteps[Math.clamped(
		0,
		CONFIG.EverydayHeroes.diceSteps.indexOf(denomination) + (step ?? 0),
		CONFIG.EverydayHeroes.diceSteps.length - 1
	)];
}