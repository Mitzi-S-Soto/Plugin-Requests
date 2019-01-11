/*:
* @plugindesc This is a tool that can be used by developers to create a window that just
* contains state icons for a given battler (Actors or Enemies).
* @author Zevia
*
* @help Create a new Zevia.Window_StatusIconList, passing in the battler whose state
* icons you want to display, the x-coordinate of the window, the y-coordinate, and
* the width of the window.
*
* For the number of rows specified in configuration, an icon will be drawn as long
* as it will fit on the row. If it won't, it will go to the next row, until the
* number of rows has been filled. At that point, no more icons will be drawn.
*
* Example:
* var harold = $gameParty.battleMembers()[0];
* var haroldIcons = new Zevia.Window_StatusIconList(harold, 0, 0, 150);
* SceneManager._scene.addWindow(haroldIcons);
*
* To refresh the window, call the refresh() method.

* @param iconWidth
* @text Icon width
* @type number
* @desc The width of the icons you want to display, in pixels.
* @default 28
*
* @param iconHeight
* @text Icon height
* @type number
* @desc The height of the icons you want to display, in pixels.
* @default 28

* @param maxRows
* @text Number of rows
* @type number
* @desc The number of rows of icons you want to display.
* @default 1
*
* @param padding
* @text Window padding
* @type number
* @desc The amount of extra space you want from the edges of the window to where the icons are drawn
* @default 0
*
* @param hasBackground
* @text Show Windowskin
* @type boolean
* @desc Whether or not the icons should use the base Windowskin or be transparent
* @default false
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var parameters = PluginManager.parameters('StateIconWindow');
    var iconWidth = parseInt(parameters.iconWidth);
    var iconHeight = parseInt(parameters.iconHeight);
    var maxRows = parseInt(parameters.maxRows);
    var padding = parseInt(parameters.padding);
    var hasBackground = !!parameters.hasBackground.match(/true/i);

    if (isNaN(iconWidth)) { iconWidth = 28; }
    if (isNaN(iconHeight)) { iconHeight = 28; }
    if (isNaN(maxRows)) { maxRows = 1; }
    if (isNaN(padding)) { padding = 8; }

    var Window_StatusIconList = module.Zevia.Window_StatusIconList = function() {
        this.initialize.apply(this, arguments);
    };

    Window_StatusIconList.prototype = Object.create(Window_Base.prototype);
    Window_StatusIconList.prototype.constructor = Window_StatusIconList;

    Window_StatusIconList.prototype.initialize = function(battler, x, y, width) {
        var height = (this.lineHeight() * maxRows) + (this.standardPadding() * 2);
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this._battler = battler;
        this.opacity = hasBackground ? 255 : 0;
        this.deactivate();
        this.refresh();
    };

    Window_StatusIconList.prototype.standardPadding = function() {
        return padding;
    };

    Window_StatusIconList.prototype.canFitIcon = function(row) {
        return ((row.length + 1) * iconWidth) < this.contentsWidth();
    };

    Window_StatusIconList.prototype.setDisplayedIcons = function() {
        this._displayedIcons = this._battler.allIcons().reduce(function(iconRows, icon) {
            var availableRow = iconRows.find(function(row) {
                return this.canFitIcon(row);
            }.bind(this));
            if (availableRow) { availableRow.push(icon); }
            else {
                if (iconRows.length === maxRows) { return iconRows; }
                iconRows.push([icon]);
            }
            return iconRows;
        }.bind(this), []);
    };

    Window_StatusIconList.prototype.drawStateIcon = function(iconIndex, x, y, width, height) {
        this.contents.blt(
            ImageManager.loadSystem('IconSet'),
            iconIndex % 16 * Window_Base._iconWidth,
            Math.floor(iconIndex / 16) * Window_Base._iconHeight,
            Window_Base._iconWidth,
            Window_Base._iconHeight,
            x,
            y,
            width,
            height
        );
    };

    Window_StatusIconList.prototype.drawStateIcons = function() {
        this._displayedIcons.forEach(function(iconRow, row) {
            iconRow.forEach(function(icon, column) {
                this.drawStateIcon(
                    icon,
                    iconWidth * column,
                    iconHeight * row,
                    iconWidth,
                    iconHeight
                );
            }.bind(this));
        }.bind(this));
    };

    Window_StatusIconList.prototype.refresh = function() {
        this.setDisplayedIcons();
        this.contents.clear();
        this.drawStateIcons();
    };
})(window);
