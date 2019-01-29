/*:
* @plugindesc Allows for states to affect PARAM and EX-PARAM values only if being targeted by a user who also
* has another state.
* @author Zevia
*
* @help In a state's notetag, put <stateCombo: stat, x, y>, where stat is the
* PARAM or EX-PARAM to be affected, x is the percentage to affect it by,
* and y is the state the user must have to apply the stat adjustment
*
* For example, <stateCombo: eva, -50, 4> means that if an Actor or Enemy has this
* state, and someone with state 4 targets them, their evade will be decreased
* by 50%.
*
* Keep in mind that EX-PARAMS are additive and PARAMS are multiplicative.
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var StateCombos = module.Zevia.StateCombos = {};
    var PARAMS = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
    var XPARAMS = ['hit', 'eva', 'cri', 'cev', 'mev', 'mrf', 'cnt', 'hrg', 'mrg', 'trg'];

    Game_BattlerBase.prototype.comboStates = function() {
        if (!this._comboSubject) { return []; }

        return this.states().filter(function(state) {
            return state.meta.stateCombo;
        }).map(function(state) {
            return state.meta.stateCombo.split(',');
        }).filter(function(combo) {
            return combo.length === 3;
        }).map(function(combos) {
            return {
                param: combos[0].trim().toLowerCase(),
                value: parseInt(combos[1]),
                subjectState: parseInt(combos[2])
            };
        });
    };

    Game_BattlerBase.prototype.comboValue = function(paramList, paramId, baseValue) {
        return this.comboStates().filter(function(trait) {
            return (paramList.indexOf(trait.param) === paramId) && (this._comboSubject.isStateAffected(trait.subjectState));
        }.bind(this)).reduce(function(total, trait) {
            if (baseValue === 0) { return total + trait.value; }
            else { return total * trait.value; }
        }, baseValue);
    };

    StateCombos.applyAction = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        target._comboSubject = this.subject();
        StateCombos.applyAction.call(this, target);
    };

    StateCombos.xparam = Game_BattlerBase.prototype.xparam;
    Game_BattlerBase.prototype.xparam = function(xparamId) {
        return StateCombos.xparam.call(this, xparamId) + this.comboValue(XPARAMS, xparamId, 0);
    };

    StateCombos.paramRate = Game_BattlerBase.prototype.paramRate;
    Game_BattlerBase.prototype.paramRate = function(paramId) {
        return StateCombos.paramRate.call(this, paramId) * this.comboValue(PARAMS, paramId, 1);
    };

    StateCombos.endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        $gameTroop.members().concat($gameParty.battleMembers()).forEach(function(member) {
            member._comboSubject = undefined;
        });
        StateCombos.endTurn.call(this);
    };
})(window);
