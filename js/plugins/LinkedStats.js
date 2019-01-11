/*:
* @plugindesc This plugin allows a user to modify stats on Classes or Enemies based on other stats.
* For example, raising maximum HP by a percentage of their defense.
* @author Zevia
*
* @help In a class or enemy's note box, put <link firstStat: x secondStat>,
* where firstStat is the stat you want to increase, secondStat is the stat you
* want to reference to increase the first stat by, and x is the percentage you
* want to increase based on the secondStat.
*
* As an example, <link mhp: 50 def> would translate to "increase this class's
* maximum hp by 50% of the class's defense".
*
* You can tie multiple stats to one stat by separating them with commas.
* For example, <link mhp: 50 def, 40 luk> would mean, "increase this
* class's maximum hp by 50% of the class's defense and 40% of the class's
* luck".
*
* If you want to be able to define a class or enemy's entire stat in relation
* to another stat, you can change the minimums of their stats. As an example,
* if you want a class's maximum HP to be solely dependent on their DEF and
* LUK, you can change the minimum HP parameter to 0, then do <link mhp: x def, y luk>
*
* @param mhp
* @text HP minimum
* @type number
* @desc The minimum value for HP. By default, it's 1.
* @default 1
*
* @param mmp
* @text MP minimum
* @type number
* @desc The minimum value for MP. By default, it's 0.
* @default 0
*
* @param atk
* @text ATK minimum
* @type number
* @desc The minimum value for ATK. By default, it's 1.
* @default 1
*
* @param def
* @text DEF minimum
* @type number
* @desc The minimum value for DEF. By default, it's 1.
* @default 1
*
* @param mat
* @text MAT minimum
* @type number
* @desc The minimum value for MAT. By default, it's 1.
* @default 1
*
* @param mdf
* @text MDF minimum
* @type number
* @desc The minimum value for MDF. By default, it's 1.
* @default 1
*
* @param agi
* @text AGI minimum
* @type number
* @desc The minimum value for AGI. By default, it's 1.
* @default 1
*
* @param luk
* @text LUK minimum
* @type number
* @desc The minimum value for LUK. By default, it's 1.
* @default 1
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var LinkedStats = module.Zevia.LinkedStats = {};
    var LINK_MATCH = 'link\\s+';

    var params = ['mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
    var parameters = PluginManager.parameters('LinkedStats');
    var minimums = params.reduce(function(paramMinimums, param) {
        var minimumParam = parseInt(parameters[param]);
        if (isNaN(minimumParam)) {
            if (param === 'mmp') { paramMinimums[param] = 0; }
            else { paramMinimums[param] = 1; }
        }

        paramMinimums[param] = minimumParam;
        return paramMinimums;
    }, {});

    LinkedStats.getLinkedStats = function(meta, paramId) {
        if (!meta || !params[paramId]) { return; }

        var regExp = new RegExp(LINK_MATCH + params[paramId], 'i');
        return meta[Object.keys(meta).find(function(key) {
            return key.match(regExp);
        })];
    };

    LinkedStats.getValues = function(values) {
        if (!values) { return; }

        return values.split(',').map(function(value) {
            var percentage = value.match(/\d+/);
            if (!percentage) { return; }

            var linkedMatch = value.match(/[a-zA-Z]+/);
            if (!linkedMatch) { return; }

            var linkedStat = params.find(function(param) {
                return param === linkedMatch[0];
            });
            if (!linkedStat) { return; }

            return {
                stat: linkedStat,
                percentage: percentage[0]
            };
        });
    };

    LinkedStats.getMinimumValue = function(value, paramId) {
        if (value === 1 && minimums[params[paramId]] === 0) { return 0; }
        return value;
    };

    LinkedStats.paramMin = Game_BattlerBase.prototype.paramMin;
    Game_BattlerBase.prototype.paramMin = function(paramId) {
        return minimums[params[paramId]];
    };

    LinkedStats.actorParamBase = Game_Actor.prototype.paramBase;
    Game_Actor.prototype.paramBase = function(paramId) {
        return LinkedStats.getMinimumValue(LinkedStats.actorParamBase.call(this, paramId), paramId);
    };

    LinkedStats.enemyParamBase = Game_Enemy.prototype.paramBase;
    Game_Enemy.prototype.paramBase = function(paramId) {
        return LinkedStats.getMinimumValue(LinkedStats.enemyParamBase.call(this, paramId), paramId);
    };

    LinkedStats.param = Game_BattlerBase.prototype.param;
    Game_BattlerBase.prototype.param = function(paramId) {
        var meta = this instanceof Game_Actor ? this.currentClass().meta : $dataEnemies[this._enemyId].meta;
        var value = LinkedStats.param.call(this, paramId);

        var linkedStats = LinkedStats.getLinkedStats(meta, paramId);
        if (!linkedStats || !linkedStats.length) { return value; }

        var linkedValues = LinkedStats.getValues(linkedStats);
        if (!linkedValues || !linkedValues.length) { return value; }

        return value + linkedValues.reduce(function(total, linkedValue) {
            if (!linkedValue.stat || !linkedValue.percentage) { return total; }
            return total += Math.round((this[linkedValue.stat] * (parseInt(linkedValue.percentage) / 100)));
        }.bind(this), 0);
    };

    LinkedStats.actorParam = Game_Actor.prototype.param;
    Game_Actor.prototype.param = Game_BattlerBase.prototype.param;

    LinkedStats.enemyParam = Game_Enemy.prototype.param;
    Game_Enemy.prototype.param = Game_BattlerBase.prototype.param;
})(window);
