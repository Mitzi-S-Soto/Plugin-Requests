/*:
* @plugindesc Allows the user to add a state by ID to a random living enemy in a troop.
* @author Zevia
*
* @help In a script command, call "$gameTroop.addStateRandomly(x)", where x is the ID of
* the state you want to add.
*
* @param shouldFilter
* @type boolean
* @desc Whether enemies already afflicted should be ignored. If true and all living enemies are afflicted, nothing happens.
* @default true
*/

(function() {
    'use strict';

    var shouldFilter = !!PluginManager.parameters('AddStateRandomly').shouldFilter.match(/true/i);

    Game_Troop.prototype.addStateRandomly = function(stateId) {
        var aliveEnemies = this.aliveMembers().filter(function(enemy) {
            return !shouldFilter || !enemy.isStateAffected(stateId);
        });

        if (!aliveEnemies.length) { return; }
        aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)].addState(stateId);
    };
})();
