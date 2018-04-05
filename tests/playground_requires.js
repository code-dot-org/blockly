'use strict';

goog.provide('Blockly.Playground');

goog.require('Blockly');

/**
 * in full compilation mode, these get built out into separate packages
 * (e.g., blocks_compressed.js / javascript_compressed.js)
 * for the test and playground no-build-required scenario,
 * require all example blocks
 */
goog.require('Blockly.Blocks.colour');
goog.require('Blockly.Blocks.functionalExamples');
goog.require('Blockly.Blocks.functionalParameters');
goog.require('Blockly.Blocks.functionalProcedures');
goog.require('Blockly.Blocks.lists');
goog.require('Blockly.Blocks.logic');
goog.require('Blockly.Blocks.loops');
goog.require('Blockly.Blocks.math');
goog.require('Blockly.Blocks.procedures');
goog.require('Blockly.Blocks.text');
goog.require('Blockly.Blocks.variables');
goog.require('Blockly.JavaScript');
goog.require('Blockly.JavaScript.colour');
goog.require('Blockly.JavaScript.functionalExamples');
goog.require('Blockly.JavaScript.functionalParameters');
goog.require('Blockly.JavaScript.functionalProcedures');
goog.require('Blockly.JavaScript.lists');
goog.require('Blockly.JavaScript.logic');
goog.require('Blockly.JavaScript.loops');
goog.require('Blockly.JavaScript.math');
goog.require('Blockly.JavaScript.procedures');
goog.require('Blockly.JavaScript.text');
goog.require('Blockly.JavaScript.variables');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Dialog.ButtonSet');

/**
 * @param {DialogOptions} dialogOptions
 */
Blockly.Playground.customSimpleDialog = function (dialogOptions) {
  var dialog = new goog.ui.Dialog();
  dialog.setTitle(dialogOptions.headerText);
  dialog.setContent(dialogOptions.bodyText);
  var buttons = new goog.ui.Dialog.ButtonSet();
  buttons.set(goog.ui.Dialog.DefaultButtonKeys.CANCEL,
      dialogOptions.cancelText,
      false,
      true);
  buttons.set(goog.ui.Dialog.DefaultButtonKeys.OK,
      dialogOptions.confirmText,
      true);
  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function (e) {
    switch (e.key) {
      case goog.ui.Dialog.DefaultButtonKeys.CANCEL:
        if (dialogOptions.onCancel) {
          dialogOptions.onCancel();
        }
        break;
      case goog.ui.Dialog.DefaultButtonKeys.OK:
        if (dialogOptions.onConfirm) {
          dialogOptions.onConfirm();
        }
        break;
    }
  });
  dialog.setButtonSet(buttons);
  dialog.setVisible(true);
};

Blockly.Blocks.sprite_variables_get = {
  // Variable getter.
  init: function() {
    var fieldLabel = new Blockly.FieldLabel(Blockly.Msg.VARIABLES_GET_ITEM);
    // Must be marked EDITABLE so that cloned blocks share the same var name
    fieldLabel.EDITABLE = true;
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setHSV(131, 0.64, 0.62);
    this.appendDummyInput()
        .appendTitle(Blockly.Msg.VARIABLES_GET_TITLE)
        .appendTitle(Blockly.disableVariableEditing ? fieldLabel
            : new Blockly.FieldParameter(Blockly.Msg.VARIABLES_GET_ITEM), 'VAR')
        .appendTitle(Blockly.Msg.VARIABLES_GET_TAIL);
    this.setStrictOutput(true, Blockly.BlockValueType.SPRITE);
    this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
  },
};

Blockly.Blocks.sprite_variables_set = {
  // Variable setter.
  init: function() {
    var fieldLabel = new Blockly.FieldLabel(Blockly.Msg.VARIABLES_SET_ITEM);
    // Must be marked EDITABLE so that cloned blocks share the same var name
    fieldLabel.EDITABLE = true;
    this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
    this.setHSV(131, 0.64, 0.62);
    this.appendValueInput('VALUE')
        .setStrictCheck(Blockly.BlockValueType.SPRITE)
        .appendTitle(Blockly.Msg.VARIABLES_SET_TITLE)
        .appendTitle(Blockly.disableVariableEditing ? fieldLabel
          : new Blockly.FieldVariable(Blockly.Msg.VARIABLES_SET_ITEM), 'VAR')
        .appendTitle(Blockly.Msg.VARIABLES_SET_TAIL);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
  },
  getVars: function() {
    return [this.getTitleValue('VAR')];
  },
  renameVar: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getTitleValue('VAR'))) {
      this.setTitleValue(newName, 'VAR');
    }
  },
  contextMenuMsg_: Blockly.Msg.VARIABLES_SET_CREATE_GET,
  contextMenuType_: 'variables_get',
  customContextMenu: Blockly.Blocks.variables_get.customContextMenu
};

Blockly.Blocks.button_block = {
  // Example block with button field
  init: function() {
    this.setHSV(131, 0.64, 0.62);
    this.appendDummyInput()
        .appendTitle("here's a button")
        .appendTitle(
          new Blockly.FieldButton('button', function () {
              return new Promise(resolve => resolve(prompt()));
            },
            this.getHexColour(),
          ),
          'VALUE',
        );
    this.setOutput(true, Blockly.BlockValueType.STRING);
  },
};
