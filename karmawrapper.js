goog.require('Blockly.Test');
goog.require('goog.testing.jsunit');

let karma;
function setUpPage() {
  karma.info({ total: G_testRunner.testCase.getCount() });
}

let numErrors = 0;
function tearDown() {
  const errors = G_testRunner.testCase.result_.errors;
  const success = errors.length === numErrors;
  numErrors = errors.length;
  const lastError = errors[errors.length - 1];
  karma.result({
    description: G_testRunner.testCase.curTest_.name,
    success,
    suite: ['Blockly'],
    log: success ? [] : [
      lastError.message,
      ...lastError.stack.split('\n').slice(0, 3)
    ],
  });
}

function tearDownPage() {
  karma.complete({});
}

window.karmaCustomEnv = {
  execute: function (k) {
    karma = k;
  },
};
