/*:
* @plugindesc Allows configuration of first strike responses to certain items, weapons, and
* armors, or to indicate that an Actor, Enemy, or Class has first strike.
* @author Zevia
*
* @help First strike is a counterattack that happens before the original
* subject's attack is performed. If the subject is still alive after
* taking first strike damage, then their attack continues as normal.
*
* @param firstStrikeMessage
* @text First Strike Message
* @desc Text that appears after the target's name when they have first strike
* @default strikes first!
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var FirstStrike = module.Zevia.FirstStrike = {};
    var parameters = PluginManager.parameters('FirstStrike');
    var firstStrikeMessage = parameters.firstStrikeMessage;
    var Imported = Imported || {};

    FirstStrike.shouldPerformStrike = function(strikeType) {
        if (!strikeType) { return false; }
        if (strikeType.match(/all/i)) { return true; }


    };

    BattleManager.invokeFirstStrike = function(subject, target) {
        var action = new Game_Action(target);
        if (Imported.YEP_BattleEngineCore) { BattleManager._logWindow.displayFirstStrike(subject, target); }
        action.setAttack();
        action.apply(subject);
        if (!Imported.YEP_BattleEngineCore) { BattleManager._logWindow.displayFirstStrike(subject, target); }
        BattleManager._logWindow.displayActionResults(target, subject);
        if (Imported.YEP_BattleEngineCore && subject.isDead()) { subject.performCollapse(); }
    };

    FirstStrike.invokeAction = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        var subjectHasFirstStrike = FirstStrike.shouldPerformStrike(
            (subject instanceof Game_Actor ? $dataActors[subject._actorId] : $dataEnemies[subject._enemyId])
                .meta.firstStrike
        );
        var targetHasFirstStrike = FirstStrike.shouldPerformStrike(
            (target instanceof Game_Actor ? $dataActors[target._actorId] : $dataEnemies[target._enemyId])
                .meta.firstStrike
        );
        if (!subjectHasFirstStrike && targetHasFirstStrike) {
            BattleManager.invokeFirstStrike(subject, target);
            if (subject.hp <= 0) { return };
        }

        BattleManager._logWindow.push('performInvocation', subject, target);
    };

    Window_BattleLog.prototype.displayFirstStrike = function(subject, target) {
        this.push('performFirstStrike', target);
        this.push('addText', target.name() + ' ' + firstStrikeMessage);
    };

    Window_BattleLog.prototype.performFirstStrike = function(target) {
        if (target.performAttack) { target.performAttack(); }
    };

    Window_BattleLog.prototype.performInvocation = function(subject, target) {
        FirstStrike.invokeAction.call(BattleManager, subject, target);
    };
})(window);
