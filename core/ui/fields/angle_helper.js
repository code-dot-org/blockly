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
 * @param {number} opt_options.circleR 
 * @param {number} opt_options.height 
 * @param {number} opt_options.width 
 * @param {boolean} opt_options.dragging 
 * @param {number} opt_options.strokeWidth 
 * @param {number[]} opt_options.snapPoints
 * @param {function} opt_options.onUpdate
 */
Blockly.AngleHelper = function(direction, opt_options) {
  opt_options = opt_options || {};

  this.turnRight = direction === 'turnRight';

  this.arcColour = opt_options.arcColour || '#949ca2';
  this.angle = opt_options.angle || 0;
  this.circleR = opt_options.circleR || 10;
  this.height = opt_options.height || 150;
  this.width = opt_options.width || 150;
  this.dragging = opt_options.dragging || false;
  this.strokeWidth = opt_options.strokeWidth || 3;
  this.snapPoints = opt_options.snapPoints && opt_options.snapPoints.map(function (point) {
    return Math.round(parseInt(point));
  });

  this.center = new goog.math.Vec2(this.width / 2, this.height / 2);

  var circumference = Math.min(this.height, this.width);
  this.lineLength = new goog.math.Vec2((circumference / 2) - this.circleR - this.strokeWidth, 0);

  this.circleCenter = this.center.clone().add(this.lineLength)
  this.circleCenter = goog.math.Vec2.rotateAroundPoint(
    this.circleCenter,
    this.center,
    goog.math.toRadians(this.turnRight ? this.angle : -this.angle)
  );

  this.arc;
  this.circle;
  this.svg;
  this.variableLine;

  this.onUpdate = opt_options.onUpdate;
};

Blockly.AngleHelper.prototype.setAngle = function(angle) {
  this.angle = this.snap_(angle);
  this.update_();
};

Blockly.AngleHelper.prototype.getAngle = function() {
  return this.angle;
};

Blockly.AngleHelper.prototype.init = function(svgContainer) {
  this.svg = Blockly.createSvgElement('svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:html': 'http://www.w3.org/1999/xhtml',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'version': '1.1',
    'height': this.height + 'px',
    'width': this.width + 'px',
    'style': 'background: rgb(255, 255, 255);',
  }, svgContainer);
  this.mouseMoveWrapper_ = Blockly.bindEvent_(this.svg, 'mousemove', this, this.updateDrag_);
  this.mouseUpWrapper_ = Blockly.bindEvent_(this.svg, 'mouseup', this, this.stopDrag_);

  Blockly.createSvgElement('line', {
    'stroke': '#4d575f',
    'stroke-width': this.strokeWidth,
    'stroke-linecap': 'round',
    'x1': this.center.x - this.lineLength.x,
    'x2': this.center.x,
    'y1': this.center.y,
    'y2': this.center.y
  }, this.svg);

  Blockly.createSvgElement('line', {
    'stroke': '#949ca2',
    'stroke-dasharray': '6,6',
    'stroke-width': this.strokeWidth,
    'stroke-linecap': 'round',
    'x1': this.center.x,
    'x2': this.center.x + this.lineLength.x,
    'y1': this.center.y,
    'y2': this.center.y,
  }, this.svg);

  this.arc = Blockly.createSvgElement('path', {
    'stroke': this.arcColour,
    'fill': 'none',
    'stroke-width': this.strokeWidth,
  }, this.svg);

  // Draw markers around the edge.
  for (var a = 15; a < 360; a += 15) {
    Blockly.createSvgElement('line', {
      'stroke-linecap': 'round',
      'x1': this.center.x + this.lineLength.x,
      'y1': this.center.y,
      'x2': this.center.x + this.lineLength.x - (a % 90 == 0 ? 15 : a % 45 == 0 ? 10 : 5),
      'y2': this.center.y,
      'class': 'blocklyAngleMarks',
      'transform': 'rotate(' + a + ', ' + this.center.x + ', ' + this.center.y + ')'
    }, this.svg);
  }

  this.variableLine = Blockly.createSvgElement('line', {
    'stroke': '#4d575f',
    'stroke-width': this.strokeWidth,
    'stroke-linecap': 'round',
    'x1': this.center.x,
    'x2': this.circleCenter.x,
    'y1': this.center.y,
    'y2': this.circleCenter.y
  }, this.svg);

  this.circle = Blockly.createSvgElement('circle', {
    'cx': this.circleCenter.x,
    'cy': this.circleCenter.y,
    'fill': '#a69bc1',
    'r': this.circleR,
    'stroke': '#4d575f',
    'stroke-width': this.strokeWidth,
    'style': 'cursor: move;',
  }, this.svg);
  this.mouseDownWrapper_ = Blockly.bindEvent_(this.circle, 'mousedown', this, this.startDrag_);

  this.update_();
};

/**
 * Usually triggered by a change to this.angle, this method updates the
 * positions of the various movable elements and triggers the optional
 * onUpdate callback
 */
Blockly.AngleHelper.prototype.update_ = function() {
  this.circleCenter = goog.math.Vec2.rotateAroundPoint(
    this.center.clone().add(this.lineLength),
    this.center,
    goog.math.toRadians(this.turnRight ? this.angle : -this.angle)
  );

  this.variableLine.setAttribute('x2', this.circleCenter.x);
  this.variableLine.setAttribute('y2', this.circleCenter.y);

  this.circle.setAttribute('cx', this.circleCenter.x);
  this.circle.setAttribute('cy', this.circleCenter.y);

  var arcStart = 0;
  var arcEnd = this.turnRight ? this.angle : -this.angle;
  this.arc.setAttribute('d', Blockly.AngleHelper.describeArc(this.center, 20, arcStart, arcEnd));
};

Blockly.AngleHelper.prototype.startDrag_ = function() {
  this.dragging = true;
};

Blockly.AngleHelper.prototype.updateDrag_ = function(e) {
  if (!this.dragging) {
    return;
  }

  //var angle = Math.atan2(e.offsetY - this.center.y, e.offsetX - this.center.x) * (180 / Math.PI);
  var angle = goog.math.angle(this.center.x, this.center.y, e.offsetX, e.offsetY);

  if (!this.turnRight) {
    angle = goog.math.standardAngle(-angle);
  }

  this.setAngle(angle);

  if (this.onUpdate) {
    this.onUpdate();
  }
};

Blockly.AngleHelper.prototype.stopDrag_ = function() {
  this.dragging = false;
};

/**
 * If this helper is intended to only align to a subset of points (as is
 * the case in Dropdown mode), return the point in the set closest to
 * the given value. Otherwise, simply round to the nearest integer.
 */
Blockly.AngleHelper.prototype.snap_ = function(val) {
  if (!this.snapPoints) {
    return Math.round(val);
  }

  // return the point closest to the source
  return this.snapPoints.reduce(function(prev, curr) {
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
  goog.dom.removeNode(this.svg);
  this.arc = null;
  this.circle = null;
  this.svg = null;
  this.variableLine = null;
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

  start.round();
  end.round();

  // largeArcFlag should be set if the angle to be drawn is greater than
  // 180 degrees; it determines which "direction" the arc travels around
  // the circle.
  var largeArcFlag = Math.abs(startAngle - endAngle) > 180 ? '1' : '0';

  // Sweep flag determines if the if the arc is moving at "positive"
  // angles or "negative" ones.
  var sweepFlag = endAngle - startAngle < 0 ? '0' : '1';

  var d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
  ].join(' ');

  return d;
}
