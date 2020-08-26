function scene02() {
	this.enter = function () {
		dbg('scene02');
		frameRate(par.frameRate);
		// ----- clean-up from previous scenes
		noseAnchor = '';
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
			isPosenetReady = false;
		}
		sample.size(par.webcamWidth, par.webcamHeight);
		sample.hide();
		select('body').removeClass('light');

		// -----load a prerecordeded dataset if there's nothing from step 1
		// dancer.js should be a posenet recording of a person dancing. It
		// also stores skeleton data so first we're extracting just the poses
		if (history1.length === 0) {
			recordedPose.forEach(p => {
				if (p) history1.push(p.pose.keypoints);
			});
		}

		// ----- reset state vars
		history2 = [];
		full = false;
		rec = false;
		preroll = false;
		play = false;

		// -----scene setup
		// -----faceapi
		isFaceapiStandby = false;
		// kickstart face detection
		// gotFaces() calls itelfs every frame while isFaceapiStandby is false
		faceapi.detect(gotFaces);

		// ----- page layout
		sketchCanvas.parent('#canvas-02');
		resizeCanvas(820, 820);
		// show preview in secondary canvas
		monitor.parent('#webcam-monitor-02');
		monitor.show();

		// ----- rewire ui
		rewireUI();

		// ----- scene management
		chooseScene('#scene-02');
	};

	// --draw
	this.draw = function () {
		// -----prepare the frame
		background(colors.primary);
		// show a dark background on the webcam monitor until the webcam feed starts
		monitor.background(0);
		// mirror the canvas to match the mirrored video from the camera
		translate(width, 0);
		scale(-1, 1);
		// render video on the monitor canvas and center it
		if (sample) {
			monitor.push();
			mirror(monitor);
			monitor.image(
				sample,
				par.dx,
				par.dy,
				par.dwidth,
				par.dheight,
				par.sx,
				par.sy,
				par.swidth,
				par.sheight
			);
			monitor.pop();
		}

		let currentShapeType = 'softer';
		// -----faceapi ready loaded and working
		if (isFaceapiLoaded) {
			// -----live expressions
			if (detections[0]) {
				if (par.lockStar) {
					currentShapeType = 'sharper';
				} else {
					currentShapeType = getShapeType();
				}

				// draw a graph of expression data and show the current top expression
				// (completely independently from drawing the shape)
				if (detections[0] && par.showExpressionGraph)
					graphExpressions(detections);

				// show detection feedback on the webcam monitor
				if (detections[0]) previewExpression(detections);
			}
			// -----play live shape
			if (!full) replayShape2(history1, currentShapeType);

			// -----record shape
			if (rec && !full) recordExpression(currentShapeType);

			// -----replay record shape
			if (full) replayShape2(history1, analyzeExpressionHistory(history2));

			// -----admin
			if (par.frameRate || par.debug) {
				push();
				mirror();
				fps();
				pop();
			}

			// -----faceapi still not ready
		} else {
			// show a loading screen if faceapi is not ready yet
			checkFaceApi();
		}
	};
}

//--------------------------------------------------------------------------------

// -----shape pipeline: step 2, stylize shape based on expression data
// (1) Anchors target history points to redraw the basic shape from step 1 (2) A
// shape type is determined from expression data (3) Expanded shapes are drawn
// around anchors based on the shape type (4) Convex hull is calculated from all
// points to determine outline path. Roundness is set based on shape type (5)
// Padding is addded to keep the shape centered
// TRY. Create additional expansion points around torso and be tween limb points.
// Especially for the star shape

function makeShape2(pose, shapeType) {
	// console.log('makeShape2');
	// console.log('pose');
	// console.log(pose);
	// console.log('shapeType');
	// console.log(shapeType);
	// set up anchors
	Anchor.chasePose(pose);
	// expand and get hull based on live shape type
	let expanded = [];
	let hullSet = [];
	if (shapeType === 'softer') {
		expanded = expandBlob();
		hullSet = hull(expanded, par.roundnessSofter);
	} else if (shapeType === 'sharper') {
		expanded = expandStar();
		// console.log(expanded)
		hullSet = hull(expanded, par.roundnessSharper);
	} else {
		console.error('bad shape type from makeShape2');
	}
	// console.log('expanded:', expanded)
	// console.log('hullSet:', hullSet)
	// a hack, but it looks better than just doing endShape(CLOSE)
	hullSet.push(hullSet[1]);
	hullSet.push(hullSet[0]);

	// remap to canvas and apply padding
	let padded = remapFromPose(hullSet);
	// -----
	// -----final render call
	if (!par.hideShape) renderShape2(padded, shapeType);
	// -----reference shapes
	if (par.showExpanded || par.debug)
		drawRef(remapFromPose(expanded), 'paleturquoise', 5);
	if (par.showHullset || par.debug) drawRef(remapFromPose(hullSet), 'cyan', 5);
	// (anchors draw their own reference after retaregtting)
}

// draw final shape outline
function renderShape2(shape, shapeType) {
	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	if (shapeType === 'softer') {
		shape.forEach(p => {
			curveVertex(p[0], p[1]);
		});
	} else if (shapeType === 'sharper') {
		shape.forEach(p => {
			vertex(p[0], p[1]);
		});
	} else {
		console.error('bad shape type from renderShape2');
	}
	endShape();
	pop();
}

function replayShape2(history, expression) {
	let cp = frameCount % history.length;
	makeShape2(history[cp], expression);
}

// draws an expression graph for the first detected face at top left of canvas
// show current expression on the bottom of the canvas
function graphExpressions(faces) {
	let expressions;
	push();
	translate(width, 0);
	scale(-1, 1);
	({ expressions } = faces[0]);
	Object.keys(expressions).forEach((item, idx) => {
		textAlign(RIGHT);
		text(item, 110, idx * 20 + 22);
		const val = map(expressions[item], 0, 1, 0, 100);
		text(floor(val), 140, idx * 20 + 22);
		rect(160, idx * 20 + 10, val, 15);
	});
	let current = topExpression(faces[0].expressions);
	textAlign(CENTER);
	textSize(18);
	text(current, width / 2, height - 18);
	textAlign(LEFT);
	pop();
}

// draws a sqaure around the face in the monitor
// shows expression and score under the square
function previewExpression(faces) {
	let current = topExpression(faces[0].expressions);
	let score = faces[0].expressions[current];
	let box = faces[0].detection.box;
	monitor.stroke('blue');
	monitor.noFill();
	// manually mirrorring back so we don't mess up the text
	monitor.rect(monitor.width - box.x, box.y, box.width, box.height);
	monitor.noStroke();
	monitor.fill('red');
	monitor.push();
	// monitor.translate(monitor.width, 0);
	// monitor.scale(-1, 1);
	monitor.text(
		current + ' (' + round(score, 2) + ')',
		monitor.width - box.bottomLeft.x,
		box.bottomLeft.y + 20
	);
	monitor.pop();
}

// Sorts expressions and returns the top result
function topExpression(unsorted) {
	let sorted = [];
	sorted = Object.entries(unsorted);
	sorted.sort((a, b) => b[1] - a[1]);
	return sorted[0][0];
}

function recordExpression(data) {
	history2.push(data);
	updateCounter(par.recordFrames - history2.length);
	if (history2.length >= par.recordFrames) finishRecording();
}

// Runs on expressionAggregate which is an array of shape types (softer/sharper)
function analyzeExpressionHistory(exps) {
	let softer = 0;
	let sharper = 0;
	if (exps[0]) {
		exps.forEach(ex => {
			switch (ex) {
				case 'softer':
					softer++;
					break;
				case 'sharper':
					sharper++;
					break;
			}
		});
	}
	if (softer > sharper) {
		return 'softer';
	} else {
		return 'sharper';
	}
}

function checkFaceApi() {
	if (!isFaceapiLoaded) {
		push();
		mirror(); // Unmirror so we can write in the right direction
		textAlign(CENTER);
		textSize(14);
		text('Loading', width / 2, height - 54);
		pop();
	}
}

function getShapeType() {
	let expression, type;
	if (detections) {
		if (detections[0]) {
			expression = topExpression(detections[0].expressions);
			switch (expression) {
				case 'happy':
				case 'surprised':
				case 'neutral':
					type = 'softer';
					break;
				default:
					type = 'sharper';
					break;
			}
		}
	} else {
		type = 'softer';
	}
	return type;
}

// ----- utitlity functions to handle all the different body parts without cluttering up the main code

// calls starify() with different paramaters for each body part
function expandStar() {
	let newArr = [];
	newArr = newArr.concat(anchors.nose.starify(par.star0Nose));
	newArr = newArr.concat(anchors.leftEar.starify(par.star1LeftEye));
	newArr = newArr.concat(anchors.rightEar.starify(par.star2RightEye));
	newArr = newArr.concat(anchors.rightEar.starify(par.star3LeftEar));
	newArr = newArr.concat(anchors.rightEar.starify(par.star4RightEar));
	newArr = newArr.concat(anchors.leftShoulder.starify(par.star5LeftShoulder));
	newArr = newArr.concat(anchors.rightShoulder.starify(par.star6RightShoulder));
	newArr = newArr.concat(anchors.leftElbow.starify(par.star7LeftElbow));
	newArr = newArr.concat(anchors.rightElbow.starify(par.star8RightElbow));
	newArr = newArr.concat(anchors.leftWrist.starify(par.star9LeftWrist));
	newArr = newArr.concat(anchors.rightWrist.starify(par.star10RightWrist));
	newArr = newArr.concat(anchors.leftHip.starify(par.star11LeftHip));
	newArr = newArr.concat(anchors.rightHip.starify(par.star12RightHip));
	newArr = newArr.concat(anchors.leftKnee.starify(par.star13LeftKnee));
	newArr = newArr.concat(anchors.rightKnee.starify(par.star14RightKnee));
	newArr = newArr.concat(anchors.leftAnkle.starify(par.star15LeftAnkle));
	newArr = newArr.concat(anchors.rightAnkle.starify(par.star16RightAnkle));
	// console.log('expandStar')
	// console.log(newArr)
	return newArr;
}

// calls blobify() with different paramaters for each body part
function expandBlob() {
	let newArr = [];
	// blobify()

	// FIXME: This is a bug
	newArr = newArr.concat(anchors.rightAnkle.starify(0));

	newArr = newArr.concat(anchors.nose.blobify(par.blob0Nose, par.blob0NoseInc));
	newArr = newArr.concat(anchors.leftEar.blobify(par.blob1LeftEye));
	newArr = newArr.concat(anchors.rightEar.blobify(par.blob2RightEye));
	newArr = newArr.concat(anchors.rightEar.blobify(par.blob3LeftEar));
	newArr = newArr.concat(anchors.rightEar.blobify(par.blob4RightEar));
	newArr = newArr.concat(anchors.leftShoulder.blobify(par.blob5LeftShoulder));
	newArr = newArr.concat(anchors.rightShoulder.blobify(par.blob6RightShoulder));
	newArr = newArr.concat(anchors.leftElbow.blobify(par.blob7LeftElbow));
	newArr = newArr.concat(anchors.rightElbow.blobify(par.blob8RightElbow));
	newArr = newArr.concat(anchors.leftWrist.blobify(par.blob9LeftWrist));
	newArr = newArr.concat(anchors.rightWrist.blobify(par.blob10RightWrist));
	newArr = newArr.concat(anchors.leftHip.blobify(par.blob11LeftHip));
	newArr = newArr.concat(anchors.rightHip.blobify(par.blob12RightHip));
	newArr = newArr.concat(anchors.leftKnee.blobify(par.blob13LeftKnee));
	newArr = newArr.concat(anchors.rightKnee.blobify(par.blob14RightKnee));
	newArr = newArr.concat(anchors.leftAnkle.blobify(par.blob15LeftAnkle));
	newArr = newArr.concat(anchors.rightAnkle.blobify(par.blob16RightAnkle));
	// console.log('expandBlob')
	// console.log(newArr)
	return newArr;
}
