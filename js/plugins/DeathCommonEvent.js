/*:
* @plugindesc This plugin will call a common event whenever any Actor or Enemy dies.
* @author Zevia
*
* @help You can specify two separate common events to run for when an Actor dies
* and for when an Enemy dies. You can also specify what game variables to use to
* store some information about how the battler died, such as the Id of the
* dying battler as well as its index within the troop or the party, or the Id
* and index of the last battler to act (most likely the battler that had the
* killing blow).
*
* You can also reference the Id and type of the skill or item last used before
* the battler died. For example, if you want to have a conditional branch in
* your common event that depends on an enemy being killed with skill ID 4,
* you could reference the actionId variable (5 by default) and the actionType
* variable (6 by default) to check if actionId is 4 and actionType is "skill".
*
* Common events are added to a queue if an Enemy or Actor's death causes the
* battle to end, such as when the last Enemy or Actor dies. This can sometimes
* cause issues, like trying to refer to enemies when you're no longer in
* battle. If you want a Death Common Event to run at the end of the Battle,
* before the victory logic is processed, then turn Run At Battle End ON.
* If you want it to run after the battle is over and you're returned to the
* previous Scene, turn Run At Battle End OFF and turn ON Run After Battle End.
*
* If you'd rather not have common events run after the last Enemy or Actor in
* battle dies, turn Run At Battle End AND Run After Battle End OFF.
*
* If Run At Battle End AND Run After Battle End are ON, then the common
* event will only be called before victory and will not be called again
* after battle.
*
* @param actorCommonEventId
* @text Actor Death Common Event ID
* @type number
* @desc The ID of the common event to call whenever an Actor dies.
* @default 1
*
* @param enemyCommonEventId
* @text Enemy Death Common Event ID
* @type number
* @desc The ID of the common events to call whenever an Enemy dies.
* @default 2
*
* @param targetId
* @text Target ID Variable
* @type number
* @desc The variable used to store the ID of the battler that just died.
* @default 1
*
* @param targetIndex
* @text Target Index Variable
* @type number
* @desc The variable used to store the index in the battle party or troop of the battler that just died.
* @default 2
*
* @param targetStates
* @text Target States Variable
* @type number
* @desc The variable used to store the list of states of the battler just before they died.
* @default 3
*
* @param subjectId
* @text Subject ID Variable
* @type number
* @desc The variable used to store the ID of the battler that just acted.
* @default 4
*
* @param subjectIndex
* @text Subject Index Variable
* @type number
* @desc The variable used to store the index in the battle party or troop of the battler that just acted.
* @default 5
*
* @param actionId
* @text Last Action ID Variable
* @type number
* @desc The variable used to store the ID of the last skill or item used before the battler died.
* @default 6
*
* @param actionType
* @text Last Action Type Variable
* @type string
* @desc The variable used to store the type of the last action used. Values are "skill" or "item".
* @default 7
*
* @param shouldRunAtEndOfBattle
* @text Run At Battle End
* @desc Whether the death common events should be run when the last Enemy or Actor dies, before victory is processed.
* @type boolean
* @default true
*
* @param shouldRunAfterBattle
* @text Run After Battle
* @type boolean
* @desc Whether the death common events should be run when the last Enemy or Actor dies, after the battle is over.
* @default false
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var DeathCommonEvent = module.Zevia.DeathCommonEvent = {};

    var parameters = PluginManager.parameters('DeathCommonEvent');
    var actorCommonEventId = parseInt(parameters.actorCommonEventId);
    var enemyCommonEventId = parseInt(parameters.enemyCommonEventId);
    var targetId = parseInt(parameters.targetId);
    var targetIndex = parseInt(parameters.targetIndex);
    var targetStates = parseInt(parameters.targetStates);
    var subjectId = parseInt(parameters.subjectId);
    var subjectIndex = parseInt(parameters.subjectIndex);
    var actionId = parseInt(parameters.actionId);
    var actionType = parseInt(parameters.actionType);
    var shouldRunAfterBattle = !!parameters.shouldRunAfterBattle.match(/true/i);
    var shouldRunAtEndOfBattle = !!parameters.shouldRunAtEndOfBattle.match(/true/i);

    DeathCommonEvent.shouldExecute = function(isActorDeath) {
        return shouldRunAfterBattle || shouldRunAtEndOfBattle || ((isActorDeath ? $gameParty.aliveMembers() : $gameTroop.aliveMembers()).length > 1);
    };

    Game_BattlerBase.prototype.executeDeathCommonEvents = function() {
        var isActorDeath = this instanceof Game_Actor;
        if (!DeathCommonEvent.shouldExecute(isActorDeath)) { return; }

        var subject = BattleManager._subject;
        var actionItem = BattleManager._action && BattleManager._action._item;
        var partyBattleMembers = $gameParty.battleMembers();
        var enemyMembers = $gameTroop.members();
        $gameVariables.setValue(targetId, (isActorDeath ? this._actorId : this._enemyId));
        $gameVariables.setValue(targetIndex, (isActorDeath ? partyBattleMembers.indexOf(this) : enemyMembers.indexOf(this)));
        $gameVariables.setValue(targetStates, this._states);
        if (subject) {
            var isActorSubject = subject instanceof Game_Actor;
            $gameVariables.setValue(subjectId, (isActorSubject ? subject._actorId : subject._enemyId));
            $gameVariables.setValue(subjectIndex, (isActorSubject ? partyBattleMembers.indexOf(subject) : enemyMembers.indexOf(subject)));
        }
        if (actionItem) {
            $gameVariables.setValue(actionId, actionItem._itemId);
            $gameVariables.setValue(actionType, actionItem._dataClass);
        }

        $gameTemp.reserveCommonEvent(isActorDeath ? actorCommonEventId : enemyCommonEventId);
    };

    DeathCommonEvent.die = Game_BattlerBase.prototype.die;
    Game_BattlerBase.prototype.die = function() {
        this.executeDeathCommonEvents();
        DeathCommonEvent.die.call(this);
    };

    DeathCommonEvent.processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function() {
        if (shouldRunAtEndOfBattle && $gameTroop._interpreter.setupReservedCommonEvent()) { return; }
        DeathCommonEvent.processVictory.call(this);
    };
})(window);
