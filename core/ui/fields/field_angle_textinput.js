/**
 * @fileoverview Text input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldAngleTextInput');
goog.require('Blockly.FieldAngleTextInput');
goog.require('Blockly.AngleHelper');

/**
 * Class for an editable text field.
 * @param {string} text The initial content of the field.
 * @param {Function} opt_changeHandler An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns the accepted text or null to abort
 *     the change.
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldAngleTextInput = function(directionTitleName, text) {
  this.angleHelper;
  this.directionTitleName = directionTitleName;
  Blockly.FieldAngleTextInput.superClass_.constructor.call(this,
      text, Blockly.FieldTextInput.numberValidator);
};
goog.inherits(Blockly.FieldAngleTextInput, Blockly.FieldTextInput);

Blockly.FieldAngleTextInput.SIZE = 150;

Blockly.FieldAngleTextInput.prototype.dispose = function() {
  if (this.angleHelper) {
    this.angleHelper.dispose();
  }
  Blockly.FieldAngleTextInput.superClass_.dispose.call(this);
};

/**
 * Show the inline free-text editor on top of the text.
 * @private
 */
Blockly.FieldAngleTextInput.prototype.showEditor_ = function() {
  Blockly.FieldAngleTextInput.superClass_.showEditor_.call(this);
  var div = Blockly.WidgetDiv.DIV;

  var container = goog.dom.createDom('div', 'blocklyFieldAngleTextInput');
  container.style.height = Blockly.FieldAngleTextInput.SIZE + 'px';
  container.style.width = Blockly.FieldAngleTextInput.SIZE + 'px';
  div.appendChild(container);

  var dir = this.sourceBlock_.getTitleValue(this.directionTitleName);
  this.angleHelper = new Blockly.AngleHelper(dir, {
    onUpdate: function () {
      var value = this.angleHelper.getAngle().toString();
      this.setText(value);
      Blockly.FieldTextInput.htmlInput_.value = value;
    }.bind(this),
    arcColour: this.sourceBlock_.getHexColour(),
    height: Blockly.FieldAngleTextInput.SIZE,
    width: Blockly.FieldAngleTextInput.SIZE,
    angle: parseInt(this.getValue())
  });

  this.angleHelper.init(container);
};

Blockly.FieldAngleTextInput.prototype.onHtmlInputChange_ = function(e) {
  Blockly.FieldAngleTextInput.superClass_.onHtmlInputChange_.call(this, e);
  this.angleHelper.setAngle(parseInt(this.getText()));
};
