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
goog.require('Blockly.Blocks.unknown');
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

function createVariableGet(type) {
  return {
    // Variable getter.
    init: function() {
      var fieldLabel = new Blockly.FieldLabel(Blockly.Msg.VARIABLES_GET_ITEM);
      // Must be marked EDITABLE so that cloned blocks share the same var name
      fieldLabel.EDITABLE = true;
      this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
      this.appendDummyInput()
        .appendTitle(Blockly.Msg.VARIABLES_GET_TITLE)
        .appendTitle(Blockly.disableVariableEditing ? fieldLabel
          : new Blockly.FieldParameter(Blockly.Msg.VARIABLES_GET_ITEM), 'VAR')
        .appendTitle(Blockly.Msg.VARIABLES_GET_TAIL);
      this.setStrictOutput(true, type);
      this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    }
  }
}

function createVariableSet(type) {
  return {
    // Variable setter.
    init: function() {
      var fieldLabel = new Blockly.FieldLabel(Blockly.Msg.VARIABLES_SET_ITEM);
      // Must be marked EDITABLE so that cloned blocks share the same var name
      fieldLabel.EDITABLE = true;
      this.setHelpUrl(Blockly.Msg.VARIABLES_SET_HELPURL);
      this.setHSV(312, 0.32, 0.62);
      this.appendValueInput('VALUE')
        .setStrictCheck(type)
        .appendTitle(Blockly.Msg.VARIABLES_SET_TITLE)
        .appendTitle(Blockly.disableVariableEditing ? fieldLabel
          : new Blockly.FieldVariable(Blockly.Msg.VARIABLES_SET_ITEM), 'VAR')
        .appendTitle(Blockly.Msg.VARIABLES_SET_TAIL);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
    },
    getVars: function() {
      return Blockly.Variables.getVars.bind(this)(type);
    },
    renameVar: function(oldName, newName) {
      if (Blockly.Names.equals(oldName, this.getTitleValue('VAR'))) {
        this.setTitleValue(newName, 'VAR');
      }
    },
    contextMenuMsg_: Blockly.Msg.VARIABLES_SET_CREATE_GET,
      contextMenuType_: 'variables_get',
    customContextMenu: Blockly.Blocks.variables_get.customContextMenu
  }
}

Blockly.Blocks.sprite_variables_get = createVariableGet(Blockly.BlockValueType.SPRITE);
Blockly.Blocks.sprite_variables_set = createVariableSet(Blockly.BlockValueType.SPRITE);

Blockly.Blocks.behavior_variables_get = createVariableGet(Blockly.BlockValueType.BEHAVIOR);
Blockly.Blocks.behavior_variables_set = createVariableSet(Blockly.BlockValueType.BEHAVIOR);

Blockly.Blocks.location_variables_get = createVariableGet(Blockly.BlockValueType.LOCATION);
Blockly.Blocks.location_variables_set = createVariableSet(Blockly.BlockValueType.LOCATION);

Blockly.Blocks.parent = {
  init: function() {
    var toggle = new Blockly.FieldIcon('＋');
    this.tray = false;
    Blockly.bindEvent_(toggle.fieldGroup_, 'mousedown', this, () => {
      if (this.tray) {
        toggle.setText('＋');
      } else {
        toggle.setText('－');
      }
      this.tray = !this.tray;
      this.render();
    });

    this.initMiniFlyout(`
      <xml>
        <block type="math_number"></block>
        <block type="colour_rgb"></block>
      </xml>
    `);

    this.setHSV(131, 0.64, 0.62);
    this.appendDummyInput()
      .appendTitle(toggle)
      .appendTitle('parent block');
    this.appendValueInput('COLOUR');
    this.appendValueInput('TEXT');
    this.setNextStatement(true);
    this.setInputsInline(true);
  }
};

Blockly.Blocks.button_block = {
  // Example block with button field
  init: function() {
    this.setHSV(131, 0.64, 0.62);
    var span = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
    span.style.fill = 'blue';
    span.textContent = 'button';
    this.appendDummyInput()
        .appendTitle("here's a button on a really long block")
        .appendTitle(
          new Blockly.FieldButton(span, function () {
              return new Promise(resolve => resolve(prompt()));
            },
            this.getHexColour(),
          ),
          'VALUE',
        );
    this.setOutput(true, Blockly.BlockValueType.STRING);
  },
};

Blockly.Blocks.dropdown_with_button_block = {
  // Example block with a dropdown with buttons
  init: function() {
    this.setHSV(131, 0.64, 0.62);
    this.appendDummyInput()
      .appendTitle("here's a dropdown with buttons")
      .appendTitle(
        new Blockly.FieldImageDropdown(
          [
            ['assets/bear.png', 'Bear'],
            ['assets/carrot.png', 'Carrot'],
            ['assets/coin.png', 'Coin'],
            ['assets/cupcake.png', 'Cupcake'],
          ],
          32,
          32,
          [{text: "TestButton", action: function(){console.log("Button Clicked")}}]
        )
      );
  },
};

Blockly.Blocks.ocean_boiler_definition = Object.assign({},
  Blockly.Blocks.procedures_defnoreturn,
  {
    init: function() {
      Blockly.Blocks.procedures_defnoreturn.init.bind(this)();
      this.appendDummyInput()
          .appendTitle(new Blockly.FieldLabel('this is a different definition block'));
      this.setInputsInline(false);
      this.setHSV(20, 0.5, 0.5);
    },
  }
);
Blockly.Procedures.DEFINITION_BLOCK_TYPES.push('ocean_boiler_definition');

