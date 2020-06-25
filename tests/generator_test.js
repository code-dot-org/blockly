/**
 * Blockly Tests
 *
 * Copyright 2012 Google Inc.
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
'use strict';

var UNKNOWN_BLOCK = '<xml>' +
    '<block type="variables_set">' +
        '<title name="VAR">i</title>' +
        '<value name="VALUE">' +
            '<block type="text">' +
                '<title name="TEXT"></title>' +
            '</block>' +
        '</value>' +
        '<next>' +
            '<block type="NOT_VALID_TYPE">' +
                '<value name="VALUE">' +
                    '<block type="text">' +
                        '<title name="TEXT"></title>' +
                    '</block>' +
                '</value>' +
                '<next>' +
                    '<block type="variables_set">' +
                        '<title name="VAR">i</title>' +
                        '<value name="VALUE">' +
                            '<block type="text">' +
                                '<title name="TEXT"></title>' +
                            '</block>' +
                        '</value>' +
                    '</block>' +
                '</next>' +
            '</block>' +
        '</next>' +
    '</block>' +
'</xml>';

var UNKNOWN_BLOCK_AS_CODE =
'var i;' + 
'\n' +
'\n' +
"\ni = '';" +
'\n// Unknown block: NOT_VALID_TYPE' +
"\ni = '';" + 
'\n';

function test_get() {
  var language1 = Blockly.Generator.get('INTERCAL');
  var language2 = Blockly.Generator.get('INTERCAL');
  assertTrue('Creating a language.', language1 && (typeof language1 == 'object'));
  assertTrue('Language is singleton.', language1 === language2);
}

function test_prefix() {
  assertEquals('Prefix nothing.', '', Blockly.Generator.prefixLines('', ''));
  assertEquals('Prefix a word.', '@Hello', Blockly.Generator.prefixLines('Hello', '@'));
  assertEquals('Prefix one line.', '12Hello\n', Blockly.Generator.prefixLines('Hello\n', '12'));
  assertEquals('Prefix two lines.', '***Hello\n***World\n', Blockly.Generator.prefixLines('Hello\nWorld\n', '***'));
}

function test_unknownBlock() {
  var container = Blockly.Test.initializeBlockSpaceEditor();
  var blockSpace = Blockly.mainBlockSpace;

  Blockly.Xml.domToBlockSpace(blockSpace, Blockly.Xml.textToDom(UNKNOWN_BLOCK));

  var generatedCode = Blockly.Generator.blockSpaceToCode('JavaScript');

  assertEquals(generatedCode, UNKNOWN_BLOCK_AS_CODE);

  goog.dom.removeNode(container);
}
