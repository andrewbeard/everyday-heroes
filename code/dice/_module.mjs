import BaseRoll from "./base-roll.mjs";
import ChallengeDie from "./challenge-die.mjs";
import ChallengeRoll from "./challenge-roll.mjs";
import DamageRoll from "./damage-roll.mjs";

/**
 * Register the various roll types provided by Everyday Heroes during initialization.
 */
export function registerDice() {
	CONFIG.Dice.BaseRoll = BaseRoll;
	CONFIG.Dice.ChallengeDie = ChallengeDie;
	CONFIG.Dice.ChallengeRoll = ChallengeRoll;
	CONFIG.Dice.DamageRoll = DamageRoll;
	CONFIG.Dice.types.push(ChallengeDie);
	CONFIG.Dice.rolls = [BaseRoll, ChallengeRoll, DamageRoll];
}

export {
	BaseRoll,
	ChallengeDie,
	ChallengeRoll,
	DamageRoll
};
export {default as BaseConfigurationDialog} from "./base-configuration-dialog.mjs";
export {default as ChallengeConfigurationDialog} from "./challenge-configuration-dialog.mjs";
export {default as DamageConfigurationDialog} from "./damage-configuration-dialog.mjs";
export * as utils from "./utils.mjs";
