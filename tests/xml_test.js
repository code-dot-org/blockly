'use strict';

function test_xml_title_with_id() {
  var container = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;
  var blockXml =
    '<xml>' +
    '<block type="gamelab_behavior_get">' +
    '<mutation></mutation>' +
    '<title id="growing" name="VAR">growing</title>' +
    '</block>' +
    '</xml>';
  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(blockXml));
  var block = blockSpace.getTopBlocks()[0];
  assertEquals(block.getTitle_('VAR').id, 'growing');
}

function test_xml_title_without_id() {
  var container = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;
  var blockXml =
    '<xml>' +
    '<block type="behavior_definition" >' +
    '<title name="NAME">growing</title>' +
    '</block>' +
    '<block type="gamelab_behavior_get">' +
    '<title name="VAR">growing</title>' +
    '</block>' +
    '</xml>';
  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(blockXml));
  var behaviorDefinitionBlock = blockSpace.getTopBlocks()[0];
  // Adds id to title if block type is behavior_definition
  assertEquals(behaviorDefinitionBlock.getTitle_('NAME').id, 'growing');

  var otherBlock = blockSpace.getTopBlocks()[1];
  // Does not add id to title if block type is not behavior_definition
  assertEquals(otherBlock.getTitle_('VAR').id, undefined);
}

function test_block_title_with_id() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  var block = new Blockly.Block(blockSpace);
  block.initSvg();
  block.setTitleValue('title value', 'VAR');
  block.getTitle_('VAR').id = 'title id';

  var xml = Blockly.Xml.blockToDom(block);
  assertEquals(xml.childNodes[0].getAttribute('id'), 'title id');
}
