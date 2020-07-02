/* global G_testRunner */
/* eslint-disable no-unused-vars */
goog.require('Blockly.Test');
goog.require('goog.testing.jsunit');

var karma;
function setUpPage() {
  karma.info({total: G_testRunner.testCase.getCount()});
}

var numErrors = 0;
function tearDown() {
  var errors = G_testRunner.testCase.result_.errors;
  var success = errors.length === numErrors;
  numErrors = errors.length;
  var lastError = errors[errors.length - 1];
  karma.result({
    description: G_testRunner.testCase.curTest_.name,
    success: success,
    suite: ['Blockly'],
    log: success
      ? []
      : [lastError.message].concat(lastError.stack.split('\n').slice(0, 3))
  });
}

function tearDownPage() {
  karma.complete({coverage: window.__coverage__});
}

window.karmaCustomEnv = {
  execute: function(k) {
    karma = k;
  }
};
