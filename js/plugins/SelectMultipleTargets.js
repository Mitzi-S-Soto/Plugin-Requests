/*:
* @plugindesc This plugin allows the user to mark a skill as capable of selecting multiple
* single targets, so that it repeats, but not against random enemies.
* @author Zevia
*
* @help For a skill or item, make sure the scope is either 1 enemy or 1 ally. This
* plugin won't work with other scopes. In the skill or item's notebox, put
* <multipleTargets: x>, where x is the number of targets you want the skill to
* affect and allow selection for. For example, if you put <multipleTargets: 4>,
* then the skill will let you select 4 targets.
*/

(function(module) {
    'use strict';

    var SKILL_DATA_CLASS = 'skill';

    module.Zevia = module.Zevia || {};
    var SelectMultipleTargets = module.Zevia.MultipleTargets = {};

    SelectMultipleTargets.resetTargets = function() {
        BattleManager.inputtingAction()._multipleTargets = [];
    };

    Scene_Battle.prototype.okHandler = function(activeWindow, index) {
        var action = BattleManager.inputtingAction();
        action.setTarget(index);
        var isForFriend = action.isForFriend();
        action._multipleTargets = (action._multipleTargets || []).concat(isForFriend ? $gameParty.battleMembers()[index] : $gameTroop.members()[index]);
        var item = action._item;
        var ability = item._dataClass === SKILL_DATA_CLASS ? $dataSkills[item._itemId] : $dataItems[item._itemId];
        var multipleTargets = ability.meta.multipleTargets;
        var maxTargets = multipleTargets && parseInt(multipleTargets.match(/\d+/));
        if (!multipleTargets || isNaN(maxTargets) || action._multipleTargets.length === maxTargets) {
            activeWindow.hide();
            this._skillWindow.hide();
            this._itemWindow.hide();
            this.selectNextCommand();
            return;
        }

        var targetWindow = isForFriend ? this._actorWindow : this._enemyWindow;
        targetWindow.activate();
    };

    SelectMultipleTargets.onEnemyOk = Scene_Battle.prototype.onEnemyOk;
    Scene_Battle.prototype.onEnemyOk = function() {
        this.okHandler.call(this, this._enemyWindow, this._enemyWindow.enemyIndex());
    };

    SelectMultipleTargets.onActorOk = Scene_Battle.prototype.onActorOk;
    Scene_Battle.prototype.onActorOk = function() {
        this.okHandler.call(this, this._actorWindow, this._actorWindow.index());
    };

    SelectMultipleTargets.onActorCancel = Scene_Battle.prototype.onActorCancel;
    Scene_Battle.prototype.onActorCancel = function() {
        SelectMultipleTargets.onActorCancel.call(this);
        SelectMultipleTargets.resetTargets();
    };

    SelectMultipleTargets.onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
    Scene_Battle.prototype.onEnemyCancel = function() {
        SelectMultipleTargets.onEnemyCancel.call(this);
        SelectMultipleTargets.resetTargets();
    };

    Game_Action.prototype.confirmTargets = function() {
        var isForDeadFriend = this.isForDeadFriend();
        var isForFriend = this.isForFriend();
        var item = this.item();
        var ability = item._dataClass === SKILL_DATA_CLASS ? $dataSkills[item._itemId] : $dataItems[item._itemId];
        for (var i = 0; i < this._multipleTargets.length; i++) {
            if (!isForDeadFriend && this._multipleTargets[i].isDead()) {
                if (isForFriend) {
                    this._multipleTargets[i] = $gameParty.randomTarget();
                } else {
                    this._multipleTargets[i] = $gameTroop.randomTarget();
                }
            } else if (isForDeadFriend && !this._multipleTargets[i].isDead()) {
                this._multipleTargets[i] = $gameParty.randomDeadTarget();
            }
        }
        return this._multipleTargets;
    };

    SelectMultipleTargets.targetsForOpponents = Game_Action.prototype.targetsForOpponents;
    Game_Action.prototype.targetsForOpponents = function() {
        if (this._multipleTargets && this._multipleTargets.length) { return this.confirmTargets(); }
        return SelectMultipleTargets.targetsForOpponents.call(this);
    };

    SelectMultipleTargets.targetsForFriends = Game_Action.prototype.targetsForFriends;
    Game_Action.prototype.targetsForFriends = function() {
        if (this._multipleTargets && this._multipleTargets.length) { return this.confirmTargets(); }
        return SelectMultipleTargets.targetsForFriends.call(this);
    };
})(window);
