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
*
* @param shouldUseIndicators
* @text Use Selection Indicators
* @desc Whether target indicators appear over Sprites with each selection made
* @type boolean
* @default false
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
    var SKILL_DATA_CLASS = 'skill';
    var INDEX_GRADIENTS = [
        ['#E50027', '#BF7300'],
        ['#45E500', '#12CA48'],
        ['#007DE5', '#0147CB']
    ];
    var shouldUseIndicators = !!PluginManager.parameters('SelectMultipleTargets').shouldUseIndicators.match(/true/i);

    var Window_Indicator = module.Zevia.Window_Indicator = function() {
        this.initialize.apply(this, arguments);
    };

    Window_Indicator.prototype = Object.create(Window_Base.prototype);
    Window_Indicator.prototype.initialize = function(x, y, index) {
        this._indicators = [index];
        Window_Base.prototype.initialize.call(this, x, y, this.windowWidth(), this.windowHeight());
        this.contents.fontSize = 18;
        this.opacity = 0;
        this.refresh();
    };

    Window_Indicator.prototype.triangleWidth = function() {
        return 36;
    };
    Window_Indicator.prototype.windowWidth = function() {
        return this._indicators.length * this.triangleWidth();
    };
    Window_Indicator.prototype.windowHeight = function() {
        return 31;
    };
    Window_Indicator.prototype.standardPadding = function() {
        return 0;
    };
    Window_Indicator.prototype.contentsWidth = function() {
        return Graphics.boxWidth;
    };
    Window_Indicator.prototype.contentsHeight = function() {
        return Graphics.boxHeight;
    };

    Window_Indicator.prototype.addIndicator = function(index) {
        this._indicators.push(index);
        this.move(this.x - (this.triangleWidth() / 4), this.y, this.windowWidth(), this.windowHeight());
        this.refresh();
    };

    Window_Indicator.prototype.drawTriangle = function(indicator, index) {
        var ctx = this.contents._context;
        var gradient = ctx.createLinearGradient(0, 0, 0, this.windowHeight());
        var colors = INDEX_GRADIENTS[indicator % 3];
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.5, colors[1]);
        ctx.fillStyle = gradient;
        var x = (this.triangleWidth() / 2) * index;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + this.triangleWidth(), 0);
        ctx.lineTo(x + (this.triangleWidth() / 2), this.windowHeight());
        ctx.fill();
    };

    Window_Indicator.prototype.refresh = function() {
        this.contents.clear();
        this._indicators.forEach(function(indicator, index) {
            this.drawTriangle(indicator, index);
            var x = (this.triangleWidth() / 2) * index;
            this.drawText(
                indicator,
                (this.triangleWidth() / 2) * index,
                (this.windowHeight() / 2) - (this.lineHeight() / 2) - (this.contents.fontSize / 4),
                this.triangleWidth(),
                'center'
            );
        }.bind(this));
    };

    var SelectMultipleTargets = module.Zevia.MultipleTargets = {};

    SelectMultipleTargets.resetTargets = function() {
        BattleManager.inputtingAction()._multipleTargets = [];
        SceneManager._scene.clearIndicators();
    };

    Scene_Battle.prototype.clearIndicators = function() {
        this._windowLayer.children = this._windowLayer.children.filter(function(child) {
            return !(child instanceof module.Zevia.Window_Indicator);
        });
        this._enemyIndicators = {};
        this._actorIndicators = {};
    };

    Scene_Battle.prototype.okHandler = function(activeWindow, index) {
        var action = BattleManager.inputtingAction();
        action.setTarget(index);
        var isForFriend = action.isForFriend();
        if (index >= 0) {
            action._multipleTargets = (action._multipleTargets || []).concat(isForFriend ? $gameParty.battleMembers()[index] : $gameTroop.members()[index]);
        }
        var item = action._item;
        var ability = item._dataClass === SKILL_DATA_CLASS ? $dataSkills[item._itemId] : $dataItems[item._itemId];
        var multipleTargets = ability.meta.multipleTargets;
        var maxTargets = multipleTargets && parseInt(multipleTargets.match(/\d+/));
        if (!multipleTargets || isNaN(maxTargets) || action._multipleTargets.length === maxTargets) {
            if (shouldUseIndicators) { this.clearIndicators(); }
            activeWindow.hide();
            this._skillWindow.hide();
            this._itemWindow.hide();
            this.selectNextCommand();
            return;
        }

        if (shouldUseIndicators) {
            var targetSprite = this._spriteset[(isForFriend ? '_actorSprites' : '_enemySprites')].find(function(sprite) {
                return sprite._battler.index() === index;
            });
            var indicators = isForFriend ? '_actorIndicators' : '_enemyIndicators';
            var indicatorWindow = this[indicators][index];
            if (indicatorWindow) {
                indicatorWindow.addIndicator(action._multipleTargets.length);
            } else {
                var mainSprite = isForFriend ? targetSprite._mainSprite : targetSprite;
                indicatorWindow = new module.Zevia.Window_Indicator(
                    targetSprite.x - (mainSprite.width / 2) + (isForFriend ? 15 : 36),
                    targetSprite.y - mainSprite.height - 36,
                    action._multipleTargets.length
                );
                this[indicators][index] = indicatorWindow;
                this.addWindow(indicatorWindow);
            }
        }
        activeWindow.activate();
    };

    SelectMultipleTargets.initializeBattle = Scene_Battle.prototype.initialize;
    Scene_Battle.prototype.initialize = function() {
        this._enemyIndicators = {};
        this._actorIndicators = {};
        SelectMultipleTargets.initializeBattle.call(this);
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
