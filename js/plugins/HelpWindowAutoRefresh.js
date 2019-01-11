/*:
* @plugindesc This plugin automatically refreshes the helpWindow when it's shown.
* @author: Zevia

* @help When the current Scene's Help Window is shown, its refresh method will
* also be called so that variable values will be recalculated.
*/

(function() {
    'use strict';

    Window_Help.prototype.show = function() {
        this.refresh();
        Window_Base.prototype.show.call(this);
    };
})();
