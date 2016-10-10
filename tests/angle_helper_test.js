'use strict';

function test_polarToCartesian() {
  
  function evaluate(angle, expected) {
    var actual = Blockly.AngleHelper.polarToCartesian(0, 0, 100, angle);

    assertEquals(actual.x, expected.x);
    assertEquals(actual.y, expected.y);
  }

  var tests = [
    [-180, {x: -100, y: 0}],
    [0, {x: 100, y: 0}],
    [180, {x: -100, y: 0}],
    [45, {x: 71, y: 71}],
    [90, {x: 0, y: 100}],
  ];

  tests.forEach(function(test) {
    evaluate(test[0], test[1]);
  });
}

function test_describeArc() {
  function evaluate(startAngle, endAngle, expected) {
    var actual = Blockly.AngleHelper.describeArc(0, 0, 100, startAngle, endAngle);
    assertEquals(expected, actual);
  }


  var tests = [
    [0, 0, "M 100 0 A 100 100 0 0 0 100 0"],
    [0, 45, "M 71 71 A 100 100 0 0 0 100 0"],
    [0, 90, "M 0 100 A 100 100 0 0 0 100 0"],
    [0, 180, "M -100 0 A 100 100 0 0 0 100 0"],
    [0, 270, "M 0 -100 A 100 100 0 1 0 100 0"],
    [0, 360, "M 100 0 A 100 100 0 1 0 100 0"],
    [0, 450, "M 0 100 A 100 100 0 1 0 100 0"],
    [0, -45, "M 71 -71 A 100 100 0 0 1 100 0"],
    [0, -90, "M 0 -100 A 100 100 0 0 1 100 0"],
    [0, -180, "M -100 0 A 100 100 0 0 1 100 0"],
    [0, -270, "M 0 100 A 100 100 0 0 1 100 0"],
    [0, -360, "M 100 0 A 100 100 0 0 1 100 0"],
    [0, -450, "M 0 -100 A 100 100 0 0 1 100 0"],
  ];

  tests.forEach(function(test) {
    evaluate(test[0], test[1], test[2]);
  });
}
