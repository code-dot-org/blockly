/**
 * @fileoverview special Text Input field that always shows angle helper
 * @author elijah@code.org (Elijah Hamovitz)
 */
'use strict';

goog.provide('Blockly.FieldAngleTextInput');

goog.require('Blockly.AngleHelper');
goog.require('Blockly.BlockFieldHelper');
goog.require('Blockly.FieldTextInput');

/**
 * Class for an editable text field which will always show the Angle Helper
 * @param {string} directionTitle the title of the field from which to obtain
 *        direction information
 * @param {string} text The initial content of the field.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
Blockly.FieldAngleTextInput = function(directionTitle, text) {
  this.directionTitle = directionTitle;
  Blockly.FieldAngleTextInput.superClass_.constructor.call(this,
      text, Blockly.FieldTextInput.numberValidator);
};
goog.inherits(Blockly.FieldAngleTextInput, Blockly.FieldTextInput);

Blockly.FieldAngleTextInput.prototype.getFieldHelperOptions_ = function(field_helper) {
  if (field_helper === Blockly.BlockFieldHelper.ANGLE_HELPER) {
      return {
        directionTitle: this.directionTitle,
        block: this.sourceBlock_
      }
  }
};
