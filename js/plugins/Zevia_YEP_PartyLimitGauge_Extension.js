/*:
* @plugindesc This is an extension for the Yanfly Party Limit Gauge Plugin that
* allows a user to choose whether they want to segment the limit bar or not.
* @author Zevia
*
* @help This Plugin must be placed below YEP_X_PartyLimitGauge.js.
*
* @param shouldSegment
* @text Segment Limit Bars
* @desc Whether or not the limit bar should be separated into segments for each limit level
* @type boolean
* @default false
*/

(function(module) {
    'use strict';

    module.Zevia = module.Zevia || {};
    var ZeviaYanflyPartyLimitGaugeExtension = module.Zevia.YanflyPartyLimitGaugeExtension = {};
    var shouldSegment = !!PluginManager.parameters('Zevia_YEP_PartyLimitGauge_Extension').shouldSegment.match(/true/i);

    ZeviaYanflyPartyLimitGaugeExtension.drawPartyLimitGauge = Window_Base.prototype.drawPartyLimitGauge;
    Window_Base.prototype.drawPartyLimitGauge = function(unit, x, y, w) {
        var gauges = unit.partyLimitGaugeIncrements();
        var rates = unit.partyLimitGaugeLastRates();
        var c1 = this.textColor(unit.partyLimitGaugeColor1());
        var c2 = this.textColor(unit.partyLimitGaugeColor2());
        var gw = Math.floor(this.width / gauges);
        if (gw >= 5) {
          if (shouldSegment) {
            for (var i = 0; i < gauges; ++i) {
              var rate = rates[i] || 0;
              this.drawGauge(x, y, gw, rate, c1, c2);
              x += gw;
            }
          } else {
            var rate = rates.reduce(function(allRates, currentRate) { return allRates + currentRate; }, 0) / gauges;
            this.drawGauge(x, y, w, rate, c1, c2);
          }
        } else {
          var rate = unit.partyLimitGaugeRate();
          this.drawGauge(x, y, w, rate, c1, c2);
        }
    };
})(window);
