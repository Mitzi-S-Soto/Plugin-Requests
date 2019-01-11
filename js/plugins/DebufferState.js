/*:
* @plugindesc Allows the user to add notetags to skills to indicate that, if the user has one state, the skill
* should apply another state to the target.
* @author Zevia
*
* @help In a skill, write the notetag: "<debuffer: x, y, z...>", where
* x, y, z, and any other variables are state IDs. The first number is the state
* the user needs in order to apply all the subsequent states to the target.

* For example, in a default project, <debuffer: 3, 4> in a skill's notetag would
* mean, "If the user has state ID 3 (Immortal), then the target receives state ID
* 4 (Poisoned)." <debuffer: 3, 4, 6, 8> would say, "If the user has state ID 3
* (Immortal), then the target receives state IDs 4 (Poisoned), 6 (Silence), and
* 8 (Confusion)".
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var DebufferState = module.Zevia.DebufferState = {};

    DebufferState.evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        var value = DebufferState.evalDamageFormula.call(this, target);
        var debuffer = this.item().meta.debuffer;
        if (!debuffer) { return value; }

        var stateIds = debuffer.match(/\d+/g);
        if (stateIds.length < 2) { return value; }

        var buffId = parseInt(stateIds[0]);
        if (isNaN(buffId)) { return value; }

        if (this.subject().isStateAffected(buffId)) {
            for (var i = 1; i < stateIds.length; i++) {
                var stateId = parseInt(stateIds[i]);
                if (isNaN(stateId)) { return value; }

                target.addState(stateId);
            }
        }

        return value;
    };
})(window);
