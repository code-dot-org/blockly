'use strict';

goog.provide('Blockly.FieldButton');

goog.require('Blockly.Field');

var CORNER_RADIUS = 3;
var INNER_HEIGHT = 17;
var Y_OFFSET = -13;

/**
 * Class for a button field.
 * @param {string} value The initial value of the field.
 * @param {Function} buttonHandler A function that is executed when the button
 *   is clicked, must return the new value;
 * @param {Function} opt_changeHandler A function that is executed when the
 *   value is changed
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldButton = function(title, buttonHandler, color, opt_changeHandler) {
  Blockly.FieldButton.superClass_.constructor.call(this, '');

  this.changeHandler_ = opt_changeHandler;
  this.buttonHandler = buttonHandler;

  this.borderRect_.setAttribute('height', INNER_HEIGHT + 2);
  this.borderRect_.setAttribute('y', Y_OFFSET - 1);
  this.buttonElement_ = Blockly.createSvgElement('rect',
      {
        rx: CORNER_RADIUS,
        ry: CORNER_RADIUS,
        x: (-Blockly.BlockSvg.SEP_SPACE_X / 2) + 1,
        y: Y_OFFSET,
        height: INNER_HEIGHT,
      },
      this.fieldGroup_
  );
  this.fieldGroup_.insertBefore(this.buttonElement_, this.textElement_);
  this.textElement_.style.fontSize = '10pt';
  this.buttonElement_.style.fillOpacity = 1;
  this.buttonElement_.style.fill = color;
  // Set the initial state.
  this.setText(title);
};
goog.inherits(Blockly.FieldButton, Blockly.Field);

/**
 * Mouse cursor style when over the hotspot that initiates clickability.
 */
Blockly.FieldButton.prototype.CURSOR = 'pointer';

/**
 * @return {string} Current value
 */
Blockly.FieldButton.prototype.getValue = function() {
  return String(this.value_);
};

/**
 * Set the value
 * @param {string} value New value.
 */
Blockly.FieldButton.prototype.setValue = function(value) {
  if (this.value_ !== value) {
    if (this.changeHandler_) {
      // Call any change handler, and allow it to override.
      var override = this.changeHandler_(value);
      if (override !== undefined) {
        value = override;
      }
    }
    this.value_ = value;
    //this.checkElement_.style.display = newState ? 'block' : 'none';
    if (this.sourceBlock_ && this.sourceBlock_.rendered) {
      this.sourceBlock_.blockSpace.fireChangeEvent();
    }
  }
};

/**
 * Call the button handler when clicked
 * @private
 */
Blockly.FieldButton.prototype.showEditor_ = function() {
  if (!this.buttonHandler) {
    return;
  }
  this.buttonHandler(this.setValue.bind(this));
};

/**
 * Draws the border with the correct width.
 * Saves the computed width in a property.
 * @private
 */
Blockly.FieldButton.prototype.updateWidth_ = function() {
  Blockly.FieldButton.superClass_.updateWidth_.call(this);
  if (this.buttonElement_) {
    this.buttonElement_.setAttribute('width', this.size_.width + Blockly.BlockSvg.SEP_SPACE_X - 2);
  }
};

