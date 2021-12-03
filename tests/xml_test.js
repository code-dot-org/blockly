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
    '<block type="another_type">' +
    '<title name="VAR">growing</title>' +
    '</block>' +
    '</xml>';
  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(blockXml));
  var behaviorDefinitionBlock = blockSpace.getTopBlocks()[0];
  // Adds id to title if block type is behavior_definition
  assertEquals(behaviorDefinitionBlock.getTitle_('NAME').id, 'growing');

  behaviorDefinitionBlock = blockSpace.getTopBlocks()[1];
  // Adds id to title if block type is gamelab_behavior_get
  assertEquals(behaviorDefinitionBlock.getTitle_('VAR').id, 'growing');

  var otherBlock = blockSpace.getTopBlocks()[2];
  // Does not add id to title if block type is not behavior_definition or gamelab_behavior_get
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

function test_serialize_field() {
  var containerDiv = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  var block = new Blockly.Block(blockSpace, 'text');
  block.initSvg();
  block.setTitleValue('field value', 'TEXT');
  block.getTitle_('TEXT').id = 'field id';
  var xmlString = Blockly.Xml.domToText(Blockly.Xml.blockToDom(block));
  var expectedXml =
    '<block type="text"><field name="TEXT" id="field id">field value</field></block>';
  assertEquals(xmlString, expectedXml);
}

function test_deserialize_field() {
  var container = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;
  var blockXml =
    '<xml>' +
    '<block type="text"><field name="TEXT" id="field id">field value</field></block>' +
    '</xml>';
  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(blockXml));
  var block = blockSpace.getTopBlocks()[0];
  assertEquals(block.getTitleValue('TEXT'), 'field value');
  assertEquals(block.getTitle_('TEXT').id, 'field id');
}
