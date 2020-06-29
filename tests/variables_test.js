'use strict';

function setUp() {
  Blockly.Blocks.string_variables_set = {
    init: function() {
      this.appendValueInput('VALUE')
        .setStrictCheck(Blockly.BlockValueType.STRING)
        .appendTitle(
          new Blockly.FieldVariable(Blockly.Msg.VARIABLES_SET_ITEM),
          'VAR'
        );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
    },
    getVars: function() {
      return {
        String: [this.getTitleValue('VAR')]
      };
    }
  };
  Blockly.valueTypeTabShapeMap = {String: 'square'};
}

function tearDown() {
  Blockly.Blocks.string_variables_set = Blockly.valueTypeTabShapeMap = undefined;
}

function test_allVariables() {
  var container = Blockly.Test.initializeBlockSpaceEditor();

  var blockXML =
    '<xml><block type="variables_get"><title name="VAR">i</title></block></xml>';
  Blockly.Xml.domToBlockSpace(
    Blockly.mainBlockSpace,
    Blockly.Xml.textToDom(blockXML)
  );
  var variables = Blockly.Variables.allVariables();

  assertEquals('One variable used', 1, variables.length);
  assertEquals("Variable named 'i'", 'i', variables[0]);

  goog.dom.removeNode(container);
}

function test_allVariablesCategorized() {
  var container = Blockly.Test.initializeBlockSpaceEditor();

  var blockXML =
    '<xml>' +
    '<block type="variables_set"><title name="VAR">i</title></block>' +
    '<block type="string_variables_set"><title name="VAR">j</title></block>' +
    '</xml>';
  Blockly.Xml.domToBlockSpace(
    Blockly.mainBlockSpace,
    Blockly.Xml.textToDom(blockXML)
  );
  var variables = Blockly.Variables.allVariables(
    null,
    Blockly.Variables.DEFAULT_CATEGORY
  );

  assertEquals('One variable used', 1, variables.length);
  assertEquals("Variable named 'i'", 'i', variables[0]);

  goog.dom.removeNode(container);
}

function test_allVariablesOtherCategory() {
  var container = Blockly.Test.initializeBlockSpaceEditor();
  var blockXML =
    '<xml>' +
    '<block type="variables_set"><title name="VAR">i</title></block>' +
    '<block type="string_variables_set"><title name="VAR">j</title></block>' +
    '</xml>';
  Blockly.Xml.domToBlockSpace(
    Blockly.mainBlockSpace,
    Blockly.Xml.textToDom(blockXML)
  );
  var variables = Blockly.Variables.allVariables(null, 'String');

  assertEquals('One variable used', 1, variables.length);
  assertEquals("Variable named 'j'", 'j', variables[0]);

  goog.dom.removeNode(container);
}

function test_cannotRenameVariablesToEmpty() {
  var container = Blockly.Test.initializeBlockSpaceEditor();

  var blockXML =
    '<xml><block type="variables_get"><title name="VAR">i</title></block></xml>';
  Blockly.Xml.domToBlockSpace(
    Blockly.mainBlockSpace,
    Blockly.Xml.textToDom(blockXML)
  );

  Blockly.Variables.renameVariable('i', 'z', Blockly.mainBlockSpace);
  assertEquals(
    "Variable renamed to 'z'",
    'z',
    Blockly.Variables.allVariables()[0]
  );
  Blockly.Variables.renameVariable('z', '', Blockly.mainBlockSpace);
  assertEquals(
    'Cannot rename var to empty',
    'z',
    Blockly.Variables.allVariables()[0]
  );

  goog.dom.removeNode(container);
}
