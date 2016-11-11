'use strict';

function test_snap() {
  var points = [0, 45, 90, 180, 270, 359];

  var angleHelper = new Blockly.AngleHelper('', {
    snapPoints: points
  });

  for (var i = 0; i < 360; i++) {
    var expected;
    switch(true) {
      case (i < 23):
        expected = 0;
        break;
      case (i < 68):
        expected = 45;
        break;
      case (i < 136):
        expected = 90;
        break;
      case (i < 226):
        expected = 180;
        break;
      case (i < 315):
        expected = 270;
        break;
      default:
        expected = 359;
        break;
    }

    var actual = angleHelper.snap_(i);
    assertEquals(expected, actual);
  }
}

function test_describeArc() {
  var center = new goog.math.Vec2(0, 0);

  function evaluate(startAngle, endAngle, expected) {
    var actual = Blockly.AngleHelper.describeArc(center, 100, startAngle, endAngle);
    assertEquals(expected, actual);
  }

  var tests = [
    [0, 0, "M 100.00 0.00 A 100 100 0 0 1 100.00 0.00"],
    [0, 45, "M 100.00 0.00 A 100 100 0 0 1 70.71 70.71"],
    [0, 90, "M 100.00 0.00 A 100 100 0 0 1 0.00 100.00"],
    [0, 180, "M 100.00 0.00 A 100 100 0 0 1 -100.00 0.00"],
    [0, 270, "M 100.00 0.00 A 100 100 0 1 1 -0.00 -100.00"],
    [0, 360, "M 100.00 0.00 A 100 100 0 1 1 100.00 -0.00"],
    [0, 450, "M 100.00 0.00 A 100 100 0 1 1 0.00 100.00"],
    [0, -45, "M 100.00 0.00 A 100 100 0 0 0 70.71 -70.71"],
    [0, -90, "M 100.00 0.00 A 100 100 0 0 0 0.00 -100.00"],
    [0, -180, "M 100.00 0.00 A 100 100 0 0 0 -100.00 -0.00"],
    [0, -270, "M 100.00 0.00 A 100 100 0 1 0 -0.00 100.00"],
    [0, -360, "M 100.00 0.00 A 100 100 0 1 0 100.00 0.00"],
    [0, -450, "M 100.00 0.00 A 100 100 0 1 0 0.00 -100.00"]
  ];

  tests.forEach(function(test) {
    evaluate(test[0], test[1], test[2]);
  });
}
