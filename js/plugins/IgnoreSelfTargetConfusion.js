/*:
* @plugindesc This Plugin makes it so that Battlers cannot target themselves when
* affected by a state where the restriction is "target anyone."
* @author Zevia
*
* @help If the battler is the only member of the party, they will
* automatically target a unit in the opponents' party.
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var IgnoreSelfTargetConfusion = module.Zevia.IgnoreSelfTargetConfusion = {};

    IgnoreSelfTargetConfusion.startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        $gameParty._subject = undefined;
        $gameParty._friendsUnit = undefined;
        $gameParty._targetUnit = undefined;
        $gameTroop._subject = undefined;
        $gameTroop._friendsUnit = undefined;
        $gameTroop._targetUnit = undefined;
        IgnoreSelfTargetConfusion.startAction.call(this);
    };

    IgnoreSelfTargetConfusion.randomTarget = Game_Unit.prototype.randomTarget;
    Game_Unit.prototype.randomTarget = function() {
        if (
            !this._subject ||
            !this._subject.isConfused() ||
            this._friendsUnit !== this._targetUnit
        ) { return IgnoreSelfTargetConfusion.randomTarget.call(this); }

        var tgrRand = (Math.random() * this.tgrSum()) - this._subject.tgr;
        var target = null;
        this.aliveMembers().filter(function(member) {
            if (this._subject._actorId) { return member._actorId !== this._subject._actorId; }
            else { return member.index() !== this._subject.index(); }
        }.bind(this)).forEach(function(member) {
            tgrRand -= member.tgr;
            if (tgrRand <= 0 && !target) { target = member; }
        });
        return target;
    };

    IgnoreSelfTargetConfusion.confusionTarget = Game_Action.prototype.confusionTarget;
    Game_Action.prototype.confusionTarget = function() {
        var subject = this.subject();
        var confusionLevel = subject.confusionLevel();
        var targetUnit = this.friendsUnit();
        targetUnit._friendsUnit = targetUnit.constructor;
        if (targetUnit.aliveMembers().length === 1) { targetUnit = this.opponentsUnit(); }

        if (confusionLevel === 1 || (confusionLevel === 2 && Math.randomInt(2) === 0)) { targetUnit = this.opponentsUnit(); }
        targetUnit._targetUnit = targetUnit.constructor;
        targetUnit._subject = subject;
        return targetUnit.randomTarget();
    };
})(window);
