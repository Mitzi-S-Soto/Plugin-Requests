/*:
* @plugindesc This plugin allows users to specify equipment slots on an Actor that cannot be unequipped
* in a way that would leave them empty.
* @author Zevia
*
* @help If the option to prevent all actors from unequipping items without replacing
* them is true, then this Plugin does not require any further configuration and no
* Actor will be able to unequip an item without replacing it.
* If the option is false, then within an Actor's note box, you can specify which
* slot IDs should not be unequippable without a replacement. By default, the
* slots are:
* 0: Weapon
* 1: Shield
* 2: Head
* 3: Body
* 4: Accessory
*
* So, if you wanted an Actor to always require an item in the Body slot, you would
* put <preventBlankEquip: 3>. You can prevent multiple slots by comma-separating
* each slot ID. If you want to prevent unequipping without replacements for the
* weapon and shield slot, you would put <preventBlankEquip: 0, 1>
*
* If the Prevent All Actors & Slots option is true, then the clear command will be
* removed from the equip menu.
*
* @param shouldPreventAll
* @text Prevent All Actors & Slots
* @type boolean
* @desc Whether every Actor should be unable to unequip an item without a replacement for all equipment slots.
* @default false
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var PreventBlankEquip = module.Zevia.PreventBlankEquip = {};
    var shouldPreventAll = !!PluginManager.parameters('PreventBlankEquip').shouldPreventAll.match(/true/i);

    PreventBlankEquip.shouldPreventEquip = function(actor, slotId) {
        if (shouldPreventAll) { return true; }

        var meta = $dataActors[actor._actorId].meta.preventBlankEquip;
        if (!meta) { return false; }

        var slotIds = meta.match(/\d+/g);
        if (!slotIds || !slotIds.length) { return false; }

        return slotIds.indexOf('' + slotId) !== -1;
    };

    PreventBlankEquip.onItemOk = Scene_Equip.prototype.onItemOk;
    Scene_Equip.prototype.onItemOk = function() {
        if (this._itemWindow.item() || !PreventBlankEquip.shouldPreventEquip(this._actor, this._slotWindow.index())) {
            PreventBlankEquip.onItemOk.call(this);
            return;
        }

        SoundManager.playBuzzer();
        this._itemWindow.activate();
    };

    PreventBlankEquip.clearEquipments = Game_Actor.prototype.clearEquipments;
    Game_Actor.prototype.clearEquipments = function() {
        var maxSlots = this.equipSlots().length;
        for (var i = 0; i < maxSlots; i++) {
            if (this.isEquipChangeOk(i) && !PreventBlankEquip.shouldPreventEquip(this, i)) {
                this.changeEquip(i, null);
            }
        }
    };

    PreventBlankEquip.makeCommandList = Window_EquipCommand.prototype.makeCommandList;
    Window_EquipCommand.prototype.makeCommandList = function() {
        if (!shouldPreventAll) {
            PreventBlankEquip.makeCommandList.call(this);
            return;
        }

        this.addCommand(TextManager.equip2, 'equip');
        this.addCommand(TextManager.optimize, 'optimize');
    };
})(window);
