/* global Blockly, goog */
/* global assert, assertNull, assertNotNull, assertEquals, assertFalse */
'use strict';

function test_field_scroll_listener() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  // We begin with no onscroll listeners
  assertEquals(0, blockSpace.events.getListeners(Blockly.BlockSpace.EVENTS.BLOCK_SPACE_SCROLLED, false).length);

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
      '<xml>' +
      '  <block type="math_number">' +
      '    <title name="NUM">0</title>' +
      '  </block>' +
      '</xml>'));

  var block = blockSpace.getTopBlocks()[0];
  var field = block.getTitle_("NUM");

  // Still none after creation of block with field
  assertEquals(0, blockSpace.events.getListeners(Blockly.BlockSpace.EVENTS.BLOCK_SPACE_SCROLLED, false).length);

  // The field also has no internal knowledge of listeners
  assertEquals(undefined, field.blockSpaceScrolledListenKey_);

  // Open the field!
  Blockly.fireTestClickSequence(field.fieldGroup_);

  // We now have both a listener and a listener key
  assert(field.blockSpaceScrolledListenKey_ != undefined);
  assertEquals(1, blockSpace.events.getListeners(Blockly.BlockSpace.EVENTS.BLOCK_SPACE_SCROLLED, false).length);

  // Close the field
  Blockly.fireTestClickSequence(blockSpace.svgGroup_);

  // Listener and key are now both gone
  assertEquals(0, blockSpace.events.getListeners(Blockly.BlockSpace.EVENTS.BLOCK_SPACE_SCROLLED, false).length);
  assertNull(field.blockSpaceScrolledListenKey_);

  goog.dom.removeNode(containerDiv);
}

function test_field_reposition_on_scroll() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(
      '<xml>' +
      '  <block type="math_number">' +
      '    <title name="NUM">0</title>' +
      '  </block>' +
      '</xml>'));

  var block = blockSpace.getTopBlocks()[0];
  var field = block.getTitle_("NUM");

  var positionWidgetDivCalled = false;
  field.positionWidgetDiv = function () {
    positionWidgetDivCalled = true;
  };

  // Widget will not be positioned until the field is opened, even if
  // the block space is scrolled
  assertEquals(positionWidgetDivCalled, false);
  blockSpace.events.dispatchEvent(Blockly.BlockSpace.EVENTS.BLOCK_SPACE_SCROLLED);
  assertEquals(positionWidgetDivCalled, false);
  Blockly.fireTestClickSequence(field.fieldGroup_);
  assertEquals(positionWidgetDivCalled, true);

  // It will then be positioned again once the block space is scrolled
  positionWidgetDivCalled = false;
  blockSpace.events.dispatchEvent(Blockly.BlockSpace.EVENTS.BLOCK_SPACE_SCROLLED);
  assertEquals(positionWidgetDivCalled, true);

  goog.dom.removeNode(containerDiv);
}
