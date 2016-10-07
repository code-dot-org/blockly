/**
 * @fileoverview Dropdown Angle input field.
 */
'use strict';

goog.provide('Blockly.FieldAngleDropdown');
goog.require('Blockly.FieldDropdown');
goog.require('Blockly.AngleHelper');

Blockly.FieldAngleDropdown = function(directionTitleName, menuGenerator, opt_changeHandler) {
  this.angleHelper;
  this.directionTitleName = directionTitleName;
  Blockly.FieldAngleDropdown.superClass_.constructor.call(this,
      menuGenerator, opt_changeHandler);
};
goog.inherits(Blockly.FieldAngleDropdown, Blockly.FieldDropdown);

Blockly.FieldAngleDropdown.prototype.showEditor_ = function() {
  var div = Blockly.WidgetDiv.DIV;

  var container = goog.dom.createDom('div', 'blocklyFieldAngleDropdown');
  div.appendChild(container);

  Blockly.FieldAngleDropdown.superClass_.showEditor_.call(this, container);

  var menuDom = this.menu_.getElement();
  var menuSize = goog.style.getSize(menuDom);
  var angleHelperHeight = menuSize.height;
  var angleHelperWidth = Math.min(menuSize.height, 150);

  container.style.height = angleHelperHeight + 'px';

  var svgContainer = goog.dom.createDom('div');
  container.appendChild(svgContainer);

  var dir = this.sourceBlock_.getTitleValue(this.directionTitleName);
  this.angleHelper = new Blockly.AngleHelper(dir, {
    onUpdate: function () {
      this.setValue(this.angleHelper.getAngle().toString());
      this.menu_.getItems().forEach(function (menuItem) {
        menuItem.setChecked(menuItem.getValue() === this.value_);
      }, this);
    }.bind(this),
    snapPoints: this.getOptions().map(function (option) {
      return parseInt(option[1]);
    }),
    arcColour: this.sourceBlock_.getHexColour(),
    height: angleHelperHeight,
    width: angleHelperWidth,
    angle: parseInt(this.getValue())
  });

  this.angleHelper.init(svgContainer);

  goog.events.listen(this.menu_, goog.ui.Component.EventType.HIGHLIGHT, function (e) {
    var menuItem = e.target;
    if (menuItem) {
      var value = menuItem.getValue();
      this.angleHelper.setAngle(parseInt(value));
    }
  }.bind(this));
  return div;
}

Blockly.FieldAngleDropdown.prototype.dispose = function() {
  if (this.angleHelper) {
    this.angleHelper.dispose();
  }
  Blockly.FieldAngleDropdown.superClass_.dispose.call(this);
};
