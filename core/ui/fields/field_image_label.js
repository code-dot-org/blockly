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
 * @fileoverview Non-editable text field.  Used for titles, labels, etc.
 */
'use strict';
goog.provide('Blockly.FieldImageLabel');
goog.require('Blockly.Field');
goog.require('Blockly.Tooltip');

/**
 * Class for a non-editable text field with image.
 * @param {string} text The initial content of the field.
 * @param customOptions
 * @extends {Blockly.Field}
 * @constructor
 */
Blockly.FieldImageLabel = function(text, customOptions) {
  customOptions = customOptions || {};

  this.sourceBlock_ = null;
  // Build the DOM.
  this.textElement_ = Blockly.createSvgElement('text',
    {'class': 'blocklyText'}, null);

  var loadingSize = {width: 0, height: 25};
  this.forceSize_ = customOptions.hasOwnProperty('fixedSize');
  this.forceWidth_ = this.forceSize_ && customOptions.fixedSize.width !== undefined;

  // ideally we would dynamically resize based on fontSize. instead we depend
  // on fixedSize being set if you want to also change the size
  this.fontSize_ = customOptions.fontSize;
  this.size_ = this.forceSize_ ? customOptions.fixedSize : loadingSize;
  this.fieldGroup_ = this.textElement_;
  let offset = 6 - Blockly.BlockSvg.TITLE_HEIGHT;

  this.imageElement_ = Blockly.createSvgElement('image',
    {'height': '50px',
      'width': '50px',
      'y': offset}, this.fieldGroup_);
  this.setText(text);
};
goog.inherits(Blockly.FieldImageLabel, Blockly.Field);

/**
 * Editable fields are saved by the XML renderer, non-editable fields are not.
 */
Blockly.FieldImageLabel.prototype.EDITABLE = false;

/**
 * Install the text and image on a block.
 * @param {!Blockly.Block} block The block containing this text and image.
 */
Blockly.FieldImageLabel.prototype.init = function(block) {
  if (this.sourceBlock_) {
    throw 'Text has already been initialized once.';
  }
  this.sourceBlock_ = block;
  block.getSvgRoot().appendChild(this.textElement_);
  block.getSvgRoot().appendChild(this.imageElement_);

  // Configure the field to be transparent with respect to tooltips.
  this.textElement_.tooltip = this.sourceBlock_;
  if (!this.sourceBlock_.blockSpace.blockSpaceEditor.disableTooltip) {
    Blockly.Tooltip && Blockly.Tooltip.bindMouseEvents(this.textElement_);
  }
};

/**
 * Install the image on the block.
 * @param {string} imageSrc The source for the image.
 */
Blockly.FieldImageLabel.prototype.setImage = function(imageSrc) {
  if (imageSrc === null) {
    // No change if null.
    return;
  }

  this.imageElement_.setAttributeNS('http://www.w3.org/1999/xlink',
    'xlink:href', goog.isString(imageSrc) ? imageSrc : '');
  this.imageElement_.setAttribute('src', imageSrc);
  this.refreshRender();
};
