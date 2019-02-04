/*:
* @plugindesc Lowers the MHP of each member in the party by a certain percentage or value
* after every battle until a script call is made to restore it to normal.
* @author Zevia
*
* @help Two modes are available for fatigue - percentage and value. When
* percentage is enabled, every battle will cause the party's MHP values
* to be reduced by a certain percentage. When value is enabled, every
* battle will cause the party's MHP values to be reduced by a flat
* value.
*
* The maximumPercentPenalty and maximumValuePenalty are the highest
* percentage or value that MHP can be reduced by before further battles
* no longer reduce MHP.
*
* In order to remove the penalty, have an event perform a script call
* with the line:
* Zevia.BattleFatigue.clearFatigue();
*
* MHP cannot be reduced below 1.
*
* @param fatigueMode
* @text Fatigue Mode
* @desc The mode to reduce MHP by - choose either percentage or value
* @type combo
* @option percentage
* @option value
* @default percentage
*
* @param --- Percentage Settings ---
* @default
*
* @param fatiguePercent
* @text Fatigue Percentage
* @desc The amount to reduce MHP by after each battle, as a percentage
* @type Number
* @max 100
* @min 1
* @default 10
*
* @param maximumPercentPenalty
* @text Maximum Fatigue Percentage
* @desc The highest percentage MHP can be reduced by
* @type Number
* @max 100
* @min 1
* @default 50
*
* @param --- Value Settings ---
* @default
*
* @param fatigueValue
* @text Fatigue Value
* @desc The amount to reduce MHP by after each battle, as a value
* @type Number
* @min 1
* @default 20
*
* @param maximumValuePenalty
* @text Maximum Fatigue Value
* @desc The highest value MHP can be reduced by
* @type Number
* @min 1
* @default 200
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var BattleFatigue = module.Zevia.BattleFatigue = {};

    var parameters = PluginManager.parameters('BattleFatigue');
    var fatigueMode = parameters.fatigueMode;
    var fatiguePercent = parseInt(parameters.fatiguePercent);
    var maximumPercentPenalty = parseInt(parameters.maximumPercentPenalty);
    var fatigueValue = parseInt(parameters.fatigueValue);
    var maximumValuePenalty = parseInt(parameters.maximumValuePenalty);

    if (maximumPercentPenalty < fatiguePercent) {
        throw new Error(
            'Configuration Error: Fatigue Percentage must be lower than the Maximum Fatigue Percentage.' +
            ' Check the Plugin Parameters for BattleFatigue'
        );
    }
    if (maximumValuePenalty < fatigueValue) {
        throw new Error(
            'Configuration Error: Fatigue Value must be lower than the Maximum Fatigue Value.' +
            ' Check the Plugin Parameters for BattleFatigue'
        );
    }
    if (fatigueMode !== 'percentage' && fatigueMode !== 'value') {
        throw new Error(
            'Configuration Error: Fatigue Mode must be either percentage or value.' +
            ' Check the Plugin Parameters for BattleFatigue'
        );
    }

    BattleFatigue.battleCount = 0;

    BattleFatigue.clearFatigue = function() {
        BattleFatigue.battleCount = 0;
    };

    BattleFatigue.actorParam = Game_Actor.prototype.param;
    Game_Actor.prototype.param = function(paramId) {
        var baseValue = BattleFatigue.actorParam.call(this, paramId);
        if (paramId !== 0) { return baseValue; }

        if (fatigueMode === 'percentage') {
            return Math.max(
                1,
                (baseValue * (1 - (Math.min(BattleFatigue.battleCount * fatiguePercent, maximumPercentPenalty) * 0.01)))
            );
        } else {
            return Math.max(
                1,
                (baseValue - (Math.min(BattleFatigue.battleCount * fatigueValue, maximumValuePenalty)))
            );
        }
    };

    BattleFatigue.endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        BattleFatigue.battleCount++;
        BattleFatigue.endBattle.call(this, result);
    };
})(window);
