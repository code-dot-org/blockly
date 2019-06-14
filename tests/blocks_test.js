/**
 * Visual Blocks Editor
 *
 * Copyright 2011 Google Inc.
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

/* global Blockly, goog */
/* global assert, assertNull, assertNotNull, assertEquals, assertFalse */
'use strict';

function test_setBlockNotDisconnectable() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();

  var blockSpace = Blockly.mainBlockSpace;
  var block1 = new Blockly.Block(blockSpace);
  block1.setFunctional(true);
  block1.initSvg();
  var block2 = new Blockly.Block(blockSpace);
  block2.initSvg();
  block2.setFunctionalOutput(true);
  assertNotNull(block1);
  assertEquals(2, blockSpace.topBlocks_.length);

  var inputName = "myInputName";
  block1.appendFunctionalInput(inputName);
  block1.attachBlockToInputName(block2, inputName);
  block2.setCanDisconnectFromParent(false);
  assertFalse(block2.canDisconnectFromParent());

  goog.dom.removeNode(containerDiv);
}

function assertConnectionAllowed(connection1, connection2) {
  assertTrue(connection1.checkAllowedConnectionType_(connection2));
  assertTrue(connection2.checkAllowedConnectionType_(connection1));
}

function assertConnectionNotAllowed(connection1, connection2) {
  assertFalse(connection1.checkAllowedConnectionType_(connection2));
  assertFalse(connection2.checkAllowedConnectionType_(connection1));
}

function test_checkAllowedConnectionType() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();

  var blockSpace = Blockly.mainBlockSpace;

  var strictOutputBlock = new Blockly.Block(blockSpace);
  strictOutputBlock.initSvg();
  strictOutputBlock.setStrictOutput(true, Blockly.BlockValueType.SPRITE);
  var strictOutput = strictOutputBlock.outputConnection;

  var nonStrictOutputBlock = new Blockly.Block(blockSpace);
  nonStrictOutputBlock.initSvg();
  nonStrictOutputBlock.setOutput(true, Blockly.BlockValueType.SPRITE);
  var nonStrictOutput = nonStrictOutputBlock.outputConnection;

  var otherTypeOutputBlock = new Blockly.Block(blockSpace);
  otherTypeOutputBlock.initSvg();
  otherTypeOutputBlock.setOutput(true, Blockly.BlockValueType.NUMBER);
  var otherTypeOutput = otherTypeOutputBlock.outputConnection;

  var noneTypeOutputBlock = new Blockly.Block(blockSpace);
  noneTypeOutputBlock.initSvg();
  noneTypeOutputBlock.setOutput(true);
  var noneTypeOutput = noneTypeOutputBlock.outputConnection;

  var strictInputBlock = new Blockly.Block(blockSpace);
  strictInputBlock.initSvg();
  strictInputBlock.appendValueInput('VALUE')
      .setStrictCheck(Blockly.BlockValueType.SPRITE);
  var strictInput = strictInputBlock.inputList[0].connection;

  var nonStrictInputBlock = new Blockly.Block(blockSpace);
  nonStrictInputBlock.initSvg();
  nonStrictInputBlock.appendValueInput('VALUE')
      .setCheck(Blockly.BlockValueType.SPRITE);
  var nonStrictInput = nonStrictInputBlock.inputList[0].connection;

  var otherTypeInputBlock = new Blockly.Block(blockSpace);
  otherTypeInputBlock.initSvg();
  otherTypeInputBlock.appendValueInput('VALUE')
      .setCheck(Blockly.BlockValueType.NUMBER);
  var otherTypeInput = otherTypeInputBlock.inputList[0].connection;

  var noneTypeInputBlock = new Blockly.Block(blockSpace);
  noneTypeInputBlock.initSvg();
  noneTypeInputBlock.appendValueInput('VALUE');
  var noneTypeInput = noneTypeInputBlock.inputList[0].connection;

  assertConnectionAllowed(strictOutput, strictInput);
  assertConnectionAllowed(strictOutput, nonStrictInput);
  assertConnectionNotAllowed(strictOutput, otherTypeInput);
  assertConnectionNotAllowed(strictOutput, noneTypeInput);

  assertConnectionAllowed(nonStrictOutput, strictInput);
  assertConnectionAllowed(nonStrictOutput, nonStrictInput);
  assertConnectionNotAllowed(nonStrictOutput, otherTypeInput);
  assertConnectionAllowed(nonStrictOutput, noneTypeInput);

  assertConnectionNotAllowed(otherTypeOutput, strictInput);
  assertConnectionNotAllowed(otherTypeOutput, nonStrictInput);
  assertConnectionAllowed(otherTypeOutput, otherTypeInput);
  assertConnectionAllowed(otherTypeOutput, noneTypeInput);

  assertConnectionNotAllowed(noneTypeOutput, strictInput);
  assertConnectionAllowed(noneTypeOutput, nonStrictInput);
  assertConnectionAllowed(noneTypeOutput, otherTypeInput);
  assertConnectionAllowed(noneTypeOutput, noneTypeInput);

  goog.dom.removeNode(containerDiv);
}

function test_clickIntoEditableUnmovableBlock() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();

  var blockSpace = Blockly.mainBlockSpace;
  var unmovableButEditable = ''+
      '<xml>' +
      '  <block type="math_number" movable="false">' +
      '    <title name="NUM">0</title>' +
      '  </block>' +
      '</xml>';

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
      unmovableButEditable));

  var inputText = goog.dom.getElementByClass('blocklyText');

  Blockly.fireTestClickSequence(inputText);

  assertNotNull("input should show up when editable field is clicked",
      goog.dom.getElementByClass('blocklyHtmlInput'));

  goog.dom.removeNode(containerDiv);
}

function test_setBlockNextConnectionDisabled() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();

  var blockSpace = Blockly.mainBlockSpace;
  var single_block_next_connection_default = ''+
      '<xml>' +
        '<block type="math_change">' +
          '<title name="VAR">i</title>' +
        '</block>' +
      '</xml>';

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
      single_block_next_connection_default));

  var block = blockSpace.getTopBlocks()[0];

  assert(block instanceof Blockly.Block);
  assertNotNull(block.nextConnection);
  assert(block.nextConnection instanceof Blockly.Connection);
  assert(block.nextConnectionDisabled_ === false);

  var single_block_next_connection_enabled = ''+
      '<xml>' +
      '  <block type="math_change" next_connection_disabled="false">' +
      '    <title name="VAR">j</title>' +
      '  </block>' +
      '</xml>';

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
      single_block_next_connection_enabled));

  block = blockSpace.getTopBlocks()[1];

  assert(block instanceof Blockly.Block);
  assertNotNull(block.nextConnection);
  assert(block.nextConnection instanceof Blockly.Connection);
  assert(block.nextConnectionDisabled_ === false);

  var single_block_next_connection_disabled = ''+
      '<xml>' +
      '  <block type="math_change" next_connection_disabled="true">' +
      '    <title name="VAR">k</title>' +
      '  </block>' +
      '</xml>';

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
      single_block_next_connection_disabled));

  block = blockSpace.getTopBlocks()[2];

  assert(block instanceof Blockly.Block);
  assert(block.nextConnectionDisabled_ === true);
  assertNull(block.nextConnection);

  goog.dom.removeNode(containerDiv);
}

function test_visibleThroughParent() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
    '<xml>' +
      '<block type="math_change">' +
        '<title name="VAR">i</title>' +
        '<next>' +
          '<block type="math_change">' +
            '<title name="VAR">j</title>' +
          '</block>' +
        '</next>' +
      '</block>' +
    '</xml>'
  ));

  var parentBlock = blockSpace.getTopBlocks()[0];
  var childBlock = parentBlock.getChildren()[0];

  assert(parentBlock.isVisible() === true);
  assert(childBlock.isVisible() === true);

  parentBlock.setCurrentlyHidden(true);

  assert(parentBlock.isVisible() === false);
  assert(childBlock.isVisible() === false);

  goog.dom.removeNode(containerDiv);
}

function test_isVisible() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
    '<xml>' +
      '<block type="math_change">' +
        '<title name="VAR">k</title>' +
      '</block>' +
    '</xml>'
  ));
  var block = blockSpace.getTopBlocks()[0];

  // block defaults to visible
  assert(block.isVisible() === true);

  // hide the block, and it's invisible
  block.setCurrentlyHidden(true);
  assert(block.isVisible() === false);

  // unhide the block, make it invisible to users, and it's invisible
  block.setCurrentlyHidden(false);
  block.setUserVisible(false);
  assert(block.isVisible() === false);

  // cache the original editBlocks state, change Blockly to edit mode,
  // and it becomes visible again
  var original_editBlocks_state = Blockly.editBlocks;
  Blockly.editBlocks = 'start_blocks';
  assert(block.isVisible() === true);

  // while still in edit mode, hide it, and it becomes invisible
  block.setCurrentlyHidden(true);
  assert(block.isVisible() === false);

  // finally, restore the editBlocks state to avoid polluting future
  // tests
  Blockly.editBlocks = original_editBlocks_state;

  goog.dom.removeNode(containerDiv);
}

function test_blockSetIsUnused() {
  var orig = Blockly.showUnusedBlocks;

  var i, block;

  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  var blockXml = [
    '<block type="controls_whileUntil" />',
    '<block type="variables_set" uservisible="false" />',
    '<block type="functional_definition" />',
  ];

  Blockly.Xml.domToBlockSpace(blockSpace,
      Blockly.Xml.textToDom('<xml>' + blockXml.join('') + '</xml>'));

  var blocks = blockSpace.getTopBlocks();
  assertEquals(3, blocks.length);

  Blockly.showUnusedBlocks = false;
  for (i = 0; i < blocks.length; i++) {
    block = blocks[i];
    block.setIsUnused();
    assertEquals(false, block.isUnused());
  }

  Blockly.showUnusedBlocks = true;
  var expectedResults = [true, false, false];
  for (i = 0; i < blocks.length; i++) {
    block = blocks[i];
    var expectedResult = expectedResults[i];
    block.setIsUnused();
    assertEquals(expectedResult, block.isUnused());
  }

  goog.dom.removeNode(containerDiv);
  Blockly.showUnusedBlocks = orig;
}

function test_unknownLanguageBlocks() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;
  var lastEvent = null;

  window.addEventListener('unknownBlock', function (e) {
    lastEvent = e;
  });

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
    '<xml>' +
      '<block type="not_a_real_block" movable="false">' +
        '<statement name="DO">' +
          '<block type="math_change" movable="false"/>' +
        '</statement>' +
        '<next>' +
          '<block type="math_change" movable="false">' +
            '<next>' +
            '<block type="math_change" movable="false"/>' +
            '</next>' +
          '</block>' +
        '</next>' +
      '</block>' +
    '</xml>'
  ));

  assertEquals('not_a_real_block', lastEvent.name);

  var unknownBlock = blockSpace.getTopBlocks()[0];
  var statementBlock = unknownBlock.getChildren()[0];
  var firstNextBlock = unknownBlock.getChildren()[1];
  var secondNextBlock = firstNextBlock.getChildren()[0];

  assert(unknownBlock.isMovable() === true);
  assert(statementBlock.isMovable() === true);
  assert(firstNextBlock.isMovable() === true);
  assert(secondNextBlock.isMovable() === false);

  goog.dom.removeNode(containerDiv);
}

function test_typedParams() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
    '<xml>' +
      '<block type="procedures_defnoreturn">' +
        '<mutation>' +
          '<arg name="x" type="Number"></arg>' +
          '<arg name="y" type="Number"></arg>' +
        '</mutation>' +
        '<title name="NAME">do something</title>' +
      '</block>' +
      '<block type="procedures_callnoreturn" inline="false">' +
        '<mutation name="do something">' +
          '<arg name="x" type="Number"></arg>' +
          '<arg name="y" type="Number"></arg>' +
        '</mutation>' +
      '</block>' +
    '</xml>'
  ));

  var blocks = Blockly.mainBlockSpace.getTopBlocks();
  var definition = blocks[0];
  var call = blocks[1];

  definition.updateParamsFromArrays(['abc', 'def'], [1, 2], ['String', 'Sprite']);

  var procInfo = definition.getProcedureInfo();

  assert(goog.array.equals(['abc', 'def'], procInfo.parameterNames));
  assert(goog.array.equals(['String', 'Sprite'], procInfo.parameterTypes));
  assert(goog.array.equals(['String', 'Sprite'], call.currentParameterTypes_));

  goog.dom.removeNode(containerDiv);
}

function test_shouldCopyOnDrag() {
  let containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  let blockSpace = Blockly.mainBlockSpace;
  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
    '<xml>' +
      '<block type="parent">' +
        '<value name="CLICK">' +
          '<block type="child">' +
          '</block>' +
        '</value>' +
      '</block>' +
      '<block type="orphan"></block>' +
    '</xml>'
  ));
  let blocks = blockSpace.getTopBlocks();
  assertEquals(2, blocks.length);

  let parentBlock = blockSpace.getTopBlocks()[0];
  let childBlock = parentBlock.getChildren()[0];
  let orphanBlock = blockSpace.getTopBlocks()[1];

  childBlock.setParentForCopyOnDrag('parent');
  orphanBlock.setParentForCopyOnDrag('parent');

  assert(childBlock.shouldCopyOnDrag());
  assertFalse(orphanBlock.shouldCopyOnDrag());

  // Should copy when pulled out of the parent block.
  assertEquals(3, blockSpace.getAllBlocks().length);
  Blockly.Test.simulateDrag(childBlock, {x: 100, y: 100});
  assertEquals(4, blockSpace.getAllBlocks().length);

  goog.dom.removeNode(containerDiv);
}

function test_connectTwoBlocks() {
  let containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  let blockSpace = Blockly.mainBlockSpace;
  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(`
    <xml>
      <block type="variables_set"></block>
      <block type="colour_picker"></block>
    </xml>
  `));

  const target = blockSpace.getTopBlocks()[0];
  const orphan = blockSpace.getTopBlocks()[1];

  assertNull(orphan.getParent());
  Blockly.Test.simulateDrag(orphan, target.getInput('VALUE').connection);
  assertEquals(target, orphan.getParent());

  goog.dom.removeNode(containerDiv);
}

function test_shouldShadow() {
  let containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  let blockSpace = Blockly.mainBlockSpace;
  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(`
    <xml>
      <block type="parent">
        <value name="CLICK">
          <block type="child"></block>
        </value>
        <next>
          <block type="variables_set"></block>
        </next>
      </block>
    </xml>
  `));
  let blocks = blockSpace.getTopBlocks();
  assertEquals(1, blocks.length);

  let parentBlock = blockSpace.getTopBlocks()[0];
  let childBlock = parentBlock.getChildren()[0];

  childBlock.setParentForCopyOnDrag('parent');

  goog.dom.removeNode(containerDiv);
}
