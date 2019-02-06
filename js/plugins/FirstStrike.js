/*:
* @plugindesc Allows configuration of first strike responses to certain items, weapons, and
* armors, or to indicate that an Actor, Enemy, or Class has first strike.
* @author Zevia
*
* @help First Strike is a counterattack that happens before the original
* subject's attack is performed. If the subject is still alive after
* taking First Strike damage, then their attack continues as normal.
* Regular counterattacks will still occur as normal - First Strike is
* its own responsive attack.
*
* First Strikes will occur when a target has a firstStrike against a
* specified attackType. AttackTypes can be set on Actors, Enemies,
* Classes, States, Weapons, Armors, and Items by using the <attackTypes>
* tag. Comma-separate each type. For example:
*
* <attackTypes: piercing, charging>
*
* AttackTypes are combined across all categories, so if a Battler has
* a weapon with a piercing attackType, a state with a magical
* attackType, and armor with a bashing attackType, then the Battler
* has the attackTypes piercing, magical, and bashing.
*
* FirstStrike can be indicated with a <firstStrike> tag, followed by
* a comma-separated list of every type that Battler, Class, Weapon,
* Armor, or State will have First Strike against, as well as the
* skill ID of the skill that should be used to strike back. Skill
* IDs should always be the last item in the list. For example:
*
* <firstStrike: charging, 1>
*
* That would indicate that if the target is attacked by a subject
* with an attackType of charging, they will have First Strike using
* skill 1 (Attack by default).
*
* First Strike is not cumulative and instead takes a priority approach.
* Battlers will use the first First Strike category and skill ID
* according to the following list:
*
* Enemies
* 1. States
* 2. Enemy Notetag
*
* Actors
* 1. Weapons
* 2. Armors
* 3. States
* 4. Actor Notetag
* 5. Class Notetag
*
* For example, if an Enemy has attackTypes piercing and charging,
* and an Actor is wearing a Weapon with <firstStrike: bashing, charging, 1>
* and an Armor with <firstStrike: piercing, 9>, then they will perform
* a First Strike with skill ID 1 because the Weapon is the highest
* priority that matches one of the Enemy's attackTypes.
*
* If the Actor instead had a Weapon with <firstStrike: bashing, 1>
* and an Armor with <firstStrike: charging, 9>, then they will perform
* a First Strike with skill ID 9 because their Armor is the highest-
* priority item that matches one of the attacker's attackTypes.
*
* First Strikes consume resources when using skills, so MP and TP
* is expended when using First Strike. If a Battler cannot afford
* to pay for the cost of their First Strike skill, they will
* default to using their basic attack.
*
* This Plugin should be compatible with YEP_BattleEngineCore and
* YEP_X_ActSeqPack2. Any other Plugins have not been tested.
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

    function reduceTypes(types, item) {
        return types.concat((item.meta.attackTypes || '').split(','));
    }

    FirstStrike.getAttackTypes = function(subject) {
        var itemTypes = (BattleManager._action.item().meta.attackTypes || '').split(',');

        if (subject instanceof Game_Enemy) {
            var enemyTypes = ($dataEnemies[subject._enemyId].meta.attackTypes || '').split(',');
            return itemTypes.concat(enemyTypes);
        }
        if (subject instanceof Game_Actor) {
            var actorTypes = ($dataActors[subject._actorId].meta.attackTypes || '').split(',');
            var classTypes = (subject.currentClass().meta.attackTypes || '').split(',');
            var weaponTypes = subject.weapons().reduce(reduceTypes, []);
            var armorTypes = subject.armors().reduce(reduceTypes, []);
            var stateTypes = subject.states().reduce(reduceTypes, []);
            return itemTypes.concat(actorTypes).concat(classTypes).concat(weaponTypes).concat(armorTypes).concat(stateTypes);
        }
    };

    Game_Battler.prototype.confirmStrikeSkill = function() {
        var strikeData = this._strikeData.split(',');
        var skillId = parseInt(strikeData[strikeData.length - 1].trim());
        var skill = $dataSkills[skillId];
        if ((skill.mpCost > this.mp) || (skill.tpCost > this.tp)) { return this.attackSkillId(); }

        return skillId;
    };

    Game_Battler.prototype.hasFirstStrike = function(type) {
        if (!type) { return false; }

        if (type && !(type instanceof Array)) {
            this._strikeData = type;
            return true;
        }

        var strikeType = type.find(function(item) {
            return item.meta.firstStrike;
        });
        if (strikeType) {
            this._strikeData = strikeType.meta.firstStrike;
            return true;
        }

        return false;
    };

    Game_Battler.prototype.hasStrikeType = function(attackTypes) {
        return !!this._strikeData.split(',').find(function(strikeType) {
            return (strikeType.match(/all/i)) || (attackTypes.find(function(attackType) {
                return attackType.match(new RegExp(strikeType, 'i'));
            }));
        });
    };

    Game_Enemy.prototype.shouldPerformStrike = function(subject) {
        var attackTypes = FirstStrike.getAttackTypes(subject);
        if (!attackTypes.length) { return false; }

        if (this.hasFirstStrike(this.states())) {
            return this.hasStrikeType(attackTypes);
        }
        if (this.hasFirstStrike($dataEnemies[this._enemyId].meta.firstStrike)) {
            return this.hasStrikeType(attackTypes);
        }

        return false;
    };

    Game_Enemy.prototype.firstStrikeSkillId = function() {
        var dataBattler = $dataEnemies[this._enemyId];
        if (this.hasFirstStrike(this.states())) { return this.confirmStrikeSkill(); }

        this._strikeData = dataBattler.meta.firstStrike;
        return this.confirmStrikeSkill();
    };

    Game_Actor.prototype.shouldPerformStrike = function(subject) {
        var attackTypes = FirstStrike.getAttackTypes(subject);
        if (!attackTypes.length) { return false; }

        if (this.hasFirstStrike(this.weapons())) {
            return this.hasStrikeType(attackTypes);
        }
        if (this.hasFirstStrike(this.armors())) {
            return this.hasStrikeType(attackTypes);
        }
        if (this.hasFirstStrike(this.states())) {
            return this.hasStrikeType(attackTypes);
        }
        if (this.hasFirstStrike($dataActors[this._actorId].meta.firstStrike)) {
            return this.hasStrikeType(attackTypes);
        }
        if (this.hasFirstStrike(this.currentClass().meta.firstStrike)) {
            return this.hasStrikeType(attackTypes);
        }

        return false;
    };

    Game_Actor.prototype.firstStrikeSkillId = function() {
        if (this.hasFirstStrike(this.weapons())) { return this.confirmStrikeSkill(); }
        if (this.hasFirstStrike(this.armors())) { return this.confirmStrikeSkill(); }
        if (this.hasFirstStrike(this.states())) { return this.confirmStrikeSkill(); }
        if (this.hasFirstStrike($dataActors[this._actorId].meta.firstStrike)) { return this.confirmStrikeSkill(); }

        this.hasFirstStrike(this.currentClass().meta.firstStrike);
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

    FirstStrike.startBattleAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        var subject = this._subject;
        var action = subject.currentAction();
        BattleManager._action = action;
        FirstStrike._action = action;
        if (!module.Imported || !module.Imported.YEP_BattleEngineCore) {
            var targets = action.makeTargets();
            this._phase = 'action';
            this._targets = targets;
            FirstStrike._targets = targets.clone();
            subject.useItem(action.item());
            this._action.applyGlobal();
            this.refreshStatus();
            this._logWindow.displayAction(subject, action.item());
        } else {
            if (!subject) return this.endAction();
            if (!this._action) return this.endAction();
            if (!this._action.item()) return this.endAction();
            var targets = action.makeTargets();
            FirstStrike._targets = targets.clone();
            this.setTargets(targets);
            this._allTargets = targets.slice();
            this._individualTargets = targets.slice();
            this._phase = 'phaseChange';
            this._phaseSteps = ['setup', 'whole', 'target', 'follow', 'finish'];
            this._returnPhase = '';
            this._actionList = [];
            subject.useItem(this._action.item());
            this._action.applyGlobal();
            this._logWindow.startAction(this._subject, this._action, this._targets);
        }
    };

    FirstStrike.invokeAction = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        if (subject.hp <= 0) { return; }
        if (target.shouldPerformStrike(subject)) {
            BattleManager.invokeFirstStrike(subject, target);
            if (subject.hp <= 0) { return };
        }

        BattleManager._logWindow.push('performInvocation', subject, target);
    };

    Window_BattleLog.prototype.displayFirstStrike = function(subject, target) {
        this.push('addText', target.name() + ' ' + firstStrikeMessage);
        if (!module.Imported || !module.Imported.YEP_BattleEngineCore) {
            this.startAction(target, target._firstStrikeAction, [subject]);
            this.push('updateStatus');
            this.displayActionResults(target, subject);
            this.endAction(target);
        } else {
            target.performAction(target._firstStrikeAction);
            this.push('updateStatus');
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
        if (!module.Imported || !module.Imported.YEP_BattleEngineCore) {
            this.push('performActionStart', subject, FirstStrike._action);
            this.push('waitForMovement');
            this.push('performAction', subject, FirstStrike._action);
            this.push('showAnimation', subject, FirstStrike._targets.clone(), FirstStrike._action.item().animationId);
        }
        this.push('invokeAction', subject, target);
    };

    Window_BattleLog.prototype.invokeAction = function(subject, target) {
        FirstStrike.invokeAction.call(BattleManager, subject, target);
    };

    Window_BattleLog.prototype.updateStatus = function() {
        BattleManager._statusWindow.refresh();
    };

    FirstStrike.updateWaitMode = Window_BattleLog.prototype.updateWaitMode;
    Window_BattleLog.prototype.updateWaitMode = function() {
        if (this._spriteset.isAnimationPlaying() && this._methods[0] && this._methods[0].name !== 'addText') { return true; }

        FirstStrike.updateWaitMode.call(this);
    };
})(window);
