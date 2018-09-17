/**
 * @fileoverview Set of types for block connections
 */
'use strict';

goog.provide('Blockly.BlockValueType');

/**
 * Enum of block types. Used for e.g., configuring allowable input connections
 * and occasionally block coloring
 * @enum {string}
 * @export
 */
Blockly.BlockValueType = {
  /** @export */ NONE: 'None', // Typically as a connection/input check means "accepts any type"
  /** @export */ STRING: 'String',
  /** @export */ NUMBER: 'Number',
  /** @export */ IMAGE: 'Image',
  /** @export */ BOOLEAN: 'Boolean',
  /** @export */ FUNCTION: 'Function',
  /** @export */ COLOUR: 'Colour',
  /** @export */ ARRAY: 'Array',

  /**
   * p5.play Sprite
   * @export
   */
  SPRITE: 'Sprite',

  /**
   * {Object} Behavior
   * {function} Behavior.func
   * {Array} Behavior.extraArgs
   * @export
   */
  BEHAVIOR: 'Behavior',

  /**
   * {Object} Location
   * {number} Location.x
   * {number} Location.y
   * @export
   */
  LOCATION: 'Location',
};
