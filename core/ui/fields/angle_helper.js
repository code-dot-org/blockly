/**
 * @fileoverview Angle Helper for angle Fields
 */
'use strict';

goog.provide('Blockly.AngleHelper');

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

  this.snapPoints = opt_options.snapPoints ?
    Blockly.AngleHelper.normalizeSnapPoints(opt_options.snapPoints) :
    undefined;

  this.center = {
    x: this.width / 2,
    y: this.height / 2
  };

  var circumference = Math.min(this.height, this.width);
  this.lineLength = (circumference / 2) - this.circleR - this.strokeWidth;

  this.circleCenter = Blockly.AngleHelper.polarToCartesian(
    this.center.x,
    this.center.y,
    this.lineLength,
    this.turnRight ? this.angle : -this.angle
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
    'x1': this.center.x - this.lineLength,
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
    'x2': this.center.x + this.lineLength,
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
      'x1': this.center.x + this.lineLength,
      'y1': this.center.y,
      'x2': this.center.x + this.lineLength - (a % 90 == 0 ? 15 : a % 45 == 0 ? 10 : 5),
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
  this.circleCenter = Blockly.AngleHelper.polarToCartesian(
    this.center.x,
    this.center.y,
    this.lineLength,
    this.turnRight ? this.angle : -this.angle
  );

  this.variableLine.setAttribute('x2', this.circleCenter.x);
  this.variableLine.setAttribute('y2', this.circleCenter.y);

  this.circle.setAttribute('cx', this.circleCenter.x);
  this.circle.setAttribute('cy', this.circleCenter.y);

  var arcStart = this.turnRight ? 0 : -this.angle;
  var arcEnd = this.turnRight ? this.angle : 0;
  this.arc.setAttribute('d', Blockly.AngleHelper.describeArc(this.center.x, this.center.y, 20, arcStart, arcEnd));
};

Blockly.AngleHelper.prototype.startDrag_ = function() {
  this.dragging = true;
};

Blockly.AngleHelper.prototype.updateDrag_ = function(e) {
  if (!this.dragging) {
    return;
  }

  var angle = Math.atan2(e.offsetY - this.center.y, e.offsetX - this.center.x) * (180 / Math.PI);

  if (!this.turnRight) {
    angle *= -1;
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

  // normalize from the range [0, 360] to [-180, 180], as we did when we
  // created this.snapPoints
  val = val > 180 ? val - 360 : val;

  // return the point closest to the source
  return this.snapPoints.reduce(function(prev, curr) {
    return (Math.abs(curr.normalized - val) < Math.abs(prev.normalized - val) ? curr : prev);
  }).original;
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
 * @typedef {Object} NormalizedSnapPoint
 * @property {number} original
 * @property {number} normalized
 */

/**
 * Normalize the given set of angles from the range [0, 360] to [-180, 180]
 * so our distance calculations work, but retain the original for
 * eventual return.
 * @param {number[]} snapPoints
 * @return {NormalizedSnapPoint[]}
 */
Blockly.AngleHelper.normalizeSnapPoints = function(snapPoints) {
  return snapPoints.map(function(point) {
    var value = parseInt(point);
    return {
      original: value,
      normalized: value > 180 ? value - 360 : value
    };
  });
};

/**
 * Convert the given polar coordinates to cartesian coordinates.
 * from http://stackoverflow.com/a/18473154/1810460
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {number} angleInDegrees
 * @return {object} x and y cartesian coordinates
 */
Blockly.AngleHelper.polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = angleInDegrees * Math.PI / 180.0;

  return {
    x: Math.round(centerX + (radius * Math.cos(angleInRadians))),
    y: Math.round(centerY + (radius * Math.sin(angleInRadians)))
  };
};

/**
 * Create an SVG path string describing the given arc
 * @param {number} x - center of arc
 * @param {number} y - center of arc
 * @param {number} radius
 * @param {number} startAngle
 * @param {number} endAngle
 * @return {String} path
 */
Blockly.AngleHelper.describeArc = function(x, y, radius, startAngle, endAngle) {
  var start = Blockly.AngleHelper.polarToCartesian(x, y, radius, endAngle);
  var end = Blockly.AngleHelper.polarToCartesian(x, y, radius, startAngle);

  var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  var sweepFlag = endAngle - startAngle >= 0 ? '0' : '1';

  var d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
  ].join(' ');

  return d;
}
