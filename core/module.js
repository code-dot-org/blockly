goog.require('Blockly');
goog.provide('BlocklyModule');

// Fix goog.Timer
// goog.global is set to the window object in most places where the closure
// library is used, but since we build under webpack that is not the case for
// us. goog.Timer.defaultTimerObject defaults to goog.global, but we need to
// manually set it to the window object so that it has setTimeout, setInterval,
// etc.
goog.require('goog.Timer');
goog.Timer.defaultTimerObject = window;

module.exports = Blockly;
