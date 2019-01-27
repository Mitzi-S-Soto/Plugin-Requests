/*:
* @plugindesc This is an extension to SumRndmDde's SkillExtender Plugin to allow for
* infinitely extending skill windows.
* @author Zevia
*
* @help This Plugin should be placed BELOW SRD_SkillExtender. If you extend a skill
* with skills that have extensions, it will continue opening new skill windows
* until you get to a skill that does not extend other skills.
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var ZeviaSkillExtenderExtension = module.Zevia.SkillExtenderExtension = {};

    ZeviaSkillExtenderExtension.onSelectAction = Scene_Battle.prototype.onSelectAction;
    Scene_Battle.prototype.onSelectAction = function() {
        var action = BattleManager.inputtingAction();
        if (!action || !action._item || !action._item._itemId) {
            ZeviaSkillExtenderExtension.onSelectAction.apply(this, arguments);
            return;
        }

        var skill = $dataSkills[action._item._itemId];
        if (skill._se_extendSkills) {
            this.openSkillExtendWindow(skill);
            return;
        }

        ZeviaSkillExtenderExtension.onSelectAction.apply(this, arguments);
    };

    ZeviaSkillExtenderExtension = Scene_Skill.prototype.onItemOk;
    Scene_Skill.prototype.onItemOk = function() {
        var item = this.item();
        if (item._se_extendSkills) {
            this.openSkillExtendWindow(item);
            return;
        }

        ZeviaSkillExtenderExtension.apply(this, arguments);
    };
})(window);
