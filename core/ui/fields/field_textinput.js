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
 * @fileoverview Text input field.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldTextInput');

goog.require('Blockly.Field');
goog.require('Blockly.AngleHelper');
goog.require('Blockly.BlockFieldHelper');
goog.require('Blockly.Msg');
goog.require('goog.asserts');
goog.require('goog.userAgent');

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
Blockly.FieldTextInput = function(text, opt_changeHandler) {
  Blockly.FieldTextInput.superClass_.constructor.call(this, text);

  this.changeHandler_ = opt_changeHandler;
  this.angleHelper = null;
};
goog.inherits(Blockly.FieldTextInput, Blockly.Field);

/**
 * Mouse cursor style when over the hotspot that initiates the editor.
 */
Blockly.FieldTextInput.prototype.CURSOR = 'text';

Blockly.FieldTextInput.ANGLE_HELPER_SIZE = 150;

/**
 * Close the input widget if this input is being deleted.
 */
Blockly.FieldTextInput.prototype.dispose = function() {
  if (this.angleHelper) {
    this.angleHelper.dispose();
  }

  Blockly.WidgetDiv.hideIfOwner(this);
  Blockly.FieldTextInput.superClass_.dispose.call(this);
};

/**
 * Set the text in this field.
 * @param {?string} text New text.
 * @override
 */
Blockly.FieldTextInput.prototype.setText = function(text) {
  if (text === null) {
    // No change if null.
    return;
  }
  if (this.changeHandler_) {
    var validated = this.changeHandler_(text);
    // If the new text is invalid, validation returns null.
    // In this case we still want to display the illegal result.
    if (validated !== null && validated !== undefined) {
      text = validated;
    }
  }
  Blockly.Field.prototype.setText.call(this, text);
};

Blockly.FieldTextInput.prototype.shouldShowAngleHelper_ = function() {
  return this.getFieldHelperOptions_(Blockly.BlockFieldHelper.ANGLE_HELPER);
};

Blockly.FieldTextInput.prototype.getAngleHelperDirection_ = function() {
  var options = this.getFieldHelperOptions_(
    Blockly.BlockFieldHelper.ANGLE_HELPER
  );

  // direction can be set by specifying either direction or directionTitleName,
  // but not both
  if (options.direction && options.directionTitleName) {
    throw 'FieldTextInput should not have both a direction and a directionTitleName; please pass at most one of these options';
  }

  if (options.directionTitle) {
    return options.block.getTitleValue(options.directionTitle);
  } else if (options.direction) {
    return options.direction;
  }

  // Turn right (clockwise) by default.
  return 'turnRight';
};

Blockly.FieldTextInput.prototype.showAngleHelper_ = function() {
  var div = Blockly.WidgetDiv.DIV;
  var container = goog.dom.createDom('div', 'blocklyFieldAngleTextInput');
  container.style.height = Blockly.FieldTextInput.ANGLE_HELPER_SIZE + 'px';
  container.style.width = Blockly.FieldTextInput.ANGLE_HELPER_SIZE + 'px';
  div.appendChild(container);

  var options = this.getFieldHelperOptions_(
    Blockly.BlockFieldHelper.ANGLE_HELPER
  );
  var dir = this.getAngleHelperDirection_();
  var colour = options.block.getHexColour();
  this.angleHelper = new Blockly.AngleHelper(dir, {
    onUpdate: function() {
      var value = this.angleHelper.getAngle().toString();
      this.setText(value);
      Blockly.FieldTextInput.htmlInput_.value = value;
    }.bind(this),
    arcColour: colour,
    height: Blockly.FieldTextInput.ANGLE_HELPER_SIZE,
    width: Blockly.FieldTextInput.ANGLE_HELPER_SIZE,
    angle: parseInt(this.getValue()),
    enableBackgroundRotation: true
  });

  this.angleHelper.init(container);
};

/**
 * Show the inline free-text editor on top of the text.
 * @private
 */
Blockly.FieldTextInput.prototype.showEditor_ = function() {
  this.showWidgetDiv_();
  var div = Blockly.WidgetDiv.DIV;
  // Create the input.
  var htmlInput = goog.dom.createDom('input', 'blocklyHtmlInput');
  if (
    this.changeHandler_ === Blockly.FieldTextInput.numberValidator ||
    (this.changeHandler_ &&
      this.changeHandler_.validatorType === 'clampedNumberValidator')
  ) {
    htmlInput.setAttribute('type', 'number');
    htmlInput.setAttribute('step', 'any');
  } else if (
    this.changeHandler_ === Blockly.FieldTextInput.nonnegativeIntegerValidator
  ) {
    htmlInput.setAttribute('type', 'number');
    // Trigger the numeric keyboard on iOS.
    htmlInput.setAttribute('pattern', '\\d*');
  }
  Blockly.FieldTextInput.htmlInput_ = htmlInput;
  div.appendChild(htmlInput);

  htmlInput.value = htmlInput.defaultValue = this.text_;
  htmlInput.oldValue_ = null;
  this.validate_();
  this.resizeEditor_();
  htmlInput.focus();
  if (goog.userAgent.IPAD || goog.userAgent.IPHONE) {
    // input.select() does't work on mobile safari.
    htmlInput.setSelectionRange(0, 9999);
  } else {
    htmlInput.select();
  }

  // Bind to keydown -- prevent Delete from removing the block in iOS.
  htmlInput.onKeyUpWrapper_ = Blockly.bindEvent_(
    htmlInput,
    'keydown',
    this,
    function(e) {
      e.stopPropagation();
    }
  );
  // Bind to keyup -- trap Enter and Esc; resize after every keystroke.
  htmlInput.onKeyUpWrapper_ = Blockly.bindEvent_(
    htmlInput,
    'keyup',
    this,
    this.onHtmlInputChange_
  );
  // Bind to keyPress -- repeatedly resize when holding down a key.
  htmlInput.onKeyPressWrapper_ = Blockly.bindEvent_(
    htmlInput,
    'keypress',
    this,
    this.onHtmlInputChange_
  );
  var blockSpaceSvg = this.sourceBlock_.blockSpace.getCanvas();
  htmlInput.onBlockSpaceChangeWrapper_ = Blockly.bindEvent_(
    blockSpaceSvg,
    'blocklyBlockSpaceChange',
    this,
    this.resizeEditor_
  );

  if (this.shouldShowAngleHelper_()) {
    this.showAngleHelper_();
  }
};

/**
 * Handle a change to the editor.
 * @param {!Event} e Keyboard event.
 * @private
 */
Blockly.FieldTextInput.prototype.onHtmlInputChange_ = function(e) {
  var htmlInput = Blockly.FieldTextInput.htmlInput_;
  if (e.keyCode == 13) {
    // Enter
    Blockly.WidgetDiv.hide();
    // In IE9 (for some reason) the run button is getting focus at some point
    // after this, and then handling the enter event it thinks it got. Instead
    // let's prevent default so that this doesn't happen.
    e.preventDefault();
  } else if (e.keyCode == 27) {
    // Esc
    this.setText(htmlInput.defaultValue);
    Blockly.WidgetDiv.hide();
  } else {
    // Update source block.
    var text = htmlInput.value;
    if (text !== htmlInput.oldValue_) {
      htmlInput.oldValue_ = text;
      this.setText(text);
      this.validate_();
    } else if (goog.userAgent.WEBKIT) {
      // Cursor key.  Render the source block to show the caret moving.
      // Chrome only (version 26, OS X).
      this.sourceBlock_.render();
    }
  }

  if (this.angleHelper) {
    this.angleHelper.animateAngleChange(parseInt(this.getText()));
  }
};

/**
 * Check to see if the contents of the editor validates.
 * Style the editor accordingly.
 * @private
 */
Blockly.FieldTextInput.prototype.validate_ = function() {
  var valid = true;
  goog.asserts.assertObject(Blockly.FieldTextInput.htmlInput_);
  var htmlInput = /** @type {!Element} */ (Blockly.FieldTextInput.htmlInput_);
  if (this.changeHandler_) {
    valid = this.changeHandler_(htmlInput.value);
  }
  if (valid === null) {
    Blockly.addClass_(htmlInput, 'blocklyInvalidInput');
  } else {
    Blockly.removeClass_(htmlInput, 'blocklyInvalidInput');
  }
};

/**
 * Resize the editor and the underlying block to fit the text.
 * @private
 */
Blockly.FieldTextInput.prototype.resizeEditor_ = function() {
  var div = Blockly.WidgetDiv.DIV;
  var bBox;
  if (
    navigator.userAgent.indexOf('MSIE') >= 0 ||
    navigator.userAgent.indexOf('Trident') >= 0
  ) {
    this.fieldGroup_.style.display = 'inline'; /* reqd for IE */
    bBox = {
      x: this.fieldGroup_.getBBox().x,
      y: this.fieldGroup_.getBBox().y,
      width: this.fieldGroup_.scrollWidth,
      height: this.fieldGroup_.scrollHeight
    };
  } else {
    bBox = this.fieldGroup_.getBBox();
  }
  div.style.width = bBox.width + 'px';
  this.positionWidgetDiv();
};

/**
 * @override
 */
Blockly.FieldTextInput.prototype.positionWidgetDiv = function() {
  var xy = Blockly.getAbsoluteXY_(
    /** @type {!Element} */ (this.borderRect_),
    this.getRootSVGElement_()
  );
  // In RTL mode block titles and LTR input titles the left edge moves,
  // whereas the right edge is fixed.  Reposition the editor.
  if (Blockly.RTL) {
    var borderBBox;
    if (
      navigator.userAgent.indexOf('MSIE') >= 0 ||
      navigator.userAgent.indexOf('Trident') >= 0
    ) {
      this.borderRect_.style.display = 'inline'; /* reqd for IE */
      borderBBox = {
        x: this.borderRect_.getBBox().x,
        y: this.borderRect_.getBBox().y,
        width: this.borderRect_.scrollWidth,
        height: this.borderRect_.scrollHeight
      };
    } else {
      borderBBox = this.borderRect_.getBBox();
    }
    xy.x += borderBBox.width;
    xy.x -= Blockly.WidgetDiv.DIV.offsetWidth;
  }
  // Shift by a few pixels to line up exactly.
  xy.y += 1;
  if (goog.userAgent.WEBKIT) {
    xy.y -= 3;
  }

  var windowSize = goog.dom.getViewportSize();
  var scrollOffset = goog.style.getViewportPageOffset(document);
  Blockly.WidgetDiv.position(xy.x, xy.y, windowSize, scrollOffset);
};

/**
 * Close the editor, save the results, and dispose of the editable
 * text field's elements.
 * @override
 */
Blockly.FieldTextInput.prototype.generateWidgetDisposeHandler_ = function() {
  var superWidgetDisposeHandler_ = Blockly.FieldRectangularDropdown.superClass_.generateWidgetDisposeHandler_.call(
    this
  );
  return function() {
    superWidgetDisposeHandler_();
    var htmlInput = Blockly.FieldTextInput.htmlInput_;
    // Save the edit (if it validates).
    var text = htmlInput.value;
    if (this.changeHandler_) {
      text = this.changeHandler_(text);
      if (text === null) {
        // Invalid edit.
        text = htmlInput.defaultValue;
      }
    }
    this.setText(text);
    this.sourceBlock_.rendered && this.sourceBlock_.render();
    Blockly.unbindEvent_(htmlInput.onKeyUpWrapper_);
    Blockly.unbindEvent_(htmlInput.onKeyPressWrapper_);
    Blockly.unbindEvent_(htmlInput.onBlockSpaceChangeWrapper_);
    Blockly.FieldTextInput.htmlInput_ = null;
    // Delete the width property.
    Blockly.WidgetDiv.DIV.style.width = 'auto';
  }.bind(this);
};

/**
 *  @override
 */
Blockly.FieldTextInput.prototype.isKeyboardInputField_ = function() {
  return true;
};

/**
 * Ensure that only a number may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid number, or null if invalid.
 *   Returns 0 for null or empty string.
 */
Blockly.FieldTextInput.numberValidator = function(text) {
  text = text || '';
  // TODO: Handle cases like 'ten', '1.203,14', etc.
  // 'O' is sometimes mistaken for '0' by inexperienced users.
  text = text.replace(/O/gi, '0');
  // Strip out thousands separators.
  text = text.replace(/,/g, '');
  var n = parseFloat(text || 0);
  return isNaN(n) ? null : String(n);
};

/**
 * Ensure that only a nonnegative integer may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid int, or null if invalid.
 */
Blockly.FieldTextInput.nonnegativeIntegerValidator = function(text) {
  var n = Blockly.FieldTextInput.numberValidator(text);
  if (n) {
    n = String(Math.max(0, Math.floor(n)));
  }
  return n;
};

/**
 * Create a number validator that limits the number to a configured range.
 * @param {?number} min
 * @param {?number} max
 * @returns {function(*=): string}
 */
Blockly.FieldTextInput.clampedNumberValidator = function(min, max) {
  /**
   * Ensure that only a number in the configured range may be entered.
   * @param {string} text The user's text.
   * @returns {?string} A string representing a valid number in the range, or null if invalid.
   */
  var validator = function clampedNumberValidator(text) {
    var n = Blockly.FieldTextInput.numberValidator(text);
    if (!isNaN(parseFloat(min))) {
      n = Math.max(min, n);
    }
    if (!isNaN(parseFloat(max))) {
      n = Math.min(max, n);
    }
    n = String(n);
    return n;
  };
  validator.validatorType = 'clampedNumberValidator';
  return validator;
};
