'use strict';

goog.provide('Blockly.Blocks.unknown');

goog.require('Blockly.Blocks');

Blockly.Blocks.unknown = {
  init: function() {
    this.setHSV(0, 0, 0.8);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};
