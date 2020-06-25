/**
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Colour input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldColour');

goog.require('Blockly.Field');
goog.require('goog.ui.ColorPicker');


/**
 * Class for a colour input field.
 * @param {string} colour The initial colour in '#rrggbb' format.
 * @param {Function} opt_changeHandler A function that is executed when a new
 *     option is selected.
 * @param {Object} opt_options
 * @param {Array} opt_options.colours A list of field colors.
 * @param {Number} opt_options.columns Number of columns in the color picker.
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldColour = function(colour, opt_changeHandler, opt_options) {
  opt_options = opt_options || {};
  Blockly.FieldColour.superClass_.constructor.call(this, '\u00A0\u00A0\u00A0');

  this.changeHandler_ = opt_changeHandler;

  // Unfortunately, the code-dot-org repo violates encapsulation by modifying
  // Blockly.FieldColour.COLOURS and Blockly.FieldColour.COLUMNS directly.
  // Therefore, wait to read these values until we need to pass them to the
  // ColorPicker, rather than using them as default values here.
  this.colours_ = opt_options.colours;
  this.columns_ = opt_options.columns;

  this.borderRect_.style.fillOpacity = 1;
  // Set the initial state.
  this.setValue(colour);
};
goog.inherits(Blockly.FieldColour, Blockly.Field);

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 */
Blockly.FieldColour.prototype.CURSOR = 'default';

/**
 * Close the colour picker is this input is being deleteh
 */
Blockly.FieldColour.prototype.dispose = function() {
  Blockly.WidgetDiv.hideIfOwner(this);
  Blockly.FieldColour.superClass_.dispose.call(this);
};

/**
 * Return the current colour.
 * @return {string} Current colour in '#rrggbb' format.
 */
Blockly.FieldColour.prototype.getValue = function() {
  return this.colour_;
};

/**
 * Set the colour.
 * @param {string} colour The new colour in '#rrggbb' format.
 */
Blockly.FieldColour.prototype.setValue = function(colour) {
  this.colour_ = colour;
  this.borderRect_.style.fill = colour;
  if (this.sourceBlock_ && this.sourceBlock_.rendered) {
    this.sourceBlock_.blockSpace.fireChangeEvent();
  }
};

/**
 * Default array of colour strings for the palette.
 * See bottom of this page for the default:
 * http://docs.closure-library.googlecode.com/git/closure_goog_ui_colorpicker.js.source.html
 * @type {!Array.<string>}
 */
Blockly.FieldColour.COLOURS = goog.ui.ColorPicker.SIMPLE_GRID_COLORS;

/**
 * Default number of columns in the palette.
 */
Blockly.FieldColour.COLUMNS = 7;

/**
 * Create a palette under the colour field.
 * @private
 */
Blockly.FieldColour.prototype.showEditor_ = function() {
  this.showWidgetDiv_();
  var div = Blockly.WidgetDiv.DIV;
  // Create the palette using Closure.
  var picker = new goog.ui.ColorPicker();
  picker.setSize(this.columns_ || Blockly.FieldColour.COLUMNS);
  picker.setColors(this.colours_ || Blockly.FieldColour.COLOURS);
  picker.render(div);
  picker.setSelectedColor(this.getValue());

  this.positionWidgetDiv();

  // Configure event handler.
  var thisObj = this;
  Blockly.FieldColour.changeEventKey_ = goog.events.listen(picker,
      goog.ui.ColorPicker.EventType.CHANGE,
      function(event) {
        var colour = event.target.getSelectedColor() || '#000000';
        Blockly.WidgetDiv.hide();
        if (thisObj.changeHandler_) {
          // Call any change handler, and allow it to override.
          var override = thisObj.changeHandler_(colour);
          if (override !== undefined) {
            colour = override;
          }
        }
        if (colour !== null) {
          thisObj.setValue(colour);
        }
      });
};

/**
 * @override
 */
Blockly.FieldColour.prototype.positionWidgetDiv = function() {
  // Position the palette to line up with the field.
  var xy = Blockly.getAbsoluteXY_(/** @type {!Element} */ (this.borderRect_), this.
    getRootSVGElement_());
  if (navigator.userAgent.indexOf("MSIE") >= 0 || navigator.userAgent.indexOf("Trident") >= 0) {
      this.borderRect_.style.display = "inline";   /* reqd for IE */
      var borderBBox = {
          x: this.borderRect_.getBBox().x,
          y: this.borderRect_.getBBox().y,
          width: this.borderRect_.scrollWidth,
          height: this.borderRect_.scrollHeight
      };
  }
  else {
      var borderBBox = this.borderRect_.getBBox();
  }
  if (Blockly.RTL) {
    xy.x += borderBBox.width;
  }
  xy.y += borderBBox.height - 1;
  var div = Blockly.WidgetDiv.DIV;
  if (Blockly.RTL && div) {
    xy.x -= div.offsetWidth
  }

  var windowSize = goog.dom.getViewportSize();
  var scrollOffset = goog.style.getViewportPageOffset(document);
  Blockly.WidgetDiv.position(xy.x, xy.y, windowSize, scrollOffset);
}

/**
 * Hide the colour palette.
 * @override
 */
Blockly.FieldColour.prototype.generateWidgetDisposeHandler_ = function() {
  var superWidgetDisposeHandler_ = Blockly.FieldRectangularDropdown.superClass_.generateWidgetDisposeHandler_.call(this);
  return function() {
    superWidgetDisposeHandler_();
    if (Blockly.FieldColour.changeEventKey_) {
      goog.events.unlistenByKey(Blockly.FieldColour.changeEventKey_);
    }
  }.bind(this);
};
