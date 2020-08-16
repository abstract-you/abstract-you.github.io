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
		sample.size(668, 500);
		sample.hide();
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
		// -----faceapi
		isFaceapiStandby = false;
		// kickstart face detection
		// gotFaces() calls itelfs every frame while isFaceapiStandby is false
		faceapi.detect(gotFaces);
		// if (!isFaceApiReady) faceapi = ml5.faceApi(sample, faceOptions, faceLoaded);
		// ----- page layout
		sketchCanvas.parent('#canvas-02');
		resizeCanvas(820, 820);
		// show preview in secondary canvas
		monitor.parent('#webcam-monitor-02');
		monitor.show();
		// ----- rewire ui
		// rehook and reset and show record button
		recButton = select('#record-button-02');
		recButton.html('Record');
		recButton.removeClass('rec');
		recButton.mousePressed(() => startRecording());
		recButton.show();
		// reset and show counter
		counterButton = select('#counter-02');
		// update recording time based on recording frames. assumes a recording time of less than 60 seconds...
		counterButton.html('00:' + par.recordFrames / 60);
		counterButton.show();
		// rehook button for this scene, and hide for now
		redoButton = select('#redo-02');
		redoButton.mousePressed(() => mgr.showScene(scene02));
		redoButton.hide();
		// rehook next button for this scene, and hide for now
		nextButton = select('#next-button-02');
		nextButton.mousePressed(() => mgr.showScene(scene03));
		nextButton.hide();
		// ----- scene management
		chooseScene('#scene-02');
	};

	// --draw
	this.draw = function () {
		// -----prepare the scene
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
			monitor.image(sample, 180 + par.videoSync, 0);
			monitor.pop();
		}

		// -----ready faceapi
		if (isFaceapiLoaded) {
			// -----live expressions
			if (detections[0]) {
				// -----setup
				let currentShapeType = getShapeType();
				if (par.lockStar) currentShapeType = 'sharper';
				// draw a graph of expression data and show the current top expression
				// (completely independently from drawing the shape)
				if (detections[0] && par.debug) graphExpressions(detections);
				// show detection feedback on the webcam monitor
				if (detections[0]) previewExpression(detections);

				// -----play live shape
				if (!full) replayShape2(history1, currentShapeType);

				// -----record shape
			}

			// -----replay record shape
if (full) replayShape2(history1, analyzeExpressionHistory(history2));

			// -----admin
			if (par.frameRate || par.debug) {
				push();
				mirror();
				fps();
				pop();
			}

			// -----loading faceapi
		} else {
			// show a loading screen if faceapi is not ready yet
			checkFaceApi();
		}
	};
}

//--------------------------------------------------------------------------------

// -----shape pipeline: step 2, stylize shape based on expression data
// Anchors target history points to redraw the basic shape from step 1.
// A shape type is determined from expression data.
// Expanded shapes are drawn around anchors based on the shape type.
// Convex hull is calculated from all points to determine outline path. Roundness is set based on shape type.
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
		console.error('bad shape type');
	}
	endShape();
	pop();
}

function recordShape2(data) {
	history2.push(data);
	updateCounter(par.recordFrames - history2.length);
	if (history2.length > par.recordFrames) {
		dbg('recorded ' + par.recordFrames + ' frames');
		finishRecording();
	}
}

function replayShape2(history, expression) {
	let cp = frameCount % history.length;
	makeShape2(history[cp], expression);
}

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------

// Plays the history from step1 and applies expression data on top of it
// Gets loaded with `history1` which is an array of posenet poses
function playLiveShape2(history) {
	let cp = frameCount % history.length; // TODO: sync iterator
	drawLiveShape2(history[cp]);
}

function drawLiveShape2(points) {
	let shapeType = getShapeType();
	if (rec && detections[0]) recordExpression(shapeType);

	// chasePose(points);
	Anchor.chasePose(points);
	if (shapeType === 'softer') {
		expanded = softerBody(anchors);
	} else {
		expanded = sharperBody(anchors);
	}

	// Show expansions for reference
	if (par.showExpanded) {
		push();
		stroke('paleturquoise');
		strokeWeight(5);
		expanded.forEach(p => {
			point(p[0], p[1]);
		});
		pop();
	}

	if (shapeType === 'softer') {
		hullSet = hull(expanded, par.roundnessSofter);
	} else {
		hullSet = hull(expanded, par.roundnessSharper);
	}
	let padded = [];

	hullSet.forEach(p => {
		padded.push([
			remap(p[0], par.sampleWidth, width, par.padding2),
			remap(p[1], par.sampleHeight, height, par.padding2),
		]);
	});

	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	padded.forEach(p => {
		if (shapeType === 'softer') {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
}

// Play from a stored array of anchor positions and use the shaetype to determine how to expand them
function playHistoryShape2(history, shapeType) {
	if (!history[0]) {
		history = samplePose;
	}
	let cp = frameCount % history.length;
	drawHistoryShape2(history[cp], shapeType);
}

function drawHistoryShape2(history, shapeType) {
	Anchor.chasePose(history);
	if (shapeType === 'softer') {
		expanded = softerBody(anchors);
	} else {
		expanded = sharperBody(anchors);
	}

	if (shapeType === 'softer') {
		hullSet = hull(expanded, par.roundnessSofter);
	} else {
		hullSet = hull(expanded, par.roundnessSharper);
	}

	let padded = [];

	hullSet.forEach(p => {
		padded.push([
			remap(p[0], par.sampleWidth, width, par.padding2),
			remap(p[1], par.sampleHeight, height, par.padding2),
		]);
	});

	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	padded.forEach(p => {
		if (shapeType === 'softer') {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
}

function sharperBody(pose) {
	// [{pos,part}...]
	// Needs an array of objects that have postion.x,position.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];

	pose.forEach((p, i) => {
		switch (p.part) {
			case 'nose':
				newArr = newArr.concat(
					star(
						p.position.x,
						p.position.y,
						par.innerStar, // radius for inner circle
						par.outerStar, // radius for external circle
						par.starPoints // number of points
					)
				);
				break;
			// case 'leftEar':
			// case 'rightEar':
			// case 'leftEye':
			// case 'rightEye':
			case 'leftShoulder':
			case 'rightShoulder':
			case 'leftElbow':
			case 'rightElbow':
			case 'leftWrist':
			case 'rightWrist':
			case 'leftHip':
			case 'rightHip':
			case 'leftKnee':
			case 'rightKnee':
			case 'leftAnkle':
			case 'rightAnkle':
			default:
				if (!par.noseOnly)
					newArr = newArr.concat(
						star(
							p.position.x,
							p.position.y,
							par.innerStar,
							par.outerStar,
							par.starPoints
						)
					);
				break;
		}
	});

	return newArr;
}

function star(x, y, radius1, radius2, npoints) {
	let newArr = [];
	let xoff = x;
	let yoff = y;
	let offStep = 0.01;
	push();
	angleMode(RADIANS);
	let angle = TWO_PI / npoints;
	let halfAngle = angle / 2.0;
	for (let a = 0; a < TWO_PI; a += angle) {
		let sx = map(noise(xoff, yoff), 0, 1, -10, 10) + x + cos(a) * radius2;
		xoff += offStep;
		let sy = map(noise(xoff, yoff), 0, 1, -10, 10) + y + sin(a) * radius2;
		yoff += offStep;
		newArr.push([sx, sy]);
		sx = x + cos(a + halfAngle) * radius1;
		sy = y + sin(a + halfAngle) * radius1;
		newArr.push([sx, sy]);
	}
	pop();
	return newArr;
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
		round(score * 100, 2) + ' ' + current,
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

function recordExpression(typ) {
	history2.push(typ);
	updateCounter(par.recordFrames - history2.length);
	if (history2.length === par.recordFrames) finishRecording();
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

// utitlity functions to handle all the different body parts without cluttering up the main code

function expandStar() {
	let newArr = [];
	newArr = newArr.concat(anchors.nose.starify(2.5));
	newArr = newArr.concat(anchors.leftEar.starify());
	newArr = newArr.concat(anchors.rightEar.starify());
	newArr = newArr.concat(anchors.leftShoulder.starify(2));
	newArr = newArr.concat(anchors.rightShoulder.starify(2));
	newArr = newArr.concat(anchors.leftElbow.starify());
	newArr = newArr.concat(anchors.rightElbow.starify());
	newArr = newArr.concat(anchors.leftWrist.starify());
	newArr = newArr.concat(anchors.rightWrist.starify());
	newArr = newArr.concat(anchors.leftHip.starify(2));
	newArr = newArr.concat(anchors.rightHip.starify(2));
	newArr = newArr.concat(anchors.leftKnee.starify());
	newArr = newArr.concat(anchors.rightKnee.starify());
	newArr = newArr.concat(anchors.leftAnkle.starify());
	newArr = newArr.concat(anchors.rightAnkle.starify());
	// console.log('expandStar')
	// console.log(newArr)
	return newArr;
}

function expandBlob() {
	let newArr = [];
	// blobify()
	newArr = newArr.concat(anchors.nose.blobify(2.2));
	newArr = newArr.concat(anchors.leftEar.blobify(0.8));
	newArr = newArr.concat(anchors.rightEar.blobify(0.8));
	newArr = newArr.concat(anchors.leftShoulder.blobify(1.5));
	newArr = newArr.concat(anchors.rightShoulder.blobify(1.5));
	newArr = newArr.concat(anchors.leftElbow.blobify(1.3));
	newArr = newArr.concat(anchors.rightElbow.blobify(1.3));
	newArr = newArr.concat(anchors.leftWrist.blobify());
	newArr = newArr.concat(anchors.rightWrist.blobify());
	newArr = newArr.concat(anchors.leftHip.blobify(1.5));
	newArr = newArr.concat(anchors.rightHip.blobify(1.5));
	newArr = newArr.concat(anchors.leftKnee.blobify(1.3));
	newArr = newArr.concat(anchors.rightKnee.blobify(1.3));
	newArr = newArr.concat(anchors.leftAnkle.blobify());
	newArr = newArr.concat(anchors.rightAnkle.blobify());
	// console.log('expandBlob')
	// console.log(newArr)
	return newArr;
}
