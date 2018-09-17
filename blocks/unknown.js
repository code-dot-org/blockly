'use strict';

goog.provide('Blockly.Blocks.unknown');

goog.require('Blockly.Blocks');

/** @export */
Blockly.Blocks.unknown = {
  unknownBlock: true,
  init: function() {
    this.setHSV(0, 0, 0.8);
  }
};
