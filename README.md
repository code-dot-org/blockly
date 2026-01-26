# Blockly (Code Studio fork) - Archived

This repository historically contained Code.org’s fork of [Blockly](https://blockly.com/), the open-source visual programming environment. The fork existed to support custom features for
Code.org-specific curriculum that were not yet available with mainline Blockly or its plugins.

## Archival note

Code.org has fully migrated to mainline Blockly, and this fork is no longer used or published. This repository is archived to preserve istorical reference only. It is not maintained, tested, or supported.

## Major additions and changes in this fork

- Modal editor for function blocks ([function_editor.js](./core/ui/function_editor.js))
- Scrolling improvements:
  - auto-scroll on block drag ([scroll_on_block_drag_handler.js](./core/ui/block_space/scroll_on_block_drag_handler.js))
  - scroll on mouse wheel ([scroll_on_wheel_handler.js](./core/ui/block_space/scroll_on_wheel_handler.js))
- New in-toolbox trashcan
- Addition of "Functional blocks" and "Contract/Variable Editor" ([contract_editor/](./core/ui/contract_editor/)) for use in the CS in Algebra curriculum
  - Blocks have "Block Value Types" ([block_value_type.js](./core/utils/block_value_type.js))
- Support for "block limits" ([block_limits.js](./core/ui/block_space/block_limits.js)), toolbox blocks which allow only a certain number of instances in the block space
- Support for new block properties ([block.js](./core/ui/block.js)): invisible, un-deletable, immovable, specify-able via a context menu when `Blockly.editBlocks` is set
- Structure: add folders in [core/](./core) to further categorize classes
- New field types:
  - Image Dropdown ([field_image_dropdown.js](./core/ui/fields/field_image_dropdown.js))
- BlockSpace (Workspace) Refactoring:
  - moved many static properties and methods from `blockly.js` into a prototype class `BlockSpaceEditor` which can be instantiated multiple times on the same page
  - renamed `Workspace` to `BlockSpace` to disambiguate from higher-level `BlockSpaceEditor`
  - improved support for multiple blockspaces on a single page
- Playground: add dependency cache and generation script ([tests/update_test_dependencies.sh](./tests/update_test_dependencies.sh)), to allow for testing changes without re-building
  - support for [goog.ui.tweak](https://google.github.io/closure-library/source/closure/goog/demos/tweakui.html)s to configure playground page behavior
  - debug drawing helpers for block bumping
- Support for a special UI for unattached blocks
- Improvements to block arrangement on initialization
- Testing: add phantomjs-based test runner [test.sh](./test.sh). Tested in CI at root level of this repository.

## Current Blockly usage at Code.org

Code.org no longer uses this repository. Any active development related to Blockly at Code.org should happen against upstream Blockly or within the Code.org repository itself.

## npm package status

The `@code-dot-org/blockly` npm package is no longer published or updated.  
Do not depend on it for new projects.
