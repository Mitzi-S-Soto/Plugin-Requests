/*:
* @plugindesc This Plugin causes states removed by damage to be removed when an attack
* that deals HP damage lands, even if it does 0 damage.
* @author Zevia
*
* @help This Plugin has no parameters.
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var RemoveStatesByZeroDamage = module.Zevia.RemoveStatesByZeroDamage = {};

    RemoveStatesByZeroDamage.executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        if (this.isDrain()) {
            value = Math.min(target.hp, value);
        }
        this.makeSuccess(target);
        target.gainHp(-value);
        target.onDamage(value);
        this.gainDrainedHp(value);
    };
})(window);
