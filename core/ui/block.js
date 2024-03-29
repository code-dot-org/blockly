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

/**
 * @fileoverview The class representing one block.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Block');

goog.require('Blockly.BlockSvg');
goog.require('Blockly.BlockSvgFramed');
goog.require('Blockly.BlockSvgFunctional');
goog.require('Blockly.Blocks');
goog.require('Blockly.Connection');
goog.require('Blockly.ContextMenu');
goog.require('Blockly.Input');
goog.require('Blockly.Msg');
goog.require('Blockly.Mutator');
goog.require('Blockly.Warning');
goog.require('Blockly.BlockSpace');
goog.require('Blockly.Xml');
goog.require('goog.asserts');
goog.require('goog.string');

/**
 * Unique ID counter for created blocks.
 * @private
 */
Blockly.uidCounter_ = 0;

/**
 * Class for one block.
 * @param {!Blockly.BlockSpace} blockSpace The new block's blockSpace.
 * @param {?string} prototypeName Name of the language object containing
 *     type-specific functions for this block.
 * @constructor
 */
Blockly.Block = function(blockSpace, prototypeName, htmlId) {
  this.id = ++Blockly.uidCounter_;
  this.htmlId = htmlId;
  this.outputConnection = null;
  this.nextConnection = null;
  this.previousConnection = null;
  this.inputList = [];
  this.inputsInline = false;
  this.rendered = false;
  this.disabled = false;
  this.tooltip = '';

  this.contextMenu = true;

  this.parentBlock_ = null;
  this.childBlocks_ = [];
  this.deletable_ = true;
  this.movable_ = true;
  this.editable_ = true;
  this.userVisible_ = true;
  this.nextConnectionDisabled_ = false;
  this.collapsed_ = false;
  this.dragging_ = false;

  // Used to hide function blocks when not in modal workspace. This property
  // is not serialized/deserialized.
  this.currentlyHidden_ = false;

  /**
   * Whether this block is allowed to disconnect from its parent block.
   * @private {boolean}
   */
  this.canDisconnectFromParent_ = true;

  /**
   * The label which can be clicked to edit this block. This field is
   * currently set only for functional_call blocks.
   * @type {Blockly.FieldIcon}
   */
  this.editLabel_ = null;

  /**
   * @type {!Blockly.BlockSpace}
   */
  this.blockSpace = blockSpace;
  this.isInFlyout = blockSpace.isFlyout;

  this.colourSaturation_ = 0.45;
  this.colourValue_ = 0.65;
  this.fillPattern_ = null;
  this.blockSvgClass_ = Blockly.BlockSvg;
  this.customOptions_ = {};

  /**
   * Optional method to run just prior to disposing this block
   * @type {?Function}
   */
  this.beforeDispose = null;

  this.setRenderBlockSpace(blockSpace);

  // Copy the type-specific functions and data from the prototype.
  if (prototypeName) {
    this.type = prototypeName;
    var prototype = Blockly.Blocks[prototypeName];
    if (!prototype) {
      Blockly.fireUiEvent(window, 'unknownBlock', {name: prototypeName});
      prototype = Blockly.Blocks.unknown;
      this.appendDummyInput().appendTitle('unknown: ' + prototypeName);
      console.warn(
        'Warning: "' + prototypeName + '" is an unknown language block.'
      );
    }
    goog.mixin(this, prototype);
  }
  // Call an initialization function, if it exists.
  if (goog.isFunction(this.init)) {
    this.init();
  }

  if (
    this.shouldHideIfInMainBlockSpace &&
    this.shouldHideIfInMainBlockSpace() &&
    this.blockSpace === Blockly.mainBlockSpace
  ) {
    this.setCurrentlyHidden(true);
  }

  this.handleBlockLimitChanges();

  /** @type {goog.events.EventTarget} */
  this.blockEvents = new goog.events.EventTarget();
};

/**
 * @enum {string}
 */
Blockly.Block.EVENTS = {
  AFTER_DISPOSED: 'afterDisposed',
  AFTER_DROPPED: 'afterDropped'
};

/**
 * Pointer to SVG representation of the block.
 * @type {Blockly.BlockSvg}
 * @private
 */
Blockly.Block.prototype.svg_ = null;

/**
 * Block's mutator icon (if any).
 * @type {?Blockly.Mutator}
 */
Blockly.Block.prototype.mutator = null;

/**
 * Block's warning icon (if any).
 * @type {?Blockly.Warning}
 */
Blockly.Block.prototype.warning = null;

/**
 * Callback function called after initialization
 * (typically defined by subclasses)
 * @type {?function()}
 */
Blockly.Block.prototype.init = null;

/**
 * Callback function called after initialization
 * (typically defined by subclasses)
 * @type {?function()}
 */
Blockly.Block.prototype.onchange = null;

/**
 * Update limit UI on block count changes.
 */
Blockly.Block.prototype.handleBlockLimitChanges = function() {
  if (this.blockSpace && this.blockSpace.blockSpaceEditor) {
    // Normally we want to show block limits in the flyout, but while editing
    // blocks (e.g. in the Toolbox Blocks Editor), we'd like to show them in
    // the main block space.
    var shouldShowBlockLimits = Blockly.editBlocks
      ? !this.isInFlyout
      : this.isInFlyout;
    if (shouldShowBlockLimits) {
      this.blockSpace.blockSpaceEditor.blockLimits.events.listen(
        'change',
        this.onBlockLimitChange.bind(this)
      );
    }
  }
};

Blockly.Block.prototype.onBlockLimitChange = function(eventObject) {
  if (eventObject.type !== this.type) {
    return;
  }
  if (!this.svg_) {
    return;
  }

  // When editing blocks, show full count. Otherwise, show remaining #.
  var displayCount = Blockly.editBlocks
    ? eventObject.limit
    : eventObject.remaining;
  this.svg_.updateLimit(displayCount);
};

/**
 * @param {Blockly.BlockSpace} blockSpace target blockspace to begin rendering on
 */
Blockly.Block.prototype.setRenderBlockSpace = function(blockSpace) {
  this.blockSpace = blockSpace;
  this.blockSpace.addTopBlock(this);

  // Bind an onchange function if one exists (typically set by block subclasses)
  if (goog.isFunction(this.onchange)) {
    Blockly.bindEvent_(
      this.blockSpace.getCanvas(),
      'blocklyBlockSpaceChange',
      this,
      this.onchange
    );
  }
};

/**
 * Returns a list of mutator and warning icons.
 * @return {!Array} List of icons.
 */
Blockly.Block.prototype.getIcons = function() {
  var icons = [];
  if (this.mutator) {
    icons.push(this.mutator);
  }
  if (this.warning) {
    icons.push(this.warning);
  }
  return icons;
};

/**
 * Create and initialize the SVG representation of the block.
 */
Blockly.Block.prototype.initSvg = function() {
  this.svg_ = new this.blockSvgClass_(this, this.customOptions_);
  this.svg_.init();
  if (!this.blockSpace.isReadOnly()) {
    Blockly.bindEvent_(
      this.svg_.getRootElement(),
      'mousedown',
      this,
      this.onMouseDown_
    );
    Blockly.bindEvent_(
      this.svg_.getRootElement(),
      'focus',
      this,
      this.select.bind(this, false)
    );
  }
  this.setCurrentlyHidden(this.currentlyHidden_);
  this.moveToFrontOfMainCanvas_();
  this.setIsUnused();

  if (this.miniFlyoutBlocks) {
    this.miniFlyout = new Blockly.HorizontalFlyout(
      this.blockSpace.blockSpaceEditor
    );
    this.miniFlyout.targetBlockSpace_ = this.blockSpace;
    var dom = this.miniFlyout.createDom(true);
    this.svg_.getRootElement().appendChild(dom);
    this.miniFlyout.show(this.miniFlyoutBlocks);
    this.miniFlyout.softHide();
  }
};

/**
 * Create a mini-flyout with the given set of blocks.
 */
Blockly.Block.prototype.initMiniFlyout = function(blockString) {
  var root = Blockly.Xml.textToDom(blockString);
  // Use childNodes, not children, for IE compatibility
  var childNodes = root.childNodes;
  var blockList = [];
  for (var i = 0; i < childNodes.length; i++) {
    var node = childNodes[i];
    if (node.nodeName === 'block') {
      blockList.push(node);
    }
  }
  this.miniFlyoutBlocks = blockList;
};

/**
 * Return the root node of the SVG or null if none exists.
 * @return {Element} The root SVG node (probably a group).
 */
Blockly.Block.prototype.getSvgRoot = function() {
  return this.svg_ && this.svg_.getRootElement();
};

Blockly.Block.DRAG_MODE_NOT_DRAGGING = 0;
Blockly.Block.DRAG_MODE_INSIDE_STICKY_RADIUS = 1;
Blockly.Block.DRAG_MODE_FREELY_DRAGGING = 2;

/**
 * Is the mouse dragging a block?
 * 0 - No drag operation.
 * 1 - Still inside the sticky DRAG_RADIUS.
 * 2 - Freely draggable.
 * @private
 */
Blockly.Block.dragMode_ = Blockly.Block.DRAG_MODE_NOT_DRAGGING;

Blockly.Block.isDragging = function() {
  return Blockly.Block.dragMode_ !== Blockly.Block.DRAG_MODE_NOT_DRAGGING;
};

Blockly.Block.isFreelyDragging = function() {
  return Blockly.Block.dragMode_ === Blockly.Block.DRAG_MODE_FREELY_DRAGGING;
};

/**
 * Pretend that we've already started dragging a block. This ensures that any
 * methods called between now and onMouseDown behave as though a block is being
 * dragged, e.g. skipping neighbour bumping.
 */
Blockly.Block.startDragging = function() {
  Blockly.Block.dragMode_ = Blockly.Block.DRAG_MODE_INSIDE_STICKY_RADIUS;
};

/**
 * Wrapper function called when a mouseUp occurs during a drag operation.
 * @type {BindData}
 * @private
 */
Blockly.Block.onMouseUpWrapper_ = null;

/**
 * Wrapper function called when a mouseMove occurs during a drag operation.
 * @type {BindData}
 * @private
 */
Blockly.Block.onMouseMoveWrapper_ = null;

/**
 * Stop binding to the global mouseup and mousemove events.
 * @private
 */
Blockly.Block.terminateDrag_ = function() {
  if (Blockly.Block.onMouseUpWrapper_) {
    Blockly.unbindEvent_(Blockly.Block.onMouseUpWrapper_);
    Blockly.Block.onMouseUpWrapper_ = null;
  }
  if (Blockly.Block.onMouseMoveWrapper_) {
    Blockly.unbindEvent_(Blockly.Block.onMouseMoveWrapper_);
    Blockly.Block.onMouseMoveWrapper_ = null;
  }
  var selected = Blockly.selected;
  if (Blockly.Block.isFreelyDragging()) {
    // Terminate a drag operation.
    if (selected) {
      selected.blockSpace.clearPickedUpBlockOrigin();
      selected.blockSpace.stopAutoScrolling();
      // Update the connection locations.
      var xy = selected.getRelativeToSurfaceXY();
      var dx = xy.x - selected.startDragX;
      var dy = xy.y - selected.startDragY;
      selected.moveConnections_(dx, dy);
      delete selected.draggedBubbles_;
      selected.setDragging_(false);
      selected.moveToFrontOfMainCanvas_();
      selected.render();
      window.setTimeout(
        selected.bumpNeighbours.bind(selected),
        Blockly.BUMP_DELAY
      );
      selected.blockSpace.blockSpaceEditor.bumpBlocksIntoBlockSpace();
      selected.blockSpace.scrollIntoView(selected);

      // Fire an event to allow scrollbars to resize.
      Blockly.fireUiEvent(window, 'resize');
    }
  }
  // When we have a selected block, we should use its editor to run
  // the cursor change so that the editor's SVG gets a cursor change
  // as well.
  if (selected) {
    selected.blockSpace.fireChangeEvent();
    selected.blockSpace.blockSpaceEditor.setCursor(Blockly.Css.Cursor.OPEN);
  }

  Blockly.Block.dragMode_ = Blockly.Block.DRAG_MODE_NOT_DRAGGING;

  if (selected) {
    selected.blockEvents.dispatchEvent(Blockly.Block.EVENTS.AFTER_DROPPED);
  }
};

/**
 * Select this block.  Highlight it visually.
 */
Blockly.Block.prototype.select = function(spotlight) {
  if (!this.svg_) {
    throw 'Block is not rendered.';
  }
  if (Blockly.selected) {
    // Unselect any previously selected block.
    Blockly.selected.unselect();
  }
  Blockly.selected = this;
  this.svg_.addSelect(!this.parentBlock_);
  if (spotlight) {
    this.svg_.addSpotlight();
  }
  Blockly.fireUiEvent(this.blockSpace.getCanvas(), 'blocklySelectChange');
};

/**
 * Unselect this block.  Remove its highlighting.
 */
Blockly.Block.prototype.unselect = function() {
  if (Blockly.selected !== this) {
    return;
  }

  if (!this.svg_) {
    throw 'Block is not rendered.';
  }
  Blockly.BlockSpaceEditor.terminateDrag_();
  Blockly.selected = null;
  this.svg_.removeSelect();
  this.svg_.removeSpotlight();
  Blockly.fireUiEvent(this.blockSpace.getCanvas(), 'blocklySelectChange');
};

/**
 * Whether this block can be copied, cut, and pasted.
 * Can be overridden by individual block types.
 * @returns {boolean}
 */
Blockly.Block.prototype.isCopyable = function() {
  return true;
};

/**
 * Dispose of this block.
 * @param {boolean} healStack If true, then try to heal any gap by connecting
 *     the next statement with the previous statement.  Otherwise, dispose of
 *     all children of this block.
 * @param {boolean} animate If true, show a disposal animation and sound.
 */
Blockly.Block.prototype.dispose = function(healStack, animate) {
  if (goog.isFunction(this.beforeDispose)) {
    this.beforeDispose();
  }

  // Switch off rerendering.
  this.rendered = false;
  this.unplug(healStack);

  if (animate && this.svg_) {
    this.svg_.disposeUiEffect();
  }

  var updateBlockSpaceCallback = goog.bind(
    this.blockSpace.updateScrollableSize,
    this.blockSpace
  );

  // This block is now at the top of the blockSpace.
  // Remove this block from the blockSpace's list of top-most blocks.
  this.blockSpace.removeTopBlock(this);
  this.blockSpace = null;

  // Just deleting this block from the DOM would result in a memory leak as
  // well as corruption of the connection database.  Therefore we must
  // methodically step through the blocks and carefully disassemble them.

  if (Blockly.selected == this) {
    Blockly.selected = null;
    // If there's a drag in-progress, unlink the mouse events.
    Blockly.BlockSpaceEditor.terminateDrag_();
  }

  // If this block has a context menu open, close it.
  if (Blockly.ContextMenu.currentBlock == this) {
    Blockly.ContextMenu.hide();
  }

  // First, dispose of all my children.
  var x;
  for (x = this.childBlocks_.length - 1; x >= 0; x--) {
    this.childBlocks_[x].dispose(false);
  }
  // Then dispose of myself.
  var icons = this.getIcons();

  for (x = 0; x < icons.length; x++) {
    icons[x].dispose();
  }
  // Dispose of all inputs and their titles.
  var input;
  for (x = 0; x < this.inputList.length; x++) {
    input = this.inputList[x];
    input.dispose();
  }
  this.inputList = [];
  // Dispose of any remaining connections (next/previous/output).
  var connections = this.getConnections_(true);
  for (x = 0; x < connections.length; x++) {
    var connection = connections[x];
    if (connection.targetConnection) {
      connection.disconnect();
    }
    connections[x].dispose();
  }
  // Dispose of the SVG and break circular references.
  if (this.svg_) {
    this.svg_.dispose();
    this.svg_ = null;
  }

  this.blockEvents.dispatchEvent(Blockly.Block.EVENTS.AFTER_DISPOSED);
  updateBlockSpaceCallback();
};

/**
 * Unplug this block from its superior block.  If this block is a statement,
 * optionally reconnect the block underneath with the block on top.
 * @param {boolean} healStack Disconnect child statement and reconnect stack.
 * @param {boolean} bump Move the unplugged block sideways a short distance.
 */
Blockly.Block.prototype.unplug = function(healStack, bump) {
  bump = bump && !!this.getParent();
  if (this.outputConnection) {
    if (this.outputConnection.targetConnection) {
      // Disconnect from any superior block.
      this.setParent(null);
    }
  } else {
    var previousTarget = null;
    if (this.previousConnection && this.previousConnection.targetConnection) {
      // Remember the connection that any next statements need to connect to.
      previousTarget = this.previousConnection.targetConnection;
      // Detach this block from the parent's tree.
      this.setParent(null);
    }
    if (
      healStack &&
      this.nextConnection &&
      this.nextConnection.targetConnection
    ) {
      // Disconnect the next statement.
      var nextTarget = this.nextConnection.targetConnection;
      var nextBlock = this.nextConnection.targetBlock();
      nextBlock.setParent(null);
      if (previousTarget) {
        // Attach the next statement to the previous statement.
        previousTarget.connect(nextTarget);
      }
    }
  }
  if (bump) {
    // Bump the block sideways.
    var dx = Blockly.SNAP_RADIUS * (Blockly.RTL ? -1 : 1);
    var dy = Blockly.SNAP_RADIUS * 2;
    this.moveBy(dx, dy);
  }
};

/**
 * Return the coordinates of the top-left corner of this block relative to the
 * drawing surface's origin (0,0).
 * @return {!Object} Object with .x and .y properties.
 */
Blockly.Block.prototype.getRelativeToSurfaceXY = function() {
  var x = 0;
  var y = 0;
  var elementIsRootCanvas = false;
  if (this.svg_) {
    var element = this.svg_.getRootElement();
    do {
      // Loop through this block and every parent.
      var xy = Blockly.getRelativeXY(element);
      x += xy.x;
      y += xy.y;
      element = element.parentNode;
      elementIsRootCanvas =
        element == this.blockSpace.getCanvas() ||
        element == this.blockSpace.getDragCanvas();
    } while (element && !elementIsRootCanvas);
  }
  return {x: x, y: y};
};

/**
 * Move a block to a specific location on the drawing surface.
 * @param {number} x Horizontal location.
 * @param {number} y Vertical location.
 */
Blockly.Block.prototype.moveTo = function(x, y) {
  var oldXY = this.getRelativeToSurfaceXY();
  this.svg_
    .getRootElement()
    .setAttribute('transform', 'translate(' + x + ', ' + y + ')');
  this.moveConnections_(x - oldXY.x, y - oldXY.y);
};

/**
 * Move a block by a relative offset.
 * @param {number} dx Horizontal offset.
 * @param {number} dy Vertical offset.
 */
Blockly.Block.prototype.moveBy = function(dx, dy) {
  var xy = this.getRelativeToSurfaceXY();
  this.svg_
    .getRootElement()
    .setAttribute(
      'transform',
      'translate(' + (xy.x + dx) + ', ' + (xy.y + dy) + ')'
    );
  this.moveConnections_(dx, dy);
};

/**
 * Gets box dimensions of block
 * @returns {goog.math.Box}
 */
Blockly.Block.prototype.getBox = function() {
  var heightWidth = this.getHeightWidth();
  var xy = this.getRelativeToSurfaceXY();

  // Account for left notch
  if (this.outputConnection) {
    xy.x -= Blockly.BlockSvg.TAB_WIDTH;
  }

  return new goog.math.Box(
    xy.y,
    xy.x + heightWidth.width,
    xy.y + heightWidth.height,
    xy.x
  );
};

/**
 * Returns the padding of the SVG or null if none exists
 * @return {Object} object with padding values for top, bottom, left, and right
 */
Blockly.Block.prototype.getSvgPadding = function() {
  return this.svg_ && this.svg_.getPadding();
};

/**
 * Returns a bounding box describing the dimensions of this block.
 * @return {!Object} Object with height and width properties.
 */
Blockly.Block.prototype.getHeightWidth = function() {
  var bBox;

  try {
    var ie10OrOlder = Blockly.ieVersion() && Blockly.ieVersion() <= 10;
    var initialStyle;

    if (ie10OrOlder) {
      // Required to set display to inline during calculation in IE <= 10
      initialStyle = this.getSvgRoot().style.display;
      this.getSvgRoot().style.display = 'inline';
    }

    bBox = goog.object.clone(this.getSvgRoot().getBBox());

    if (ie10OrOlder) {
      // Reset to original display value
      this.getSvgRoot().style.display = initialStyle;
    }
  } catch (e) {
    // Firefox has trouble with hidden elements (Bug 528969).
    return {height: 0, width: 0};
  }

  var expectedBBoxY = 0;

  if (Blockly.BROKEN_CONTROL_POINTS) {
    /* HACK:
     WebKit bug 67298 causes control points to be included in the reported
     bounding box.  The render functions (below) add two 5px spacer control
     points that we need to subtract.
    */
    bBox.height -= 10;
    if (this.nextConnection) {
      // Bottom control point partially masked by lower tab.
      bBox.height += 4;
    }
    /**
     * We would expect bBox.y to be 0, but with broken control points,
     * we'll expect it to be -5 (since we added an extra control point for
     * measurement).
     */
    expectedBBoxY = -5;
  }

  if (bBox.height > 0) {
    // Subtract one from the height due to the shadow.
    bBox.height -= 1;
  }

  /**
   * When <text> or other child content's boundaries extend beyond tops of
   * blocks (e.g. due to IE MSDN issue #791152), bBox.y ends up being < 0.
   * Here we add bBox.y (which is otherwise typically 0) to the height to
   * discount the above-block content distance.
   */
  var bboxYDifference = bBox.y - expectedBBoxY;
  var heightWithoutContentAboveTop = bBox.height + bboxYDifference;
  bBox.height = Math.max(0, heightWithoutContentAboveTop);

  return bBox;
};

/**
 * Handle a mouse-down on an SVG block.
 * @param {!Event} e Mouse down event.
 * @private
 */
Blockly.Block.prototype.onMouseDown_ = function(e) {
  // Stop the browser from scrolling/zooming the page
  e.preventDefault();

  // If we're clicking on an input target, don't do anything with the event
  // at the block level
  var targetClass = e.target.getAttribute && e.target.getAttribute('class');
  if (targetClass === 'inputClickTarget') {
    e.stopPropagation();
    return;
  }

  // ...but this prevents blurring of inputs, so do it manually
  document.activeElement &&
    document.activeElement.blur &&
    document.activeElement.blur();

  if (this.isInFlyout) {
    return;
  }
  // Update Blockly's knowledge of its own location.
  this.blockSpace.blockSpaceEditor.svgResize();
  Blockly.BlockSpaceEditor.terminateDrag_();

  this.select();

  this.blockSpace.blockSpaceEditor.hideChaff();

  if (Blockly.isRightButton(e)) {
    // Right-click.
    // Only show context menus for level editors
    if (Blockly.editBlocks) {
      this.showContextMenu_(e);
    }
  } else if (
    this.blockSpace.isMovementLocked() ||
    !this.isMovable() ||
    !this.canDisconnectFromParent()
  ) {
    // Allow unmovable blocks to be selected and context menued, but not
    // dragged.  Let this event bubble up to document, so the blockSpace may be
    // dragged instead.
    return;
  } else {
    // Left-click (or middle click)
    // If the block should duplicate on drag, duplicate the block, pass the click event
    // to the duplicated block, and return from this block's click event
    if (this.shouldCopyOnDrag()) {
      var dup = this.duplicate_();
      dup.setParentForCopyOnDrag(null);
      dup.onMouseDown_(e);
      return;
    }
    Blockly.removeAllRanges();
    this.setIsUnused(false);
    this.blockSpace.blockSpaceEditor.setCursor(Blockly.Css.Cursor.CLOSED);
    // Look up the current translation and record it.
    var xy = this.getRelativeToSurfaceXY();
    this.startDragX = xy.x;
    this.startDragY = xy.y;

    // If we were given the start drag location, use that.
    if (e.startDragMouseX_ !== undefined && e.startDragMouseY_ !== undefined) {
      this.startDragMouseX = e.startDragMouseX_;
      this.startDragMouseY = e.startDragMouseY_;
      e.startDragMouseX_ = undefined;
      e.startDragMouseY_ = undefined;
    } else {
      // Record the current mouse position.
      this.startDragMouseX = e.clientX;
      this.startDragMouseY = e.clientY;
    }

    Blockly.Block.dragMode_ = Blockly.Block.DRAG_MODE_INSIDE_STICKY_RADIUS;
    Blockly.Block.onMouseUpWrapper_ = Blockly.bindEvent_(
      document,
      'mouseup',
      this,
      this.onMouseUp_
    );
    Blockly.Block.onMouseMoveWrapper_ = Blockly.bindEvent_(
      document,
      'mousemove',
      this,
      this.onMouseMove_
    );
    // Build a list of bubbles that need to be moved and where they started.
    this.draggedBubbles_ = [];
    var descendants = this.getDescendants();
    for (var x = 0, descendant; (descendant = descendants[x]); x++) {
      var icons = descendant.getIcons();
      for (var y = 0; y < icons.length; y++) {
        var data = icons[y].getIconLocation();
        data.bubble = icons[y];
        this.draggedBubbles_.push(data);
      }
    }
  }
  // This event has been handled.  No need to bubble up to the document.
  e.stopPropagation();
};

/**
 * Handle a mouse-up anywhere in the SVG pane.  Is only registered when a
 * block is clicked.  We can't use mouseUp on the block since a fast-moving
 * cursor can briefly escape the block before it catches up.
 * @param {!Event} e Mouse up event.
 * @private
 */
Blockly.Block.prototype.onMouseUp_ = function(e) {
  var thisBlockSpace = this.blockSpace;
  Blockly.BlockSpaceEditor.terminateDrag_();
  if (Blockly.selected && Blockly.highlightedConnection_) {
    // Connect two blocks together.
    Blockly.localConnection_.connect(Blockly.highlightedConnection_);
    if (this.svg_) {
      // Trigger a connection animation.
      // Determine which connection is inferior (lower in the source stack).
      var inferiorConnection;
      if (Blockly.localConnection_.isSuperior()) {
        inferiorConnection = Blockly.highlightedConnection_;
      } else {
        inferiorConnection = Blockly.localConnection_;
      }
      inferiorConnection.sourceBlock_.svg_.connectionUiEffect();
    }
    if (thisBlockSpace.trashcan) {
      // Don't throw an object in the trash can if it just got connected.
      thisBlockSpace.trashcan.close();
    }
  } else if (
    Blockly.selected &&
    Blockly.selected.areBlockAndDescendantsDeletable() &&
    thisBlockSpace.isDeleteArea(e.clientX, e.clientY, this.startDragMouseX)
  ) {
    // The ordering of the statement above is important because isDeleteArea()
    // has a side effect of opening the trash can.
    var trashcan = thisBlockSpace.trashcan;
    if (trashcan) {
      window.setTimeout(trashcan.close.bind(trashcan), 100);
    }
    Blockly.selected.dispose(false, true);
    if (Blockly.topLevelProcedureAutopopulate && this.isFunctionDefinition()) {
      window.setTimeout(function() {
        thisBlockSpace.blockSpaceEditor.updateFlyout();
      }, 0);
    }
    // Dropping a block on the trash can will usually cause the blockSpace to
    // resize to contain the newly positioned block.  Force a second resize now
    // that the block has been deleted.
    Blockly.fireUiEvent(window, 'resize');
  }

  if (Blockly.selected) {
    Blockly.selected.setIsUnused();
    var shadowBlocks = getShadowBlocksInStack(Blockly.selected);
    shadowBlocks.forEach(function(block) {
      var sourceBlock = block.blockToShadow_(block.getRootBlock());
      block.shadowBlockValue_(sourceBlock);
    });
  }

  if (Blockly.highlightedConnection_) {
    Blockly.highlightedConnection_.unhighlight();
    Blockly.highlightedConnection_ = null;
  }
  thisBlockSpace.hideDelete();
  thisBlockSpace.blockSpaceEditor.setCursor(Blockly.Css.Cursor.OPEN);
};

/**
 * Load the block's help page in a new window.
 * @private
 */
Blockly.Block.prototype.showHelp_ = function() {
  var url = goog.isFunction(this.helpUrl) ? this.helpUrl() : this.helpUrl;
  if (url) {
    window.open(url);
  }
};

/**
 * Duplicate this block and its children.
 * @return {!Blockly.Block} The duplicate.
 * @private
 */
Blockly.Block.prototype.duplicate_ = function() {
  // Create a duplicate via XML.
  var xmlBlock = Blockly.Xml.blockToDom(this);
  Blockly.Xml.deleteNext(xmlBlock);
  var newBlock = Blockly.Xml.domToBlock(
    /** @type {!Blockly.BlockSpace} */ (this.blockSpace),
    xmlBlock
  );
  // Move the duplicate next to the old block.
  var xy = this.getRelativeToSurfaceXY();
  // If this is a duplicate on drag, off-set the block by 1 pixel
  var snapRadius = this.shouldCopyOnDrag() ? 1 : Blockly.SNAP_RADIUS;
  if (Blockly.RTL) {
    xy.x -= snapRadius;
  } else {
    xy.x += snapRadius;
  }
  xy.y += snapRadius * 2;
  newBlock.moveBy(xy.x, xy.y);
  return newBlock;
};

/**
 * Show the context menu for this block.
 * @param {!Event} e Mouse event
 * @private
 */
Blockly.Block.prototype.showContextMenu_ = function(e) {
  if (this.blockSpace.isReadOnly() || !this.contextMenu) {
    return;
  }
  // Save the current block in a variable for use in closures.
  var block = this;
  var options = [];

  if (this.isDeletable() && !block.isInFlyout) {
    // Option to duplicate this block.
    var duplicateOption = {
      text: Blockly.Msg.DUPLICATE_BLOCK,
      enabled: true,
      callback: function() {
        block.duplicate_();
      }
    };
    if (this.getDescendants().length > this.blockSpace.remainingCapacity()) {
      duplicateOption.enabled = false;
    }
    options.push(duplicateOption);

    // Option to disable/enable block.
    var disableOption = {
      text: this.disabled
        ? Blockly.Msg.ENABLE_BLOCK
        : Blockly.Msg.DISABLE_BLOCK,
      enabled: !this.getInheritedDisabled(),
      callback: function() {
        block.setDisabled(!block.disabled);
      }
    };
    options.push(disableOption);

    // Option to delete this block.
    // Count the number of blocks that are nested in this block.
    var descendantCount = this.getDescendants().length;
    if (block.nextConnection && block.nextConnection.targetConnection) {
      // Blocks in the current stack would survive this block's deletion.
      descendantCount -= this.nextConnection.targetBlock().getDescendants()
        .length;
    }
    var deleteOption = {
      text:
        descendantCount == 1
          ? Blockly.Msg.DELETE_BLOCK
          : Blockly.Msg.DELETE_X_BLOCKS.replace('%1', descendantCount),
      enabled: true,
      callback: function() {
        block.dispose(true, true);
      }
    };
    options.push(deleteOption);
  }

  // Block-editor-only options
  // Do not need to be localized
  if (Blockly.editBlocks) {
    // uservisible
    var userVisibleOption = {
      text: this.userVisible_
        ? 'Make Invisible to Users'
        : 'Make Visible to Users',
      enabled: true,
      callback: function() {
        block.setUserVisible(!block.isUserVisible());
        Blockly.ContextMenu.hide();
      }
    };
    options.push(userVisibleOption);

    // deletable
    var deletableOption = {
      text: this.deletable_
        ? 'Make Undeletable to Users'
        : 'Make Deletable to Users',
      enabled: true,
      callback: function() {
        block.setDeletable(!block.isDeletable());
        Blockly.ContextMenu.hide();
      }
    };
    options.push(deletableOption);

    // movable
    var movableOption = {
      text: this.movable_ ? 'Make Immovable to Users' : 'Make Movable to Users',
      enabled: true,
      callback: function() {
        block.setMovable(!block.isMovable());
        Blockly.ContextMenu.hide();
      }
    };
    options.push(movableOption);

    // next connection disabled
    var nextConnectionDisabledOption = {
      text: this.nextConnectionDisabled_
        ? 'Enable Next Connection'
        : 'Disable Next Connection',
      enabled: true,
      callback: function() {
        block.setNextConnectionDisabled(!block.nextConnectionDisabled_);
        Blockly.ContextMenu.hide();
      }
    };
    options.push(nextConnectionDisabledOption);

    // editable
    var editableOption = {
      text: this.editable_ ? 'Make Uneditable' : 'Make editable',
      enabled: true,
      callback: function() {
        block.setEditable(!block.isEditable());
        Blockly.ContextMenu.hide();
      }
    };
    options.push(editableOption);

    // can disconnect from parent
    var canDisconnectFromParentOption = {
      text: this.canDisconnectFromParent_
        ? 'Lock to Parent Block'
        : 'Unlock from Parent Block',
      enabled: true,
      callback: function() {
        block.setCanDisconnectFromParent(!block.canDisconnectFromParent_);
        Blockly.ContextMenu.hide();
      }
    };
    options.push(canDisconnectFromParentOption);

    // limit
    var getCurrentLimit = function() {
      return block.blockSpace.blockSpaceEditor.blockLimits.getLimit(block.type);
    };
    var limitOption = {
      text: 'Set limit (current: ' + (getCurrentLimit() || 'none') + ')',
      enabled: true,
      callback: function() {
        block.blockSpace.blockSpaceEditor.blockLimits.setLimit(
          block.type,
          prompt('New Limit', getCurrentLimit())
        );
      }
    };
    options.push(limitOption);

    if (this.getCustomContextMenuItems) {
      options = options.concat(this.getCustomContextMenuItems());
    }
  }

  // Allow the block to add or modify options.
  if (this.customContextMenu && !block.isInFlyout) {
    this.customContextMenu(options);
  }

  Blockly.ContextMenu.show(e, options);
  Blockly.ContextMenu.currentBlock = this;
};

/**
 * Returns all connections originating from this block.
 * @param {boolean} all If true, return all connections even hidden ones.
 *     Otherwise return those that are visible.
 * @return {!Array.<!Blockly.Connection>} Array of connections.
 * @private
 */
Blockly.Block.prototype.getConnections_ = function(all) {
  var myConnections = [];
  if (all || this.rendered) {
    if (this.outputConnection) {
      myConnections.push(this.outputConnection);
    }
    if (this.nextConnection) {
      myConnections.push(this.nextConnection);
    }
    if (this.previousConnection) {
      myConnections.push(this.previousConnection);
    }
    if (all || !this.collapsed_) {
      for (var x = 0, input; (input = this.inputList[x]); x++) {
        if (input.connection) {
          myConnections.push(input.connection);
        }
      }
    }
  }
  return myConnections;
};

/**
 * Return all leaf connections originating from this block (i.e. open connections
 * on this block or any descendants)
 * @param {Blockly.Block} source The source block we've connected from.  We will
 *    avoid traversing back to that block.
 * @return {!Array.<!Blockly.Connection>} Array of connections.
 * @private
 */
Blockly.Block.prototype.getLeafConnections_ = function(source) {
  var self = this;
  var leaves = [];
  var allConnections = [
    this.outputConnection,
    this.nextConnection,
    this.previousConnection
  ];
  this.inputList.forEach(function(input) {
    allConnections.push(input.connection);
  });
  allConnections.forEach(function(connection) {
    if (!connection) {
      return;
    }
    var targetBlock = connection.targetBlock();
    if (!targetBlock) {
      // this is a leaf
      leaves.push(connection);
    } else if (targetBlock !== source) {
      // traverse target for leaves
      leaves = leaves.concat(targetBlock.getLeafConnections_(self));
    }
  });

  return leaves;
};

/**
 * Move the connections for this block and all blocks attached under it.
 * Also update any attached bubbles.
 * @param {number} dx Horizontal offset from current location.
 * @param {number} dy Vertical offset from current location.
 * @private
 */
Blockly.Block.prototype.moveConnections_ = function(dx, dy) {
  if (!this.rendered) {
    // Rendering is required to lay out the blocks.
    // This is probably an invisible block attached to a collapsed block.
    return;
  }
  var myConnections = this.getConnections_(false);
  var x;
  for (x = 0; x < myConnections.length; x++) {
    myConnections[x].moveBy(dx, dy);
  }
  var icons = this.getIcons();
  for (x = 0; x < icons.length; x++) {
    icons[x].computeIconLocation();
  }

  // Recurse through all blocks attached under this one.
  for (x = 0; x < this.childBlocks_.length; x++) {
    this.childBlocks_[x].moveConnections_(dx, dy);
  }
};

/**
 * Recursively adds or removes the dragging class to this node and its children.
 * @param {boolean} adding True if adding, false if removing.
 * @private
 */
Blockly.Block.prototype.setDragging_ = function(adding) {
  this.setDraggingHandleImmovable_(adding, null);
};

/**
 * Determine whether block is being dragged
 * @returns {boolean} True if block is being dragged
 * @private
 */
Blockly.Block.prototype.getDragging = function() {
  return this.dragging_;
};

/**
 * Recursively adds or removes the dragging class to this node and its children.
 * @param {boolean} adding True if adding, false if removing.
 * @param {function} immovableBlockHandler callback when immovable block is found
 * @private
 */
Blockly.Block.prototype.setDraggingHandleImmovable_ = function(
  adding,
  immovableBlockHandler
) {
  if (adding) {
    this.dragging_ = true;
    this.svg_.addDragging();
  } else {
    this.dragging_ = false;
    this.svg_.removeDragging();
  }

  // Recurse through all blocks attached under this one.
  for (var x = 0; x < this.childBlocks_.length; x++) {
    var block = this.childBlocks_[x];
    if (adding && immovableBlockHandler !== null && !block.isMovable()) {
      immovableBlockHandler(block);
      break;
    }

    block.setDraggingHandleImmovable_(adding, immovableBlockHandler);
  }
};

/**
 * @param {boolean} canDisconnect
 */
Blockly.Block.prototype.setCanDisconnectFromParent = function(canDisconnect) {
  this.canDisconnectFromParent_ = canDisconnect;
};

/**
 * @returns {boolean}
 */
Blockly.Block.prototype.canDisconnectFromParent = function() {
  return this.canDisconnectFromParent_;
};

/**
 * Move the block's svg into the drag-layer SVGGElement
 * @private
 */
Blockly.Block.prototype.moveToDragCanvas_ = function() {
  if (!this.svg_) {
    return;
  }
  this.blockSpace.moveElementToDragCanvas(this.svg_.getRootElement());
};

/**
 * Move the block's svg into the regular canvas SVGGElement
 * @private
 */
Blockly.Block.prototype.moveToFrontOfMainCanvas_ = function() {
  if (!this.svg_) {
    return;
  }
  this.blockSpace.moveElementToMainCanvas(this.svg_.getRootElement());
};

Blockly.Block.prototype.moveBlockBeingDragged_ = function(
  mouseX,
  mouseY,
  singleBlock
) {
  Blockly.removeAllRanges();
  var dx = mouseX - this.startDragMouseX;
  var dy = mouseY - this.startDragMouseY;

  if (Blockly.Block.dragMode_ == Blockly.Block.DRAG_MODE_INSIDE_STICKY_RADIUS) {
    // Still dragging within the sticky DRAG_RADIUS.
    var dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    if (dr > Blockly.DRAG_RADIUS) {
      // Switch to unrestricted dragging.
      Blockly.Block.dragMode_ = Blockly.Block.DRAG_MODE_FREELY_DRAGGING;
      // Push this block to the very top of the stack.
      var firstImmovableBlockHandler = this.generateReconnector_(
        this.previousConnection
      );
      if (singleBlock) {
        this.unplug(true, false);
      }
      this.setParent(null);
      this.setDraggingHandleImmovable_(true, firstImmovableBlockHandler);
      this.moveToDragCanvas_();
      this.blockSpace.recordPickedUpBlockOrigin();
      this.blockSpace.recordDeleteAreas();
    }
  }
  if (Blockly.Block.dragMode_ == Blockly.Block.DRAG_MODE_FREELY_DRAGGING) {
    // Unrestricted dragging.
    var x = this.startDragX + dx;
    var y = this.startDragY + dy;
    this.svg_
      .getRootElement()
      .setAttribute('transform', 'translate(' + x + ', ' + y + ')');
    // Drag all the nested bubbles.
    var i;
    for (i = 0; i < this.draggedBubbles_.length; i++) {
      var data = this.draggedBubbles_[i];
      data.bubble.setIconLocation(data.x + dx, data.y + dy);
    }

    // Check to see if any of this block's connections are within range of
    // another block's connection.
    var myConnections = this.getLeafConnections_(null);
    var closestConnection = null;
    var localConnection = null;
    var radiusConnection = Blockly.SNAP_RADIUS;
    for (i = 0; i < myConnections.length; i++) {
      var myConnection = myConnections[i];
      var neighbour = myConnection.closest(radiusConnection, dx, dy);
      if (neighbour.connection) {
        closestConnection = neighbour.connection;
        localConnection = myConnection;
        radiusConnection = neighbour.radius;
      }
    }

    // Remove connection highlighting if needed.
    var oldConnection = null;
    if (
      Blockly.highlightedConnection_ &&
      Blockly.highlightedConnection_ != closestConnection
    ) {
      Blockly.highlightedConnection_.unhighlight();
      oldConnection = Blockly.highlightedConnection_;
      oldConnection.sourceBlock_.pendingConnection(
        oldConnection,
        closestConnection
      );
      Blockly.highlightedConnection_ = null;
      Blockly.localConnection_ = null;
    }
    // Add connection highlighting if needed.
    if (
      closestConnection &&
      closestConnection != Blockly.highlightedConnection_
    ) {
      closestConnection.highlight();
      Blockly.highlightedConnection_ = closestConnection;
      closestConnection.sourceBlock_.pendingConnection(
        oldConnection,
        closestConnection
      );
      Blockly.localConnection_ = localConnection;
    }

    // Provide visual indication of whether the block will be
    // deleted if dropped here.
    var undeletable = !this.areBlockAndDescendantsDeletable();
    this.blockSpace.isDeleteArea(
      mouseX,
      mouseY,
      this.startDragMouseX,
      undeletable
    );
  }
};

/**
 * This is called when a block is dragged to or away from one of this block's
 * inputs. Override in subclasses if needed.
 * @param oldConnection
 * @param newConnection
 */
Blockly.Block.prototype.pendingConnection = function() {};

/**
 * Drag this block to follow the mouse.
 * @param {!Event} e Mouse move event.
 * @private
 */
Blockly.Block.prototype.onMouseMove_ = function(e) {
  if (
    e.type == 'mousemove' &&
    e.clientX <= 1 &&
    e.clientY == 0 &&
    e.button == 0
  ) {
    /* HACK:
     Safari Mobile 6.0 and Chrome for Android 18.0 fire rogue mousemove events
     on certain touch actions. Ignore events with these signatures.
     This may result in a one-pixel blind spot in other browsers,
     but this shouldn't be noticable. */
    e.stopPropagation();
    return;
  }
  this.moveBlockBeingDragged_(e.clientX, e.clientY, e.ctrlKey || e.metaKey);
  this.blockSpace.panIfOverEdge(this, e.clientX, e.clientY);
  // This event has been handled.  No need to bubble up to the document.
  e.stopPropagation();
};

/**
 * Generates a callback that takes in a block and connects its `previousConnection` to the given `earlierConnection`
 * and disconnects any previous connection
 * @param earlierConnection {Connection}
 * @returns {Function}
 * @private
 */
Blockly.Block.prototype.generateReconnector_ = function(earlierConnection) {
  var earlierNextConnection;

  if (earlierConnection && earlierConnection.targetConnection) {
    earlierNextConnection = earlierConnection.targetConnection;
  }

  return function(block) {
    if (block.previousConnection) {
      block.setParent(null);
      earlierNextConnection &&
        earlierNextConnection.connect(block.previousConnection);
    }
  };
};

/**
 * Bump unconnected blocks out of alignment.  Two blocks which aren't actually
 * connected should not coincidentally line up on screen.
 * @private
 */
Blockly.Block.prototype.bumpNeighbours = function() {
  if (Blockly.Block.isDragging() || !Blockly.BUMP_UNCONNECTED) {
    // Don't bump blocks during a drag.
    return;
  }
  var rootBlock = this.getRootBlock();
  if (rootBlock.isInFlyout) {
    // Don't move blocks around in a flyout.
    return;
  }
  // Loop though every connection on this block.
  var myConnections = this.getConnections_(false);
  for (var x = 0; x < myConnections.length; x++) {
    var connection = myConnections[x];
    // Spider down from this block bumping all sub-blocks.
    if (connection.targetConnection && connection.isSuperior()) {
      connection.targetBlock().bumpNeighbours();
    }

    var neighbours = connection.neighbours_(Blockly.SNAP_RADIUS);
    for (var y = 0; y < neighbours.length; y++) {
      var otherConnection = neighbours[y];
      // If both connections are connected, that's probably fine.  But if
      // either one of them is unconnected, then there could be confusion.
      if (connection.targetConnection && otherConnection.targetConnection) {
        continue;
      }
      // Only bump blocks if they are from different tree structures.
      var otherRootBlock = otherConnection.sourceBlock_.getRootBlock();
      if (otherRootBlock === rootBlock) {
        continue;
      }

      var bumpOther = false;
      // If one is connected and the other is unconnected, always bump the
      // unconnected block.
      if (connection.targetConnection && !otherConnection.targetConnection) {
        bumpOther = true;
      } else if (
        !connection.targetConnection &&
        otherConnection.targetConnection
      ) {
        bumpOther = false;
      } else if (connection.type !== otherConnection.type) {
        // When bumping connections of opposite types, always bump the inferior block.
        bumpOther = connection.isSuperior();
      } else {
        // Otherwise bump the block that is lower on the screen.
        var rootY = rootBlock.getRelativeToSurfaceXY().y;
        var otherY = otherRootBlock.getRelativeToSurfaceXY().y;
        bumpOther = rootY < otherY;
      }

      if (bumpOther) {
        otherConnection.bumpAwayFrom_(connection);
      } else {
        connection.bumpAwayFrom_(otherConnection);
      }
    }
  }
};

/**
 * Return the parent block or null if this block is at the top level.
 * @return {Blockly.Block} The block that holds the current block.
 */
Blockly.Block.prototype.getParent = function() {
  // Look at the DOM to see if we are nested in another block.
  return this.parentBlock_;
};

/**
 * Return the parent block that surrounds the current block, or null if this
 * block has no surrounding block.  A parent block might just be the previous
 * statement, whereas the surrounding block is an if statement, while loop, etc.
 * @return {Blockly.Block} The block that surrounds the current block.
 */
Blockly.Block.prototype.getSurroundParent = function() {
  var block = this;
  do {
    var prevBlock = block;
    block = block.getParent();
    if (!block) {
      // Ran off the top.
      return null;
    }
  } while (
    block.nextConnection &&
    block.nextConnection.targetBlock() == prevBlock
  );
  // This block is an enclosing parent, not just a statement in a stack.
  return block;
};

/**
 * Return the top-most block in this block's tree.
 * This will return itself if this block is at the top level.
 * @return {!Blockly.Block} The root block.
 */
Blockly.Block.prototype.getRootBlock = function() {
  var rootBlock;
  var block = this;
  do {
    rootBlock = block;
    block = rootBlock.parentBlock_;
  } while (block);
  return rootBlock;
};

/**
 * Find all the blocks that are directly nested inside this one.
 * Includes value and block inputs, as well as any following statement.
 * Excludes any connection on an output tab or any preceding statement.
 * @return {!Array.<!Blockly.Block>} Array of blocks.
 */
Blockly.Block.prototype.getChildren = function() {
  return this.childBlocks_;
};

/**
 * Traverses the block stack rooted at topBlock and returns a list of all
 * the blocks in the stack that have blockToShadow_ set.
 * @param {Blockly.Block} topBlock - root of the block stack to traverse
 * @return {!Array.<!Blockly.Block>} Array of shadow blocks
 */
function getShadowBlocksInStack(topBlock) {
  var shadowBlocks = [];
  var queue = [topBlock];
  while (queue.length) {
    var block = queue.shift();
    if (block.blockToShadow_) {
      shadowBlocks.push(block);
    }
    queue = queue.concat(block.childBlocks_);
  }
  return shadowBlocks;
}

/**
 * Set parent of this block to be a new block or null.
 * @param {Blockly.Block} newParent New parent block.
 */
Blockly.Block.prototype.setParent = function(newParent) {
  var oldParent = this.parentBlock_;
  if (this.parentBlock_) {
    // Remove this block from the old parent's child list.
    var children = this.parentBlock_.childBlocks_;
    for (var child, x = 0; (child = children[x]); x++) {
      if (child == this) {
        children.splice(x, 1);
        break;
      }
    }
    // Move this block up the DOM.  Keep track of x/y translations.
    var xy = this.getRelativeToSurfaceXY();
    this.moveToFrontOfMainCanvas_();
    this.svg_
      .getRootElement()
      .setAttribute('transform', 'translate(' + xy.x + ', ' + xy.y + ')');

    // Disconnect from superior blocks.
    this.parentBlock_ = null;
    if (this.previousConnection && this.previousConnection.targetConnection) {
      this.previousConnection.disconnect();
    }
    if (this.outputConnection && this.outputConnection.targetConnection) {
      this.outputConnection.disconnect();
    }
    // This block hasn't actually moved on-screen, so there's no need to update
    // its connection locations.
  } else {
    // Remove this block from the blockSpace's list of top-most blocks.
    this.blockSpace.removeTopBlock(this);
    this.setIsUnused();
  }

  this.parentBlock_ = newParent;
  if (newParent) {
    // Add this block to the new parent's child list.
    newParent.childBlocks_.push(this);

    // Account for the transform added by the relative position of the parent.
    var oldXY = this.getRelativeToSurfaceXY();
    var parentXY = newParent.getRelativeToSurfaceXY();
    this.svg_
      .getRootElement()
      .setAttribute(
        'transform',
        'translate(' +
          (oldXY.x - parentXY.x) +
          ', ' +
          (oldXY.y - parentXY.y) +
          ')'
      );

    if (newParent.svg_ && this.svg_) {
      newParent.svg_.getRootElement().appendChild(this.svg_.getRootElement());
    }
    var newXY = this.getRelativeToSurfaceXY();
    // Move the connections to match the child's new position.
    this.moveConnections_(newXY.x - oldXY.x, newXY.y - oldXY.y);
  } else {
    this.blockSpace.addTopBlock(this);
  }
  var shadowBlocks, miniToolboxBlocks, rootInputBlocks, sourceBlock;
  if (
    newParent &&
    newParent.miniFlyout &&
    this.type === 'gamelab_allSpritesWithAnimation'
  ) {
    // Add a sprite block to an event socket
    if (newParent.isMiniFlyoutOpen) {
      miniToolboxBlocks = newParent.miniFlyout.blockSpace_.topBlocks_;
      rootInputBlocks = newParent
        .getConnections_(true /* all */)
        .filter(function(connection) {
          return connection.type === Blockly.INPUT_VALUE;
        })
        .map(function(connection) {
          return connection.targetBlock();
        });
      miniToolboxBlocks.forEach(function(block, index) {
        block.shadowBlockValue_(rootInputBlocks[index]);
      });
    }

    shadowBlocks = getShadowBlocksInStack(newParent);
    // We only care about shadow blocks that are shadowing this source block.
    shadowBlocks = shadowBlocks.filter(function(block) {
      return block.blockToShadow_(newParent) === this;
    }, this);
    this.setShadowBlocks(shadowBlocks);
    shadowBlocks.forEach(function(block) {
      sourceBlock = block.blockToShadow_(block.getRootBlock());
      block.shadowBlockValue_(sourceBlock);
    });
    newParent.render();
  } else if (newParent && newParent.getRootBlock().miniFlyout) {
    // Add a block stack to an event stack
    shadowBlocks = getShadowBlocksInStack(this);
    shadowBlocks.forEach(function(block) {
      sourceBlock = block.blockToShadow_(block.getRootBlock());
      block.shadowBlockValue_(sourceBlock);
    });
  }
  if (
    oldParent &&
    oldParent.miniFlyout &&
    this.type === 'gamelab_allSpritesWithAnimation'
  ) {
    // Remove a sprite block from an event socket
    if (oldParent.isMiniFlyoutOpen) {
      miniToolboxBlocks = oldParent.miniFlyout.blockSpace_.topBlocks_;
      rootInputBlocks = oldParent
        .getConnections_(true /* all */)
        .filter(function(connection) {
          return connection.type === Blockly.INPUT_VALUE;
        })
        .map(function(connection) {
          return connection.targetBlock();
        });
      miniToolboxBlocks.forEach(function(block, index) {
        block.shadowBlockValue_(rootInputBlocks[index]);
      });
    }

    this.setShadowBlocks([]);
    shadowBlocks = getShadowBlocksInStack(oldParent);
    shadowBlocks.forEach(function(block) {
      sourceBlock = block.blockToShadow_(block.getRootBlock());
      block.shadowBlockValue_(sourceBlock);
    });
  } else if (oldParent && oldParent.getRootBlock().miniFlyout) {
    // Remove a block stack from an event stack
    shadowBlocks = getShadowBlocksInStack(this);
    shadowBlocks.forEach(function(block) {
      sourceBlock = block.blockToShadow_(block.getRootBlock());
      block.shadowBlockValue_(sourceBlock);
    });
  }
};

/**
 * Sets the value of this block to the value of the source block specified.
 * Adds a reference to this block in the source block so the value can be updated when the
 * source block's value changes
 * @private
 * @param {Blockly.Block} sourceBlock - the block whose value to shadow
 */
Blockly.Block.prototype.shadowBlockValue_ = function(sourceBlock) {
  if (this.blockToShadow_) {
    var root = this.getRootBlock();
    if (root.isCurrentlyBeingDragged()) {
      return;
    }
    var previewField, textField;
    if (sourceBlock && sourceBlock.type === 'gamelab_allSpritesWithAnimation') {
      // Only works with allSpritesWithAnimation blocks
      var sourceField = sourceBlock.inputList[0].titleRow[0];

      // Only works with clicked/subject/object pointer blocks
      previewField = this.inputList[0].titleRow[1];
      textField = this.inputList[0].titleRow[0];

      previewField.setText(
        sourceField.previewElement_.getAttribute('xlink:href')
      );
      previewField.updateDimensions_(this.thumbnailSize, this.thumbnailSize);
      textField.setText(this.shortString);

      // Add this block to the list of blocks to update when the sprite dropdown field is changed.
      sourceBlock.addShadowBlock(this);
    } else {
      previewField = this.inputList[0].titleRow[1];
      textField = this.inputList[0].titleRow[0];
      previewField.setText('');
      previewField.updateDimensions_(1, this.thumbnailSize);
      textField.setText(this.longString);
    }
  }
};

/**
 * Tracks a block to keep in sync with this block's value
 * @param block - the block that should shadow this block's value
 */
Blockly.Block.prototype.addShadowBlock = function(block) {
  if (!this.shadowBlocks_) {
    this.shadowBlocks_ = [];
  }
  // First check to make sure the block isn't already in the list.
  if (this.shadowBlocks_.indexOf(block) === -1) {
    this.shadowBlocks_.push(block);
  }
};

/** Sets the list of blocks to keep in sync with this block
 */
Blockly.Block.prototype.setShadowBlocks = function(blocks) {
  this.shadowBlocks_ = blocks;
};

/** Returns list of blocks that shadow this block
 */
Blockly.Block.prototype.getShadowBlocks = function() {
  return this.shadowBlocks_ || [];
};

/**
 * Find all the blocks that are directly or indirectly nested inside this one.
 * Includes this block in the list.
 * Includes value and block inputs, as well as any following statements.
 * Excludes any connection on an output tab or any preceding statements.
 * @return {!Array.<!Blockly.Block>} Flattened array of blocks.
 */
Blockly.Block.prototype.getDescendants = function() {
  var blocks = [this];
  for (var child, x = 0; (child = this.childBlocks_[x]); x++) {
    blocks = blocks.concat(child.getDescendants());
  }
  return blocks;
};

/**
 * Get whether this block and all of its connected descendants
 * are configured as deletable. Used when deciding whether the
 * user can trash a group of blocks - all of the blocks must
 * be deletable.
 * @return {boolean} True if this block and all blocks connected
 *    below it are deleteable.
 */
Blockly.Block.prototype.areBlockAndDescendantsDeletable = function() {
  var deleteBlockedByChildren = this.childBlocks_.some(function(child) {
    return !child.areBlockAndDescendantsDeletable();
  });
  return this.isDeletable() && !deleteBlockedByChildren;
};

/**
 * Get whether this block is deletable or not.
 * @return {boolean} True if deletable.
 */
Blockly.Block.prototype.isDeletable = function() {
  return this.deletable_ && !this.blockSpace.isReadOnly();
};

/**
 * Set whether this block is deletable or not.
 * @param {boolean} deletable True if deletable.
 */
Blockly.Block.prototype.setDeletable = function(deletable) {
  this.deletable_ = deletable;
  if (this.svg_) {
    this.svg_.grayOut(this.shouldBeGrayedOut());
  }
};

/**
 * @returns {boolean} whether this block should be rendered as grayed out
 */
Blockly.Block.prototype.shouldBeGrayedOut = function() {
  return (
    Blockly.grayOutUndeletableBlocks &&
    !this.isDeletable() &&
    !this.blockSpace.isReadOnly()
  );
};

/**
 * Get whether this block is movable or not. Note that this can still return
 * true if block movement is locked for the entire blockSpace, check
 * blockSpaceEditor.isMovementLocked() separately.
 * @return {boolean} True if movable.
 */
Blockly.Block.prototype.isMovable = function() {
  return this.movable_ && !this.blockSpace.isReadOnly();
};

/**
 * Set whether this block is movable or not.
 * @param {boolean} movable True if movable.
 */
Blockly.Block.prototype.setMovable = function(movable) {
  this.movable_ = movable;
  this.svg_ && this.svg_.updateMovable();
};

/**
 * Get whether this block is editable or not.
 * @return {boolean} True if editable.
 */
Blockly.Block.prototype.isEditable = function() {
  return this.editable_ && !this.blockSpace.isReadOnly();
};

/**
 * Set whether this block is editable or not.
 * @param {boolean} editable True if editable.
 */
Blockly.Block.prototype.setEditable = function(editable) {
  this.editable_ = editable;
  var x, y;
  var input, title;
  for (x = 0; x < this.inputList.length; x++) {
    input = this.inputList[x];
    for (y = 0; y < input.titleRow.length; y++) {
      title = input.titleRow[y];
      title.updateEditable();
    }
  }
  var icons = this.getIcons();
  for (x = 0; x < icons.length; x++) {
    icons[x].updateEditable();
  }
  if (this.editLabel_) {
    this.editLabel_.setVisible(editable);
  }
};

/**
 * Get whether this block is visible to the user.
 * @return {boolean} True if visible to the user.
 */
Blockly.Block.prototype.isUserVisible = function() {
  return this.userVisible_;
};

/**
 * Set whether this block and all child blocks are visible to the user.
 * @param {boolean} userVisible True if visible to user.
 * @param {boolean} opt_renderAfterVisible True if should render once if set to visible
 */
Blockly.Block.prototype.setUserVisible = function(
  userVisible,
  opt_renderAfterVisible
) {
  this.userVisible_ = userVisible;
  if (userVisible) {
    this.svg_ && Blockly.removeClass_(this.svg_.svgGroup_, 'userHidden');
  } else {
    this.svg_ && Blockly.addClass_(this.svg_.svgGroup_, 'userHidden');
  }
  // Apply to all children recursively
  this.childBlocks_.forEach(function(child) {
    child.setUserVisible(userVisible, opt_renderAfterVisible);
  });

  if (opt_renderAfterVisible && userVisible && this.childBlocks_.length === 0) {
    // At leaf node blocks, renders up through the root
    this.svg_ && this.render();
  }
};

Blockly.Block.prototype.isNextConnectionDisabled = function() {
  return this.nextConnectionDisabled_;
};

Blockly.Block.prototype.isFunctionDefinition = function() {
  return !!this.getProcedureInfo;
};

/**
 * Set whether this block should allow for succeeding connections.
 * Called by Xml.domToBlock, primarily used as a passthrough to
 * setNextStatement to disable any existing connections.
 */
Blockly.Block.prototype.setNextConnectionDisabled = function(disabled) {
  this.nextConnectionDisabled_ = disabled;
  if (disabled && this.nextConnection && this.nextConnection.targetConnection) {
    this.nextConnection.disconnect();
  }
  this.setNextStatement(!disabled);
};

/**
 * @returns {boolean} whether this block is selected and mid-drag
 */
Blockly.Block.prototype.isCurrentlyBeingDragged = function() {
  return Blockly.selected === this && Blockly.Block.isDragging();
};

/**
 * Check whether this block is currently hidden (a non-persistent property)
 */
Blockly.Block.prototype.isCurrentlyHidden_ = function() {
  return this.currentlyHidden_;
};

/**
 * Set whether this block is currently hidden (a non-persistent property)
 * Note: Does not set children to currently hidden, but they will display as hidden
 */
Blockly.Block.prototype.setCurrentlyHidden = function(hidden) {
  this.currentlyHidden_ = hidden;
  if (this.svg_) {
    this.svg_.setVisible(!hidden);
    if (!hidden) {
      this.refreshRender();
    }
  }
};

/**
 * Account for the fact that we have two different visibility states.
 * UserVisible is a persisent property used to create blocks that can be seen
 * by level builders, but not by the user.
 * CurrentlyHidden is a non-persistent property used to hide certain blocks
 * (like function definitions/examples) that should only be visible when using
 * the modal function editor.
 * This method calculates whether this block is currently visible based
 * on our current block-editing state (Blockly.editBlocks)
 * @returns true if both visibility conditions are met.
 */
Blockly.Block.prototype.isVisible = function() {
  var visibleThroughParent =
    !this.parentBlock_ || this.parentBlock_.isVisible();
  var visible = visibleThroughParent && !this.isCurrentlyHidden_();

  if (Blockly.editBlocks) {
    // If we're in edit mode, we're not a "user", so we don't care if
    // the block isUserVisible or not.
    return visible;
  }

  return visible && this.isUserVisible();
};

/**
 * Set the URL of this block's help page.
 * @param {string|Function} url URL string for block help, or function that
 *     returns a URL.  Null for no help.
 */
Blockly.Block.prototype.setHelpUrl = function(url) {
  this.helpUrl = url;
};

/**
 * Get the current colour of this block
 * @returns {string} hexadecimal colour value
 */
Blockly.Block.prototype.getHexColour = function() {
  return Blockly.makeColour(
    this.getColour(),
    this.getSaturation(),
    this.getValue()
  );
};

/**
 * Get the colour of a block.
 * @return {number} HSV hue value.
 */
Blockly.Block.prototype.getColour = function() {
  return this.colourHue_;
};

/**
 * Get the saturation of a block.
 * @return {number} HSV saturation.
 */
Blockly.Block.prototype.getSaturation = function() {
  return this.colourSaturation_;
};

/**
 * Get the fill pattern for the block
 * @return {string} Pattern name xlink
 */
Blockly.Block.prototype.getFillPattern = function() {
  return this.fillPattern_;
};

/**
 * Whether or not this block has a frame around it. Should only be true for
 * function definitions
 * @return {boolean}
 */
Blockly.Block.prototype.isFramed = function() {
  return this.blockSvgClass_ === Blockly.BlockSvgFramed;
};

/**
 * Get the value of a block.
 * @return {number} HSV value.
 */
Blockly.Block.prototype.getValue = function() {
  return this.colourValue_;
};

/**
 * Change the colour of a block.
 * @param {number} colourHue HSV hue value.
 */
Blockly.Block.prototype.setColour = function(colourHue) {
  this.colourHue_ = colourHue;
  if (this.svg_) {
    this.svg_.updateColour();
  }
  var icons = this.getIcons();
  var x, y;
  var input, title;
  for (x = 0; x < icons.length; x++) {
    icons[x].updateColour();
  }
  if (this.rendered) {
    // Bump every dropdown to change its colour.
    for (x = 0; x < this.inputList.length; x++) {
      input = this.inputList[x];
      for (y = 0; y < input.titleRow.length; y++) {
        title = input.titleRow[y];
        title.setText(null);
      }
    }
    this.render();
  }
};

/**
 * Change the fill pattern of a block
 * @param {string} pattern The id of the pattern
 */
Blockly.Block.prototype.setFillPattern = function(pattern) {
  this.fillPattern_ = pattern;
};

/**
 * Set whether or not this block should be framed.  Should only be set for
 * function definitions.
 * @param {boolean} isFramed
 */
Blockly.Block.prototype.setFramed = function(isFramed) {
  this.blockSvgClass_ = isFramed ? Blockly.BlockSvgFramed : Blockly.BlockSvg;
};

Blockly.Block.prototype.isUnused = function() {
  return this.svg_.isUnused() || this.isCurrentlyBeingDragged();
};

Blockly.Block.prototype.setIsUnused = function(isUnused) {
  if (isUnused === undefined) {
    var shouldBeTopBlock =
      this.previousConnection === null && this.outputConnection === null;

    isUnused =
      !shouldBeTopBlock &&
      this.isUserVisible() &&
      this.type !== 'functional_definition' &&
      Blockly.mainBlockSpace &&
      Blockly.mainBlockSpace.isTopBlock(this);
  }
  if (Blockly.showUnusedBlocks && isUnused !== this.svg_.isUnused()) {
    this.svg_.setIsUnused(isUnused);
    this.childBlocks_.forEach(function(block) {
      block.setIsUnused(false);
    });
  }
};

/**
 * Set whether or not this block should use the functional svg
 * @param {boolean} isFramed
 */
Blockly.Block.prototype.setFunctional = function(isFunctional, options) {
  this.blockSvgClass_ = isFunctional
    ? Blockly.BlockSvgFunctional
    : Blockly.BlockSvg;
  this.customOptions_ = isFunctional ? options : {};
};

/**
 * Change the HSV of a block.
 * @param {number} colourHue HSV hue value.
 * @param {number} colourSaturation HSV saturation value.
 * @param {number} colourValue HSV value.
 */
Blockly.Block.prototype.setHSV = function(
  colourHue,
  colourSaturation,
  colourValue
) {
  this.colourHue_ = colourHue;
  this.colourSaturation_ = colourSaturation;
  this.colourValue_ = colourValue;
  if (this.svg_) {
    this.svg_.updateColour();
  }
  var icons = this.getIcons();
  var x, y;
  var input, title;
  for (x = 0; x < icons.length; x++) {
    icons[x].updateColour();
  }
  if (this.rendered) {
    // Bump every dropdown to change its colour.
    for (x = 0; x < this.inputList.length; x++) {
      input = this.inputList[x];
      for (y = 0; y < input.titleRow.length; y++) {
        title = input.titleRow[y];
        title.setText(null);
      }
    }
    this.render();
  }
};

/**
 * Set global variable indicating the parent block that indicates this block should
 * be duplicated on drag.
 * @param parent, the parent block indicating this block should duplicate on drag
 */
Blockly.Block.prototype.setParentForCopyOnDrag = function(parent) {
  this.copyOnDrag_ = parent;
};

/**
 * Returns whether this block is connected to the parent from which it should duplicate on drag
 */
Blockly.Block.prototype.shouldCopyOnDrag = function() {
  var parent = this.getParent();
  return this.copyOnDrag_ && !!parent && parent.type === this.copyOnDrag_;
};

/**
 * Sets the target block whose value this block should shadow
 * @param fn - A function that takes in a root block and returns the source block to shadow.
 */
Blockly.Block.prototype.setBlockToShadow = function(fn) {
  this.blockToShadow_ = fn;
};

/**
 * Returns the named title from a block.
 * @param {string} name The name of the title.
 * @return {*} Named title, or null if title does not exist.
 * @private
 */
Blockly.Block.prototype.getTitle_ = function(name) {
  for (var x = 0, input; (input = this.inputList[x]); x++) {
    for (var y = 0, title; (title = input.titleRow[y]); y++) {
      if (title.name === name) {
        return title;
      }
    }
  }
  return null;
};

Blockly.Block.prototype.getTitles = function() {
  var titles = [];
  for (var x = 0, input; (input = this.inputList[x]); x++) {
    for (var y = 0, title; (title = input.titleRow[y]); y++) {
      titles.push(title);
    }
  }
  return titles;
};

/**
 * Returns the language-neutral value from the title of a block.
 * @param {string} name The name of the title.
 * @return {?string} Value from the title or null if title does not exist.
 */
Blockly.Block.prototype.getTitleValue = function(name) {
  var title = this.getTitle_(name);
  if (title) {
    return title.getValue();
  }
  return null;
};

/**
 * Change the title value for a block (e.g. 'CHOOSE' or 'REMOVE').
 * @param {string} newValue Value to be the new title.
 * @param {string} name The name of the title.
 */
Blockly.Block.prototype.setTitleValue = function(newValue, name) {
  var title = this.getTitle_(name);
  if (title) {
    title.setValue(newValue);
  } else {
    this.appendDummyInput().appendTitle(
      new Blockly.FieldTextInput(newValue),
      name
    );
    console.warn('Unknown title: "' + name + '" not found.');
  }
};

/**
 * Change the config value for a given field on the block
 * @param {string} fieldName The name of the field
 * @param {string} configString configuration to set for the field
 */
Blockly.Block.prototype.setFieldConfig = function(fieldName, configString) {
  var field = this.getTitle_(fieldName);
  if (!field) {
    console.warn('Unknown field: "' + fieldName + '" not found.');
    return;
  }

  if (field.setConfig) {
    field.setConfig(configString);
  }
};

/**
 * Change the tooltip text for a block.
 * @param {string|!Element} newTip Text for tooltip or a parent element to
 *     link to for its tooltip.
 */
Blockly.Block.prototype.setTooltip = function(newTip) {
  this.tooltip = newTip;
};

/**
 * Set whether this block can chain onto the bottom of another block.
 * @param {boolean} hasPrevious True if there can be a previous statement.
 * @param {string|Array.<string>|null} opt_check Statement type or list of
 *     statement types.  Null or undefined if any type could be connected.
 */
Blockly.Block.prototype.setPreviousStatement = function(
  hasPrevious,
  opt_check
) {
  if (this.previousConnection) {
    if (this.previousConnection.targetConnection) {
      throw 'Must disconnect previous statement before removing connection.';
    }
    this.previousConnection.dispose();
    this.previousConnection = null;
  }
  if (hasPrevious) {
    if (this.outputConnection) {
      throw 'Remove output connection prior to adding previous connection.';
    }
    if (opt_check === undefined) {
      opt_check = null;
    }
    this.previousConnection = new Blockly.Connection(
      this,
      Blockly.PREVIOUS_STATEMENT
    );
    this.previousConnection.setCheck(opt_check);
  }
  this.refreshRender();
};

/**
 * Set whether another block can chain onto the bottom of this block.
 * @param {boolean} hasNext True if there can be a next statement.
 * @param {string|Array.<string>|null} opt_check Statement type or list of
 *     statement types.  Null or undefined if any type could be connected.
 */
Blockly.Block.prototype.setNextStatement = function(hasNext, opt_check) {
  if (this.nextConnection) {
    if (this.nextConnection.targetConnection) {
      throw 'Must disconnect next statement before removing connection.';
    }
    this.nextConnection.dispose();
    this.nextConnection = null;
  }
  if (hasNext) {
    if (opt_check === undefined) {
      opt_check = null;
    }
    this.nextConnection = new Blockly.Connection(this, Blockly.NEXT_STATEMENT);
    this.nextConnection.setCheck(opt_check);
  }
  this.refreshRender();
};

/**
 * Set whether this block returns a value, with strict type checking if so.
 * @param {boolean} hasOutput True if there is an output.
 * @param {string|Array.<string>|null} opt_check Returned type or list of
 *     returned types.  Null or undefined if any type could be returned
 *     (e.g. variable get).
 */
Blockly.Block.prototype.setStrictOutput = function(hasOutput, opt_check) {
  this.setOutput(hasOutput, opt_check, true);
};
/**
 * Set whether this block returns a value.
 * @param {boolean} hasOutput True if there is an output.
 * @param {string|Array.<string>|null} opt_check Returned type or list of
 *     returned types.  Null or undefined if any type could be returned
 *     (e.g. variable get).
 * @param {boolean} opt_strict Specify if the output type is strict, i.e. it
 *     can only connect to inputs that expect the exact same type
 */
Blockly.Block.prototype.setOutput = function(hasOutput, opt_check, opt_strict) {
  if (this.outputConnection) {
    if (this.outputConnection.targetConnection) {
      throw 'Must disconnect output value before removing connection.';
    }
    this.outputConnection.dispose();
    this.outputConnection = null;
  }
  if (hasOutput) {
    if (this.previousConnection) {
      throw 'Remove previous connection prior to adding output connection.';
    }
    if (opt_check === undefined) {
      opt_check = null;
    }
    this.outputConnection = new Blockly.Connection(this, Blockly.OUTPUT_VALUE);
    this.outputConnection.setCheck(opt_check, opt_strict);
  }
  this.refreshRender();
};

Blockly.Block.prototype.refreshRender = function() {
  if (this.rendered) {
    this.render();
    this.bumpNeighbours();
  }
};
/**
 * Set whether this is a functional block that returns a value. Currently this
 * will be displayed as previous connection that will only connect with
 * functional inputs
 * @param {boolean} hasOutput True if there is an output.
 * @param {string|Array.<string>|null} opt_check Returned type or list of
 *     returned types.  Null or undefined if any type could be returned
 *     (e.g. variable get).
 */
Blockly.Block.prototype.setFunctionalOutput = function(hasOutput, opt_check) {
  if (this.previousConnection) {
    if (this.previousConnection.targetConnection) {
      throw 'Must disconnect output value before removing connection.';
    }
    this.previousConnection.dispose();
    this.previousConnection = null;
  }
  if (hasOutput) {
    if (this.previousConnection) {
      throw 'Remove previous connection prior to adding output connection.';
    }
    if (opt_check === undefined) {
      opt_check = null;
    }
    this.previousConnection = new Blockly.Connection(
      this,
      Blockly.FUNCTIONAL_OUTPUT
    );
    this.previousConnection.setCheck(opt_check);
  }
  this.refreshRender();
};

/**
 * Sets this block to have a new functional output type
 * @param {Blockly.BlockValueType} newType
 */
Blockly.Block.prototype.changeFunctionalOutput = function(newType) {
  this.setHSV.apply(this, Blockly.FunctionalTypeColors[newType]);
  this.previousConnection =
    this.previousConnection ||
    new Blockly.Connection(this, Blockly.FUNCTIONAL_OUTPUT);
  this.previousConnection.setCheck(newType);
  this.refreshRender();
};

/**
 * Set whether value inputs are arranged horizontally or vertically.
 * @param {boolean} inputsInline True if inputs are horizontal.
 */
Blockly.Block.prototype.setInputsInline = function(inputsInline) {
  this.inputsInline = inputsInline;
  if (this.rendered) {
    this.render();
    this.bumpNeighbours();
    this.blockSpace.fireChangeEvent();
  }
};

/**
 * Set whether the block is disabled or not.
 * @param {boolean} disabled True if disabled.
 */
Blockly.Block.prototype.setDisabled = function(disabled) {
  if (this.disabled == disabled) {
    return;
  }
  this.disabled = disabled;
  this.svg_.updateDisabled();
  this.blockSpace.fireChangeEvent();
};

/**
 * Get whether the block is disabled or not due to parents.
 * The block's own disabled property is not considered.
 * @return {boolean} True if disabled.
 */
Blockly.Block.prototype.getInheritedDisabled = function() {
  var block = this;
  while (block) {
    if (block.disabled) {
      return true;
    }
    block = block.getSurroundParent();
  }
  // Ran off the top.
  return false;
};

/**
 * Get whether the block is collapsed or not.
 * @return {boolean} True if collapsed.
 */
Blockly.Block.prototype.isCollapsed = function() {
  return this.collapsed_;
};

/**
 * Set whether the block is collapsed or not.
 * @param {boolean} collapsed True if collapsed.
 */
Blockly.Block.prototype.setCollapsed = function(collapsed) {
  if (this.collapsed_ == collapsed) {
    return;
  }
  this.collapsed_ = collapsed;
  var renderList = [];
  // Show/hide the inputs.
  var x;
  for (x = 0; x < this.inputList.length; x++) {
    var input = this.inputList[x];
    renderList = renderList.concat(input.setVisible(!collapsed));
  }

  var COLLAPSED_INPUT_NAME = '_TEMP_COLLAPSED_INPUT';
  if (collapsed) {
    var icons = this.getIcons();

    for (x = 0; x < icons.length; x++) {
      icons[x].setVisible(false);
    }
    var text = this.toString(Blockly.COLLAPSE_CHARS);
    this.appendDummyInput(COLLAPSED_INPUT_NAME).appendTitle(text);
  } else {
    this.removeInput(COLLAPSED_INPUT_NAME);
  }

  if (!renderList.length) {
    // No child blocks, just render this block.
    renderList[0] = this;
  }
  if (this.rendered) {
    for (x = 0; x < renderList.length; x++) {
      var block = renderList[x];
      block.render();
    }
    this.bumpNeighbours();
  }
};

/**
 * Create a human-readable text representation of this block and any children.
 * @param {?number} opt_maxLength Truncate the string to this length.
 * @return {string} Text of block.
 */
Blockly.Block.prototype.toString = function(opt_maxLength) {
  var text = [];
  for (var x = 0, input; (input = this.inputList[x]); x++) {
    for (var y = 0, title; (title = input.titleRow[y]); y++) {
      text.push(title.getText());
    }
    if (input.connection) {
      var child = input.connection.targetBlock();
      if (child) {
        text.push(child.toString());
      } else {
        text.push('?');
      }
    }
  }
  text = goog.string.trim(text.join(' ')) || '???';
  if (opt_maxLength) {
    // TODO: Improve truncation so that text from this block is given priority.
    // TODO: Handle FieldImage better.
    text = goog.string.truncate(text, opt_maxLength);
  }
  return text;
};

/**
 * Shortcut for appending a value input row.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.  Should be unique to this block.
 * @return {!Blockly.Input} The input object created.
 */
Blockly.Block.prototype.appendValueInput = function(name) {
  return this.appendInput_(Blockly.INPUT_VALUE, name);
};

/**
 * Shortcut for appending a statement input row.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.  Should be unique to this block.
 * @param {?number} trailingSpacing Extra space to leave below the input's last
 *     block.
 * @return {!Blockly.Input} The input object created.
 */
Blockly.Block.prototype.appendStatementInput = function(name, trailingSpacing) {
  trailingSpacing = trailingSpacing || 0;
  return this.appendInput_(Blockly.NEXT_STATEMENT, name, trailingSpacing);
};

/**
 * Shortcut for appending a dummy input row.
 * @param {?string} opt_name Language-neutral identifier which may used to find
 *     this input again.  Should be unique to this block.
 * @return {!Blockly.Input} The input object created.
 */
Blockly.Block.prototype.appendDummyInput = function(opt_name) {
  return this.appendInput_(Blockly.DUMMY_INPUT, opt_name || '');
};

/**
 * Shortcut for appending a functional input. Functional inputs are displayed
 * similarly to value inputs, but with a notch similar to previous/next
 * connections instead of the tab on the left.
 * @param {string} opt_name Language-neutral identifier which may used to find
 *     this input again.  Should be unique to this block.
 * @return {!Blockly.Input} The input object created.
 */
Blockly.Block.prototype.appendFunctionalInput = function(name) {
  return this.appendInput_(Blockly.FUNCTIONAL_INPUT, name);
};

/**
 * Interpolate a message string, creating titles and inputs.
 * @param {string} msg The message string to parse.  %1, %2, etc. are symbols
 *     for value inputs.
 * @param {!Array.<string|number>|number} var_args A series of tuples or
 *     callbacks that each specify the value inputs to create.  If a callback
 *     is provided, we defer rendering to that method. Otherwise, each tuple has
 *     three values:
 *       the input name
 *       its check type
 *       its title's alignment.
 *     The last parameter is not a tuple, but just an alignment for any trailing
 *     dummy input.  This last parameter is mandatory; there may be any number
 *     of tuples (though the number of tuples must match the symbols in msg).
 */
Blockly.Block.prototype.interpolateMsg = function(msg) {
  // Remove the msg from the start and the dummy alignment from the end of args.
  goog.asserts.assertString(msg);
  var dummyAlign = arguments.length - 1;
  goog.asserts.assertNumber(dummyAlign);

  var tokens = msg.split(/(%\d)/);
  var i;
  for (i = 0; i < tokens.length; i += 2) {
    var text = goog.string.trim(tokens[i]);
    var symbol = tokens[i + 1];
    if (symbol) {
      // Value input.
      var digit = window.parseInt(symbol.charAt(1), 10);
      var fieldInputType = arguments[digit];

      if (typeof fieldInputType === 'function') {
        this.appendDummyInput().appendTitle(text);
        fieldInputType();
      } else {
        this.appendValueInput(fieldInputType[0])
          .setCheck(fieldInputType[1])
          .setAlign(fieldInputType[2])
          .appendTitle(text);
      }
      arguments[digit] = null; // Inputs may not be reused.
    } else if (text) {
      // Trailing dummy input.
      this.appendDummyInput()
        .setAlign(dummyAlign)
        .appendTitle(text);
    }
  }
  // Verify that all inputs were used.
  for (i = 1; i < arguments.length - 1; i++) {
    goog.asserts.assert(
      arguments[i] === null,
      'Input "%%s" not used in message: "%s"',
      i,
      msg
    );
  }
  // Make the inputs inline unless there is only one input and
  // no text follows it.
  this.setInputsInline(!msg.match(/%1\s*$/));
};

/**
 * Add a value input, statement input or local variable to this block.
 * @param {number} type Either Blockly.INPUT_VALUE or Blockly.NEXT_STATEMENT or
 *     Blockly.DUMMY_INPUT.
 * @param {string} name Language-neutral identifier which may used to find this
 *     input again.  Should be unique to this block.
 * @param {?number} spacing extra space to put below this input's last statement
 * @return {!Blockly.Input} The input object created.
 * @private
 */
Blockly.Block.prototype.appendInput_ = function(type, name, spacing) {
  spacing = spacing || 0;
  var connection = null;
  if (
    type === Blockly.INPUT_VALUE ||
    type === Blockly.NEXT_STATEMENT ||
    type === Blockly.FUNCTIONAL_INPUT
  ) {
    connection = new Blockly.Connection(this, type);
  }
  var input = new Blockly.Input(type, name, this, connection, spacing);
  // Append input to list.
  this.inputList.push(input);
  if (this.rendered) {
    this.render();
    // Adding an input will cause the block to change shape.
    this.bumpNeighbours();
  }
  return input;
};

/**
 * Move an input to a different location on this block.
 * @param {string} name The name of the input to move.
 * @param {string} refName Name of input that should be after the moved input.
 */
Blockly.Block.prototype.moveInputBefore = function(name, refName) {
  if (name == refName) {
    throw 'Can\'t move "' + name + '" to itself.';
  }
  // Find both inputs.
  var inputIndex = -1;
  var refIndex = -1;
  for (var x = 0, input; (input = this.inputList[x]); x++) {
    if (input.name == name) {
      inputIndex = x;
      if (refIndex != -1) {
        break;
      }
    } else if (input.name == refName) {
      refIndex = x;
      if (inputIndex != -1) {
        break;
      }
    }
  }
  if (inputIndex == -1) {
    throw 'Named input "' + name + '" not found.';
  }
  if (refIndex == -1) {
    throw 'Reference input "' + name + '" not found.';
  }
  // Remove input.
  this.inputList.splice(inputIndex, 1);
  if (inputIndex < refIndex) {
    refIndex--;
  }
  // Reinsert input.
  this.inputList.splice(refIndex, 0, input);
  if (this.rendered) {
    this.render();
    // Moving an input will cause the block to change shape.
    this.bumpNeighbours();
  }
};

/**
 * Remove an input from this block.
 * @param {string} name The name of the input.
 * @param {boolean} opt_quiet True to prevent error if input is not present.
 * @throws {goog.asserts.AssertionError} if the input is not present and
 *     opt_quiet is not true.
 */
Blockly.Block.prototype.removeInput = function(name, opt_quiet) {
  for (var x = 0, input; (input = this.inputList[x]); x++) {
    if (input.name == name) {
      if (input.connection) {
        if (input.connection === Blockly.highlightedConnection_) {
          input.connection.unhighlight();
          Blockly.highlightedConnection_ = null;
        }
        if (input.connection.targetConnection) {
          // Disconnect any attached block.
          input.connection.targetBlock().setParent(null);
        }
      }
      input.dispose();
      this.inputList.splice(x, 1);
      if (this.rendered) {
        this.render();
        // Removing an input will cause the block to change shape.
        this.bumpNeighbours();
      }
      return;
    }
  }
  if (!opt_quiet) {
    goog.asserts.fail('Input "%s" not found.', name);
  }
};

/**
 * Fetches the named input object.
 * @param {string} name The name of the input.
 * @return {Blockly.Input|null} The input object, or null of the input does not exist.
 */
Blockly.Block.prototype.getInput = function(name) {
  for (var x = 0, input; (input = this.inputList[x]); x++) {
    if (input.name == name) {
      return input;
    }
  }
  // This input does not exist.
  return null;
};

/**
 * Fetches the block attached to the named input.
 * @param {string} name The name of the input.
 * @return {Blockly.Block} The attached value block, or null if the input is
 *     either disconnected or if the input does not exist.
 */
Blockly.Block.prototype.getInputTargetBlock = function(name) {
  var input = this.getInput(name);
  return input && input.connection && input.connection.targetBlock();
};

Blockly.Block.prototype.attachBlockToInputName = function(newBlock, inputName) {
  var input = this.getInput(inputName);
  if (!input || !input.connection) {
    throw 'Block has no input named ' + name;
  }

  newBlock.previousConnection.connect(input.connection);
};

/**
 * Give this block a mutator dialog.
 * @param {Blockly.Mutator} mutator A mutator dialog instance or null to remove.
 */
Blockly.Block.prototype.setMutator = function(mutator) {
  if (this.mutator && this.mutator !== mutator) {
    this.mutator.dispose();
  }
  if (mutator) {
    mutator.block_ = this;
    this.mutator = mutator;
    if (this.svg_) {
      mutator.createIcon();
    }
  }
};

/**
 * Set this block's warning text.
 * @param {?string} text The text, or null to delete.
 */
Blockly.Block.prototype.setWarningText = function(text) {
  if (!Blockly.Warning) {
    throw 'Warnings not supported.';
  }
  if (this.isInFlyout) {
    text = null;
  }
  var changedState = false;
  if (goog.isString(text)) {
    if (!this.warning) {
      this.warning = new Blockly.Warning(this);
      changedState = true;
    }
    this.warning.setText(/** @type {string} */ (text));
  } else {
    if (this.warning) {
      this.warning.dispose();
      changedState = true;
    }
  }
  if (changedState && this.rendered) {
    this.render();
    // Adding or removing a warning icon will cause the block to change shape.
    this.bumpNeighbours();
  }
};

Blockly.Block.prototype.setInputCount = function(inputCount) {
  this.inputCount = parseInt(inputCount);
};

Blockly.Block.prototype.svgInitialized = function() {
  return !!this.svg_;
};

/**
 * Render the block.
 * Lays out and reflows a block based on its contents and settings.
 * @param {boolean} selfOnly Whether to render only this block and NOT also
 * its parents which in turn would trigger a window resize event. Defaults to
 * false.
 */
Blockly.Block.prototype.render = function(selfOnly) {
  if (!this.svg_) {
    throw 'Uninitialized block cannot be rendered.  Call block.initSvg()';
  }
  if (this.blockSpace) {
    this.svg_.render(selfOnly);
    if (this.miniFlyout) {
      this.miniFlyout.position_();
    }
  }
};

/**
 * Exposes this block's BlockSvg
 */
Blockly.Block.prototype.getSvgRenderer = function() {
  return this.svg_;
};

/**
 * Get the oldest ancestor of this block.
 */
Blockly.Block.prototype.getRootBlock = function() {
  var rootBlock;
  var current = this;
  while (current) {
    rootBlock = current;
    current = current.getParent();
  }

  return rootBlock;
};

/**
 * @returns True if any of this blocks inputs have a connection that is unfilled
 */
Blockly.Block.prototype.hasUnfilledFunctionalInput = function() {
  // Does this block have a connection without a block attached
  return this.inputList.some(function(input) {
    return (
      input.type === Blockly.FUNCTIONAL_INPUT &&
      input.connection &&
      !input.connection.targetBlock()
    );
  });
};
