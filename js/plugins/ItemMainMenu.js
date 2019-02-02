/*:
* @plugindesc This Plugin overhauls the main menu to instead only show Items, Options, Save,
* and Game End. The Actor Status Window is replaced by the Item Menu.
* @author Zevia
*
* @help All Items and Key Items will now be shown in the main menu. Additionally,
* the party Status Window has been replaced with the Item Window. Hidden Items
* will continue to be hidden.
*
* Weapons and armor will no longer be accessible via the menu.
*
* Selecting items no longer opens up the party status window. Instead, a long
* description for an item is shown, pulled from the "longDesc" notetag on an
* item. For example: <longDesc: This is a longer description>
*
* Descriptions entered in the <longDesc> notetags for an item will automatically
* wrap text to fit within the width of the window. Height is not accounted for.
*
* The Description Window's dimensions and placement can be changed via the
* Plugin parameters.
*
* @param descriptionWidth
* @text Description Window Width
* @desc The Width of the Window used to show an item's long description.
* @type Number
* @default 600
*
* @param descriptionHeight
* @text Description Window Height
* @desc The Height of the Window used to show an item's long description.
* @type Number
* @default 400
*
* @param descriptionX
* @text Description Window X
* @desc The X coordinate of the top left of the description Window.
* @type Number
* @default 108
*
* @param descriptionY
* @text Description Window Y
* @desc The Y coordinate of the top left of the description Window.
* @type Number
* @default 112
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var ItemMainMenu = module.Zevia.ItemMainMenu = {};
    var STANDARD_PADDING = 5;
    var parameters = PluginManager.parameters('ItemMainMenu');
    var descriptionWidth = parseInt(parameters.descriptionWidth);
    var descriptionHeight = parseInt(parameters.descriptionHeight);
    var descriptionX = parseInt(parameters.descriptionX);
    var descriptionY = parseInt(parameters.descriptionY);

    function Window_Description() {
        this.initialize.apply(this, arguments);
    }

    Window_Description.prototype = Object.create(Window_Selectable.prototype);
    Window_Description.prototype.constructor = Window_Description;

    Window_Description.prototype.initialize = function(x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height || this.fittingHeight(2));
        this._text = '';
    };

    Window_Description.prototype.breakLines = function(text) {
        var maxWidth = this.width - 20 - (this.textPadding() * 2);
        this._text = text.split(/\s+/g).reduce(function(lines, word) {
            var line = lines[lines.length - 1];
            var concatenated = line + (line ? ' ' : '') + word;

            if (this.textWidth(concatenated) < maxWidth) {
                lines[lines.length - 1] = concatenated;
            } else {
                lines.push(word);
            }

            return lines;
        }.bind(this), ['']);
    };

    Window_Description.prototype.setText = function(text) {
        this.breakLines(text);
        this.refresh();
    };

    Window_Description.prototype.refresh = function() {
        this.contents.clear();
        this._text.forEach(function(line, index) {
            this.drawTextEx(line, this.textPadding(), 0 + (index * this.lineHeight()));
        }.bind(this));
    };

    Window_Description.prototype.processOk = function() {
        this.callOkHandler();
    };
    Window_Description.prototype.processCancel = function() {
        this.callCancelHandler();
    }

    function Window_ItemHelp() {
        this.initialize.apply(this, arguments);
    }

    Window_ItemHelp.prototype = Object.create(Window_Help.prototype);
    Window_ItemHelp.prototype.constructor = Window_ItemHelp;

    Window_ItemHelp.prototype.initialize = function(x, y, width) {
        Window_Base.prototype.initialize.call(this, x, y, width, this.fittingHeight(2));
        this._text = '';
    };

    ItemMainMenu.create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createCommandWindow();
        this.createHelpWindow();
        this.createDescriptionWindow();
        this.createItemWindow();
    };

    Scene_Menu.prototype.createHelpWindow = function() {
        this._helpWindow = new Window_ItemHelp(
            this._commandWindow.width + STANDARD_PADDING,
            0,
            Graphics.boxWidth - this._commandWindow.width - STANDARD_PADDING
        );
        this.addWindow(this._helpWindow);
    };

    Scene_Menu.prototype.createDescriptionWindow = function() {
        this._descriptionWindow = new Window_Description(
            descriptionX,
            descriptionY,
            descriptionWidth,
            descriptionHeight
        );
        this._text = '';
        this._descriptionWindow.setHandler('ok', this.closeDescription.bind(this));
        this._descriptionWindow.setHandler('cancel', this.closeDescription.bind(this));
        this.addChild(this._descriptionWindow);
        this._descriptionWindow.showBackgroundDimmer();
        this._descriptionWindow.hide();
    };

    Scene_Menu.prototype.closeDescription = function() {
        SoundManager.playCancel();
        this.activateItemWindow();
        this._descriptionWindow.deactivate();
        this._descriptionWindow.hide();
    };

    Scene_Menu.prototype.createItemWindow = function() {
        var verticalGutter = STANDARD_PADDING * 2;
        this._itemWindow = new Window_ItemList(
            this._commandWindow.width + STANDARD_PADDING,
            this._helpWindow.height + (verticalGutter),
            Graphics.boxWidth - this._commandWindow.width - STANDARD_PADDING,
            Graphics.boxHeight - this._helpWindow.height - (verticalGutter * 2)
        );
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this._itemWindow.setCategory('item');
        this.addWindow(this._itemWindow);
    };

    Scene_Menu.prototype.activateItemWindow = Scene_Item.prototype.activateItemWindow;

    ItemMainMenu.onItemOk = Scene_Menu.prototype.onItemOk;
    Scene_Menu.prototype.onItemOk = function() {
        var item = this._itemWindow.item();
        var text = item.meta.longDesc || item.description;
        SoundManager.playOk();
        this._descriptionWindow.setText(text);
        this._descriptionWindow.show();
        this._descriptionWindow.activate();
    };

    ItemMainMenu.onItemCancel = Scene_Menu.prototype.onItemCancel;
    Scene_Menu.prototype.onItemCancel = function() {
        this._itemWindow.deactivate();
        this._itemWindow.select(-1);
        this._commandWindow.activate();
        this._commandWindow.selectLast();
    };

    ItemMainMenu.start = Scene_Menu.prototype.start;
    Scene_Menu.prototype.start = function() {
        Scene_MenuBase.prototype.start.call(this);
        this._itemWindow.refresh();
    };

    ItemMainMenu.createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        this._commandWindow = new Window_MenuCommand(0, 0);
        this._commandWindow.setHandler('item', this.commandItem.bind(this));
        this._commandWindow.setHandler('options', this.commandOptions.bind(this));
        this._commandWindow.setHandler('save', this.commandSave.bind(this));
        this._commandWindow.setHandler('gameEnd', this.commandGameEnd.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    };

    ItemMainMenu.commandItem = Scene_Menu.prototype.commandItem;
    Scene_Menu.prototype.commandItem = function() {
        this.activateItemWindow();
        this._itemWindow.select(0);
    };

    ItemMainMenu.makeCommandList = Window_MenuCommand.prototype.makeCommandList;
    Window_MenuCommand.prototype.makeCommandList = function() {
        this.addMainCommands();
        this.addOptionsCommand();
        this.addSaveCommand();
        this.addGameEndCommand();
    };

    ItemMainMenu.addMainCommands = Window_MenuCommand.prototype.addMainCommands;
    Window_MenuCommand.prototype.addMainCommands = function() {
        var enabled = this.areMainCommandsEnabled();
        if (this.needsCommand('item')) {
            this.addCommand(TextManager.item, 'item', enabled);
        }
    };

    ItemMainMenu.playOkSound = Window_ItemList.prototype.playOkSound;
    Window_ItemList.prototype.playOkSound = function() {};

    ItemMainMenu.includes = Window_ItemList.prototype.includes;
    Window_ItemList.prototype.includes = function(item) {
        switch (this._category) {
        case 'item':
            return DataManager.isItem(item) && [1, 2].indexOf(item.itypeId) !== -1;
        case 'weapon':
            return DataManager.isWeapon(item);
        case 'armor':
            return DataManager.isArmor(item);
        case 'keyItem':
            return DataManager.isItem(item) && item.itypeId === 2;
        default:
            return false;
        }
    };
})(window);
