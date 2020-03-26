/**
 * @fileoverview Angle Helper for angle Fields
 */
'use strict';

goog.provide('Blockly.AngleHelper');
goog.require('goog.math.Vec2');

/**
 * Simple widget to help visualize angles.
 * @param {string} direction - 'turnRight' or 'turnLeft' as set by
 * direction dropdown.
 * @param {object} opt_options
 * @param {String} opt_options.arcColour 
 * @param {number} opt_options.angle 
 * @param {number} opt_options.height 
 * @param {number} opt_options.width 
 * @param {number[]} opt_options.snapPoints
 * @param {function} opt_options.onUpdate
 */
Blockly.AngleHelper = function(direction, opt_options) {
  opt_options = opt_options || {};
  this.arcColour_ = opt_options.arcColour || this.lineColour_;
  this.angle_ = opt_options.angle || 0;
  this.height_ = opt_options.height || 150;
  this.width_ = opt_options.width || 150;
  this.snapPoints_ = opt_options.snapPoints && opt_options.snapPoints.map(function (point) {
    return Math.round(parseInt(point));
  });
  this.onUpdate_ = opt_options.onUpdate;
  
  this.turnRight_ = direction === 'turnRight';
  this.lineColour_ = '#4d575f';
  this.pickerHandleR_ = 7.5;
  this.draggingHandle_ = false;
  this.draggingBaseline_ = false;
  this.strokeWidth_ = 3;
  this.center_ = new goog.math.Vec2(this.width_ / 2, this.height_ / 2);
  this.radius_ = new goog.math.Vec2(Math.min(this.height_, this.width_) / 2 - this.pickerHandleR_ - this.strokeWidth_, 0);
  
  this.baselineAngle_ = 0;
  this.baselineHandle_ = null;
  this.baselineHandleR_ = 4;
  this.baselineHandleCenter_ = this.center_.clone().add(new goog.math.Vec2(this.radius_.x + this.baselineHandleR_, 0));

  this.pickerHandleCenter_ = this.center_.clone().add(new goog.math.Vec2(this.radius_.x - this.pickerHandleR_, 0));
  this.pickerHandleCenter_ = goog.math.Vec2.rotateAroundPoint(
    this.pickerHandleCenter_,
    this.center_,
    goog.math.toRadians(this.turnRight_ ? this.angle_ : -this.angle_)
  );

  this.arc_ = null;
  this.pickerHandle_ = null;
  this.baselineHandle_ = null;
  this.svg_ = null;
  this.rect_ = null;
  this.pickerLine_ = null;
  this.baseLine_ = null;
  this.ticks_ = null;

  this.animationInterval_ = null;
};

/**
 * Animate the angle change. Used when an external change causes the angle to change
 * potentially by a lot; a smooth transition helps better visualize the change.
 *
 * @param {number} targetAngle
 * @param {number=200} animationDuration
 */
Blockly.AngleHelper.prototype.animateAngleChange = function(targetAngle, animationDuration) {
  animationDuration = animationDuration || 200;
  var minSteps = animationDuration / 10;

  var totalDiff = targetAngle - this.getAngle();
  var steps = Math.min(Math.abs(totalDiff), minSteps);
  var timePerStep = animationDuration / steps;
  var diffPerStep = totalDiff / steps;

  clearInterval(this.animationInterval_);
  this.animationInterval_ = setInterval(function () {
    if (Math.abs(this.getAngle() - targetAngle) < 1) {
      this.setAngle(targetAngle);
      clearInterval(this.animationInterval_);
    } else {
      var newAngle = this.getAngle() + diffPerStep;
      this.setAngle(newAngle, true);
    }
  }.bind(this), timePerStep);
};

/**
 * Set the current angle and update the visualization appropriately
 *
 * @param {number} angle
 * @param {boolean=false} skipSnap - should we ignore our snapping configuration?
 */
Blockly.AngleHelper.prototype.setAngle = function(angle, skipSnap) {
  this.angle_ = skipSnap ? angle : this.snap_(angle);
  this.update_();
};

Blockly.AngleHelper.prototype.getAngle = function() {
  return this.angle_;
};

Blockly.AngleHelper.prototype.init = function(svgContainer) {
  this.svg_ = Blockly.createSvgElement('svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:html': 'http://www.w3.org/1999/xhtml',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'version': '1.1',
    'height': this.height_ + 'px',
    'width': this.width_ + 'px',
    'style': 'background: rgb(255, 255, 255);',
  }, svgContainer);
  this.rect_ = this.svg_.getBoundingClientRect();
  this.mouseMoveWrapper_ = Blockly.bindEvent_(this.svg_, 'mousemove', this, this.updateDrag_);
  this.mouseUpWrapper_ = Blockly.bindEvent_(this.svg_, 'mouseup', this, this.stopDrag_);
  this.mouseDownWrapper_ = Blockly.bindEvent_(this.svg_, 'mousedown', this, this.startDrag_);

  this.baseLine_ = Blockly.createSvgElement('line', {
    'stroke': this.lineColour_,
    'stroke-width': this.strokeWidth_,
    'stroke-linecap': 'round',
    'stroke-dasharray': '6 6',
    'stroke-opacity': '0.5',
    'x1': this.center_.x - this.radius_.x,
    'x2': this.center_.x + this.radius_.x,
    'y1': this.center_.y,
    'y2': this.center_.y,
  }, this.svg_);
  this.baselineHandle_ = Blockly.createSvgElement('circle', {
    'cx': this.baselineHandleCenter_.x,
    'cy': this.baselineHandleCenter_.y,
    'fill': this.lineColour_,
    'stroke': this.lineColour_,
    'stroke-width': 1,
    'r': this.baselineHandleR_,
    'style': 'cursor: move;',
  }, this.svg_);

  this.arc_ = Blockly.createSvgElement('path', {
    'stroke': this.arcColour_,
    'fill': this.arcColour_,
    'fill-opacity': '0.3',
    'stroke-width': this.strokeWidth_,
  }, this.svg_);

  // Draw markers every 15 degrees around the edge.
  this.ticks_ = [];
  for (var angle = 0; angle < 360; angle += 15) {
    // define three marker sizes; 5px, 10px, and 15px at angles modulo
    // 15, 45, and 90 degrees, respectively.
    var markerSize = (angle % 90 == 0 ? 15 : angle % 45 == 0 ? 10 : 5);
    this.ticks_.push(Blockly.createSvgElement('line', {
      'stroke-linecap': 'round',
      'stroke-opacity': '0.6',
      'stroke': this.lineColour_,
      'x1': this.center_.x + this.radius_.x,
      'y1': this.center_.y,
      'x2': this.center_.x + this.radius_.x - markerSize,
      'y2': this.center_.y,
      'class': 'blocklyAngleMarks',
      'transform': 'rotate(' + angle + ', ' + this.center_.x + ', ' + this.center_.y + ')'
    }, this.svg_));
  }

  this.pickerLine_ = Blockly.createSvgElement('line', {
    'stroke': this.lineColour_,
    'stroke-width': this.strokeWidth_,
    'stroke-linecap': 'round',
    'x1': this.center_.x,
    'x2': this.pickerHandleCenter_.x,
    'y1': this.center_.y,
    'y2': this.pickerHandleCenter_.y
  }, this.svg_);

  this.pickerHandle_ = Blockly.createSvgElement('circle', {
    'cx': this.pickerHandleCenter_.x,
    'cy': this.pickerHandleCenter_.y,
    'fill': '#a69bc1',
    'r': this.pickerHandleR_,
    'stroke': this.lineColour_,
    'stroke-width': this.strokeWidth_,
    'style': 'cursor: move;',
  }, this.svg_);

  this.update_();
};

/**
 * Usually triggered by a change to this.angle_, this method updates the
 * positions of the various movable elements and triggers the optional
 * onUpdate callback
 */
Blockly.AngleHelper.prototype.update_ = function() {
  this.baseLine_.setAttribute('transform', 'rotate(' + this.baselineAngle_ + ', ' + this.center_.x + ', ' + this.center_.y + ')');
  for (var i = 0; i < this.ticks_.length; i++) {
    var angle = (15 * i + this.baselineAngle_) % 360;
    this.ticks_[i].setAttribute('transform', 'rotate(' + angle + ', ' + this.center_.x + ', ' + this.center_.y + ')');
  }
  
  this.pickerHandleCenter_ = goog.math.Vec2.rotateAroundPoint(
    this.center_.clone().add(new goog.math.Vec2(this.radius_.x - this.pickerHandleR_, 0)),
    this.center_,
    goog.math.toRadians(this.baselineAngle_ + (this.turnRight_ ? this.angle_ : -this.angle_))
  );

  this.pickerLine_.setAttribute('x2', this.pickerHandleCenter_.x);
  this.pickerLine_.setAttribute('y2', this.pickerHandleCenter_.y);

  this.pickerHandle_.setAttribute('cx', this.pickerHandleCenter_.x);
  this.pickerHandle_.setAttribute('cy', this.pickerHandleCenter_.y);
  
  this.baselineHandleCenter_ = goog.math.Vec2.rotateAroundPoint(
    this.center_.clone().add(new goog.math.Vec2(this.radius_.x + this.baselineHandleR_, 0)),
    this.center_,
    goog.math.toRadians(this.baselineAngle_)
  )
  this.baselineHandle_.setAttribute('cx', this.baselineHandleCenter_.x);
  this.baselineHandle_.setAttribute('cy', this.baselineHandleCenter_.y);

  var arcStart = this.baselineAngle_;
  var arcEnd = this.baselineAngle_ + (this.turnRight_ ? this.angle_ : -this.angle_);
  this.arc_.setAttribute('d', Blockly.AngleHelper.describeArc(this.center_, 20, arcStart, arcEnd));
};

Blockly.AngleHelper.prototype.startDrag_ = function(e) {
  var x = e.clientX - this.rect_.left;
  var y = e.clientY - this.rect_.top;
  var mouseLocation = new goog.math.Vec2(x, y);
  if (goog.math.Vec2.distance(this.pickerHandleCenter_, mouseLocation) < this.pickerHandleR_) {
    this.draggingHandle_ = true;
    return;
  }
  if (goog.math.Vec2.distance(this.baselineHandleCenter_, mouseLocation) < this.baselineHandleR_) {
    this.draggingBaseline_ = true;
  }
};

Blockly.AngleHelper.prototype.updateDrag_ = function(e) {
  var x = e.clientX - this.rect_.left;
  var y = e.clientY - this.rect_.top;
  var angle = goog.math.angle(this.center_.x, this.center_.y, x, y);

  if (this.draggingHandle_) {
    angle = goog.math.standardAngle(angle - this.baselineAngle_);
    if (!this.turnRight_) {
      angle = goog.math.standardAngle(-angle);
    }

    this.setAngle(angle);

    if (this.onUpdate_) {
      this.onUpdate_();
    }
  }
  
  if (this.draggingBaseline_) {
    this.baselineAngle_ = angle;
    this.update_();
  }
  
  e.stopPropagation();
  e.preventDefault();
};

Blockly.AngleHelper.prototype.stopDrag_ = function() {
  this.draggingHandle_ = false;
  this.draggingBaseline_ = false;
};

/**
 * If this helper is intended to only align to a subset of points (as is
 * the case in Dropdown mode), return the point in the set closest to
 * the given value. Otherwise, simply round to the nearest integer.
 */
Blockly.AngleHelper.prototype.snap_ = function(val) {
  if (!this.snapPoints_) {
    return Math.round(val);
  }

  // return the point closest to the source
  return this.snapPoints_.reduce(function(prev, curr) {
    var currDiff = Math.abs(goog.math.angleDifference(curr, val));
    var prevDiff = Math.abs(goog.math.angleDifference(prev, val));
    return currDiff < prevDiff ? curr : prev;
  });
};

Blockly.AngleHelper.prototype.dispose = function() {
  if (this.mouseDownWrapper_) {
    Blockly.unbindEvent_(this.mouseDownWrapper_);
    this.mouseDownWrapper_ = null;
  }
  if (this.mouseUpWrapper_) {
    Blockly.unbindEvent_(this.mouseUpWrapper_);
    this.mouseUpWrapper_ = null;
  }
  if (this.mouseMoveWrapper_) {
    Blockly.unbindEvent_(this.mouseMoveWrapper_);
    this.mouseMoveWrapper_ = null;
  }
  goog.dom.removeNode(this.svg_);
  this.arc_ = null;
  this.pickerHandle_ = null;
  this.baselineHandle_ = null;
  this.svg_ = null;
  this.pickerLine_ = null;
  this.baseLine_ = null;
  this.ticks_ = null;
  this.baselineAngle_ = 0;
};

/**
 * Create an SVG path string describing the given arc
 * @param {goog.math.Vec2} center
 * @param {number} radius
 * @param {number} startAngle
 * @param {number} endAngle
 * @return {String} path
 */
Blockly.AngleHelper.describeArc = function(center, radius, startAngle, endAngle) {
  var vector = center.clone().add(new goog.math.Vec2(radius, 0));
  var start = goog.math.Vec2.rotateAroundPoint(vector, center, goog.math.toRadians(startAngle));
  var end = goog.math.Vec2.rotateAroundPoint(vector, center, goog.math.toRadians(endAngle));

  // largeArcFlag should be set if the angle to be drawn is greater than
  // 180 degrees; it determines which "direction" the arc travels around
  // the circle.
  var largeArcFlag = Math.abs(startAngle - endAngle) > 180 ? '1' : '0';

  // Sweep flag determines if the if the arc is moving at "positive"
  // angles or "negative" ones.
  var sweepFlag = endAngle - startAngle < 0 ? '0' : '1';

  var d = [
    'M', start.x.toFixed(2), start.y.toFixed(2),
    'A', radius, radius, 0, largeArcFlag, sweepFlag, end.x.toFixed(2), end.y.toFixed(2),
    'L', center.x, center.y
  ].join(' ');

  return d;
}
