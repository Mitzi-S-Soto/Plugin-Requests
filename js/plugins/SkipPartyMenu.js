/*:
* @plugindesc Skips the fight/escape menu at the start of each turn.
* @author Zevia
*
* @help This plugin will cause the party menu where you choose fight or escape
* to be skipped at the start of each turn. The Escape command will be moved
* to the end of the command menu. The Escape command can be removed altogether
* by changing the "Add Escape Command" parameter in the configuration.
*
* @param isEscapeEnabled
* @text Add Escape Command
* @type boolean
* @desc Whether the Escape command will be added to the actor's command list or not
* @default true
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var SkipPartyMenu = module.Zevia.SkipPartyMenu = {};
    var ESCAPE_SYMBOL = 'escape';
    var isEscapeEnabled = !!PluginManager.parameters('SkipPartyMenu').isEscapeEnabled.match(/true/i);

    SkipPartyMenu.startBattlerInput = BattleManager.startInput;
    BattleManager.startInput = function() {
        SkipPartyMenu.startBattlerInput.call(this);
        BattleManager.selectNextCommand();
    };

    SkipPartyMenu.createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        SkipPartyMenu.createActorCommandWindow.call(this);
        if (!isEscapeEnabled) { return; }

        this._actorCommandWindow.setHandler(ESCAPE_SYMBOL, function() {
            BattleManager.actor()._actionState = '';
            BattleManager.processEscape();
        });
    };

    SkipPartyMenu.makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        SkipPartyMenu.makeCommandList.call(this);
        if (this._actor && isEscapeEnabled) {
            this.addCommand(TextManager.escape, ESCAPE_SYMBOL, BattleManager.canEscape());
        }
    };
})(window);
