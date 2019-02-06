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
* @desc Text that appears after the target's name in the BattleLog Window when they have first strike
* @default strikes first!
*/

(function(module) {
    'use strict';

    // Polyfill for older versions of RPG Maker MV
    Array.prototype.find = Array.prototype.find || function(finderFunction) {
        for (var i = 0; i < this.length; i++) {
            var element = this[i];
            if (finderFunction(element, i, this)) { return element; }
        }
    };

    module.Zevia = module.Zevia || {};
    var FirstStrike = module.Zevia.FirstStrike = {};
    var parameters = PluginManager.parameters('FirstStrike');
    var firstStrikeMessage = parameters.firstStrikeMessage;

    FirstStrike.shouldPerformStrike = function(dataBattler) {
        var strikeType = dataBattler.meta.firstStrike;
        if (!strikeType) { return false; }
        if (strikeType.match(/all/i)) { return true; }


    };

    Game_Battler.prototype.confirmStrikeSkill = function() {
        var skillId = parseInt(this._strikeData.split(',')[1].trim());
        var skill = $dataSkills[skillId];
        if ((skill.mpCost > this.mp) || (skill.tpCost > this.tp)) { return this.attackSkillId(); }

        return skillId;
    };

    Game_Enemy.prototype.firstStrikeSkillId = function() {
        var dataBattler = $dataEnemies[this._enemyId];
        this._strikeData = dataBattler.meta.firstStrike;
        return this.confirmStrikeSkill();
    };

    Game_Actor.prototype.findStrikeType = function(type) {
        if (type && !(type instanceof Array)) {
            this._strikeData = type;
            return true;
        }

        var equipStrike = type.find(function(equip) {
            return equip.meta.firstStrike;
        });
        if (equipStrike) {
            this._strikeData = equipStrike.meta.firstStrike;
            return true;
        }

        return false;
    };

    Game_Actor.prototype.firstStrikeSkillId = function() {
        if (this.findStrikeType($dataActors[this._actorId].meta.firstStrike)) { return this.confirmStrikeSkill(); }
        if (this.findStrikeType(this.currentClass().meta.firstStrike)) { return this.confirmStrikeSkill(); }
        if (this.findStrikeType(this.weapons())) { return this.confirmStrikeSkill(); }

        this.findStrikeType(this.armors());
        return this.confirmStrikeSkill();
    };

    BattleManager.invokeFirstStrike = function(subject, target) {
        var action = new Game_Action(target);
        action.setSkill(target.firstStrikeSkillId());
        if (!module.Imported || !module.Imported.YEP_BattleEngineCore) { action.apply(subject); }
        target.useItem(action.item());
        target._firstStrikeAction = action;
        BattleManager._logWindow.displayFirstStrike(subject, target);
    };

    FirstStrike.invokeAction = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        var subjectHasFirstStrike = FirstStrike.shouldPerformStrike(
            (subject instanceof Game_Actor ? $dataActors[subject._actorId] : $dataEnemies[subject._enemyId])
        );
        var targetHasFirstStrike = FirstStrike.shouldPerformStrike(
            (target instanceof Game_Actor ? $dataActors[target._actorId] : $dataEnemies[target._enemyId])
        );
        if (!subjectHasFirstStrike && targetHasFirstStrike) {
            BattleManager.invokeFirstStrike(subject, target);
            if (subject.hp <= 0) { return };
        }

        BattleManager._logWindow.push('performInvocation', subject, target);
    };

    FirstStrike.updateWaitMode = Window_BattleLog.prototype.updateWaitMode;
    Window_BattleLog.prototype.updateWaitMode = function() {
        if (this._spriteset.isAnimationPlaying() && this._methods[0] && this._methods[0].name !== 'addText') { return true; }

        FirstStrike.updateWaitMode.call(this);
    };

    Window_BattleLog.prototype.displayFirstStrike = function(subject, target) {
        this.push('addText', target.name() + ' ' + firstStrikeMessage);
        if (!module.Imported || !module.Imported.YEP_BattleEngineCore) {
            this.startAction(target, target._firstStrikeAction, [subject]);
            this.displayActionResults(target, subject);
            this.endAction(target);
        } else {
            target.performAction(target._firstStrikeAction);
            this.displayActionResults(target, subject);
            this.showAnimation(target, [subject], target._firstStrikeAction.item().animationId);
            this.waitForAnimation();
            this.push('applyAction', target._firstStrikeAction, subject, target);
        }
    };

    Window_BattleLog.prototype.applyAction = function(action, target) {
        action.apply(target);
    };

    Window_BattleLog.prototype.performInvocation = function(subject, target) {
        if (subject.hp <= 0) {
            subject.performCollapse();
            return;
        }
        FirstStrike.invokeAction.call(BattleManager, subject, target);
    };
})(window);
