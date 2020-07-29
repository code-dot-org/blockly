'use strict';

function test_snap() {
  var points = [0, 45, 90, 180, 270, 359];

  var angleHelper = new Blockly.AngleHelper('', {
    snapPoints: points
  });

  for (var i = 0; i < 360; i++) {
    var expected;
    switch (true) {
      case i < 23:
        expected = 0;
        break;
      case i < 68:
        expected = 45;
        break;
      case i < 136:
        expected = 90;
        break;
      case i < 226:
        expected = 180;
        break;
      case i < 315:
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
    var actual = Blockly.AngleHelper.describeArc(
      center,
      100,
      startAngle,
      endAngle
    );
    assertEquals(expected, actual);
  }

  var tests = [
    [0, 0, 'M 100.00 0.00 A 100 100 0 0 1 100.00 0.00 L 0 0'],
    [0, 45, 'M 100.00 0.00 A 100 100 0 0 1 70.71 70.71 L 0 0'],
    [0, 90, 'M 100.00 0.00 A 100 100 0 0 1 0.00 100.00 L 0 0'],
    [0, 180, 'M 100.00 0.00 A 100 100 0 0 1 -100.00 0.00 L 0 0'],
    [0, 270, 'M 100.00 0.00 A 100 100 0 1 1 -0.00 -100.00 L 0 0'],
    [0, 360, 'M 100.00 0.00 A 100 100 0 1 1 100.00 -0.00 L 0 0'],
    [0, 450, 'M 100.00 0.00 A 100 100 0 1 1 0.00 100.00 L 0 0'],
    [0, -45, 'M 100.00 0.00 A 100 100 0 0 0 70.71 -70.71 L 0 0'],
    [0, -90, 'M 100.00 0.00 A 100 100 0 0 0 0.00 -100.00 L 0 0'],
    [0, -180, 'M 100.00 0.00 A 100 100 0 0 0 -100.00 -0.00 L 0 0'],
    [0, -270, 'M 100.00 0.00 A 100 100 0 1 0 -0.00 100.00 L 0 0'],
    [0, -360, 'M 100.00 0.00 A 100 100 0 1 0 100.00 0.00 L 0 0'],
    [0, -450, 'M 100.00 0.00 A 100 100 0 1 0 0.00 -100.00 L 0 0']
  ];

  tests.forEach(function(test) {
    evaluate(test[0], test[1], test[2]);
  });
}

function test_picker_initial_location() {
  var tests = [
    [/* angle */ 0, /* handle X */ 87, /* handle Y */ 50],
    [/* angle */ 45, /* handle X */ 76.16, /* handle Y */ 76.16],
    [/* angle */ 90, /* handle X */ 50, /* handle Y */ 87],
    [/* angle */ 135, /* handle X */ 23.83, /* handle Y */ 76.16],
    [/* angle */ 180, /* handle X */ 13, /* handle Y */ 50],
    [/* angle */ 225, /* handle X */ 23.83, /* handle Y */ 23.83],
    [/* angle */ 270, /* handle X */ 50, /* handle Y */ 13],
    [/* angle */ 315, /* handle X */ 76.16, /* handle Y */ 23.83]
  ];
  var assertWithin = function(val1, val2, threshold) {
    assert(Math.abs(val1 - val2) < threshold);
  };
  tests.forEach(function(test) {
    var angleHelper = new Blockly.AngleHelper('turnRight', {
      angle: test[0],
      width: 100,
      height: 100
    });
    assertWithin(angleHelper.picker_.handleCenter.x, test[1], 0.01);
    assertWithin(angleHelper.picker_.handleCenter.y, test[2], 0.01);
  });
}

function test_picker_update_location() {
  var angleHelper = new Blockly.AngleHelper('turnRight', {
    angle: 0,
    width: 100,
    height: 100
  });
  angleHelper.init();
  var tests = [
    [/* angle */ 0, /* handle X */ 87, /* handle Y */ 50],
    [/* angle */ 45, /* handle X */ 76.16, /* handle Y */ 76.16],
    [/* angle */ 90, /* handle X */ 50, /* handle Y */ 87],
    [/* angle */ 135, /* handle X */ 23.83, /* handle Y */ 76.16],
    [/* angle */ 180, /* handle X */ 13, /* handle Y */ 50],
    [/* angle */ 225, /* handle X */ 23.83, /* handle Y */ 23.83],
    [/* angle */ 270, /* handle X */ 50, /* handle Y */ 13],
    [/* angle */ 315, /* handle X */ 76.16, /* handle Y */ 23.83]
  ];
  var assertWithin = function(val1, val2, threshold) {
    assert(Math.abs(val1 - val2) < threshold);
  };
  tests.forEach(function(test) {
    angleHelper.setAngle(test[0]);
    assertWithin(angleHelper.picker_.handleCenter.x, test[1], 0.01);
    assertWithin(angleHelper.picker_.handleCenter.y, test[2], 0.01);
  });
}

function test_start_drag() {
  var angleHelper = new Blockly.AngleHelper('turnRight', {
    angle: 0,
    width: 100,
    height: 100,
    enableBackgroundRotation: true
  });
  angleHelper.init();
  var tests = [
    // outside both handles
    [
      /* mouseX */ 75,
      /* mouseY */ 75,
      /* picker */ true,
      /* background */ false
    ],
    // inside background handle
    [
      /* mouseX */ 95,
      /* mouseY */ 50,
      /* picker */ false,
      /* background */ true
    ],
    // inside picker handle
    [
      /* mouseX */ 87,
      /* mouseY */ 50,
      /* picker */ true,
      /* background */ false
    ]
  ];
  tests.forEach(function(test) {
    angleHelper.startDrag_({clientX: test[0], clientY: test[1]});
    assertEquals(angleHelper.picker_.isDragging, test[2]);
    assertEquals(angleHelper.background_.isDragging, test[3]);
    angleHelper.stopDrag_();
    assertEquals(angleHelper.picker_.isDragging, false);
    assertEquals(angleHelper.background_.isDragging, false);
  });
}

function test_update_drag() {
  var angleHelper = new Blockly.AngleHelper('turnRight', {
    angle: 0,
    width: 100,
    height: 100,
    enableBackgroundRotation: true
  });
  angleHelper.init();
  var tests = [
    [/* angle */ 0, /* mouseX */ 87, /* mouseY */ 50],
    [/* angle */ 45, /* mouseX */ 76.16, /* mouseY */ 76.16],
    [/* angle */ 90, /* mouseX */ 50, /* mouseY */ 87],
    [/* angle */ 135, /* mouseX */ 23.83, /* mouseY */ 76.16],
    [/* angle */ 180, /* mouseX */ 13, /* mouseY */ 50],
    [/* angle */ 225, /* mouseX */ 23.83, /* mouseY */ 23.83],
    [/* angle */ 270, /* mouseX */ 50, /* mouseY */ 13],
    [/* angle */ 315, /* mouseX */ 76.16, /* mouseY */ 23.83]
  ];
  var assertWithin = function(val1, val2, threshold) {
    assert(Math.abs(val1 - val2) < threshold);
  };

  tests.forEach(function(test) {
    angleHelper.background_.isDragging = true;
    angleHelper.updateDrag_({
      clientX: test[1],
      clientY: test[2],
      stopPropagation: function() {},
      preventDefault: function() {}
    });
    assertWithin(angleHelper.background_.angle, test[0], 0.1);
    angleHelper.background_.isDragging = false;
  });
  angleHelper.init();

  tests.forEach(function(test) {
    angleHelper.background_.angle = 20;
    angleHelper.picker_.isDragging = true;
    angleHelper.updateDrag_({
      clientX: test[1],
      clientY: test[2],
      stopPropagation: function() {},
      preventDefault: function() {}
    });
    assertWithin(
      angleHelper.picker_.angle,
      goog.math.standardAngle(test[0] - angleHelper.background_.angle),
      0.1
    );
  });
}
