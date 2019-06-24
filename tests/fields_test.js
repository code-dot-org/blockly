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

function test_dropdown_options() {
  var dropdown = new Blockly.FieldDropdown([['Foo 123', 'foo'], ['Bar 456', 'bar']]);

  dropdown.setConfig('foo,abc,zzz');
  assert(goog.array.equals(['Foo 123', 'foo', 'abc', 'abc', 'zzz', 'zzz'], goog.array.flatten(dropdown.getOptions())));
  assertEquals('foo', dropdown.getValue());

  // Can set different value.
  dropdown.setValue('zzz');
  assertEquals('zzz', dropdown.getValue());

  // Can set a value not present in the options list.
  dropdown.setValue('asdf');
  assertEquals('asdf', dropdown.getValue());

  dropdown.setConfig(' foo , abc');
  assert(goog.array.equals(['Foo 123', 'foo', 'abc', 'abc'], goog.array.flatten(dropdown.getOptions())));

  dropdown.setConfig('5-7,10');
  assert(goog.array.equals(["5", "5", "6", "6", "7", "7", "10", "10"], goog.array.flatten(dropdown.getOptions())));
}

function test_image_dropdown_menu_button() {
  // Set up blockspace and button with image dropdown
  var blockSpace = Blockly.mainBlockSpace;
  var imgDropdown = new Blockly.FieldImageDropdown([['#', 'foo'], ['#', 'bar']], 200, 200, [{text: "TestButton", action: function(){}}]);
  var wrapperBlock = new Blockly.Block(blockSpace);
  wrapperBlock.setFunctional(true);
  wrapperBlock.initSvg();
  imgDropdown.sourceBlock_ = wrapperBlock;

  assertEquals(1, imgDropdown.buttons_.length);
  assertEquals('foo', imgDropdown.getValue());

  // Generate menu
  imgDropdown.showMenu_();

  // Check menu has items 'Foo 123', 'Bar 456', and 'TestButton' button
  let menu = imgDropdown.menu_;
  assertEquals(3, menu.getItemCount());
  // Buttons are added at the end of the menu
  let button = menu.getItemAt(2);
  assertEquals("TestButton", button.getContent());

  // Elements stay remains in menu after menu is hidden
  imgDropdown.hideMenu_();
  assertEquals(3, imgDropdown.menu_.getItemCount());

  // Can set different value.
  imgDropdown.setValue('bar');
  assertEquals('bar', imgDropdown.getValue());

  // Attempts to set dropdown to a missing values are ignored.
  imgDropdown.setValue('zzz');
  assertEquals('bar', imgDropdown.getValue());
}

function test_clampedNumberValidator() {
  var withoutBounds = Blockly.FieldTextInput.clampedNumberValidator();
  var withLowerBound = Blockly.FieldTextInput.clampedNumberValidator(0.5);
  var withNegativeLowerBound = Blockly.FieldTextInput.clampedNumberValidator(-0.5);
  var withUpperBound = Blockly.FieldTextInput.clampedNumberValidator(undefined, 4.5);
  var withBothBounds = Blockly.FieldTextInput.clampedNumberValidator(0.5, 4.5);

  [withoutBounds, withLowerBound, withNegativeLowerBound, withUpperBound, withBothBounds].forEach(function (validator) {
    // All created validators have validatorType 'clampedNumberValidator' which allows us to customize the
    // generated input type appropriately.
    assert(validator.validatorType === 'clampedNumberValidator');
    // Values in range are returned appropriately
    assert(validator('3') === '3');
  });

  [withLowerBound, withBothBounds].forEach(function (validator) {
    // Lower bound is inclusive
    assert(validator('0.5') === '0.5');
    // Given a value smaller than the lower bound, you get the lower bound
    assert(validator('0.2') === '0.5');
  });

  [withoutBounds, withUpperBound].forEach(function (validator) {
    // Without a lower bound, you get the value back
    assert(validator('0.2') === '0.2');
  });

  [withUpperBound, withBothBounds].forEach(function (validator) {
    // Upper bound is inclusive
    assert(validator('4.5') === '4.5');
    // Given a value larger than the upper bound, you get the upper bound
    assert(validator('4.7') === '4.5');
  });

  [withoutBounds, withLowerBound].forEach(function (validator) {
    // Without an upper bound, you get the value back
    assert(validator('4.7') === '4.7');
  });

  // Given a non-number value and the lower bound is positive, you get the lower bound
  assert(withLowerBound('abc') === '0.5');
  // Given a non-number value and the lower bound is negative, you get zero
  assert(withNegativeLowerBound('abc') === '0');
  // Given a non-number value and the lower bound is not set, you get zero
  assert(withUpperBound('abc') === '0');
}
