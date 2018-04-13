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
 * @param {string} text The initial content of the field.
 * @param {Object} opt_options An options object
 * @param {string} opt_options.directionTitle the title of the field from which
 *     to obtain direction information
 * @param {string} opt_options.direction the hardcoded direction setting
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
Blockly.FieldAngleTextInput = function(text, opt_options) {
  this.direction = opt_options.direction;
  this.directionTitle = opt_options.directionTitle;
  Blockly.FieldAngleTextInput.superClass_.constructor.call(this,
      text, Blockly.FieldTextInput.numberValidator);
};
goog.inherits(Blockly.FieldAngleTextInput, Blockly.FieldTextInput);

Blockly.FieldAngleTextInput.prototype.getFieldHelperOptions_ = function(field_helper) {
  if (field_helper === Blockly.BlockFieldHelper.ANGLE_HELPER) {
      return {
        direction: this.direction,
        directionTitle: this.directionTitle,
        block: this.sourceBlock_
      }
  }
};
