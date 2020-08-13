function scene02() {
	this.enter = function () {
		dbg('scene02');
		// ----- clean-up from previous scenes
		noseAnchor = '';
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
			isPosenetReady = false;
		}
		sample.hide();
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
		if (!isFaceApiReady) faceapi = ml5.faceApi(sample, faceOptions, faceReady);
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
		// FIXME: center video
		if (sample) monitor.image(sample, monitor.width / 2 - sample.width / 2, 0);

		// -----ready faceapi
		if (isFaceapiLoaded) {
			// -----live expressions
			if (detections[0]) {
				// -----setup
				// draw a graph of expression data and show the current top expression
				// (completely independently from drawing the shape)
				if (detections[0] && par.debug) previewExpression(detections);
				// show detection feedback on the webcam monitor
				if (detections[0]) previewExpression(detections);

				// -----play live shape

				// -----record shape
			}

			// -----replay record shape

			// -----admin

			// // -----live shape
			// if (!full && history1[0] && detections[0]) {
			// 	playLiveShape2(history1);
			// } else if (full && history2[0]) {
			// 	// -----recorded shape
			// 	playHistoryShape2(history1, analyzeExpressionHistory(history2));
			// 	// Show a notice if we have to wait for the api

			// 	// -----preroll
			// 	// preroll plays a countdown on the monitor before recording starts
			// 	if (preroll) noPreroll();
			// 	// -----debugging
			// 	// shows framerate in the corner of the canvas for debugging purposes
			// 	if (par.frameRate) fps();
			// }

			// -----loading faceapi
		} else {
			// show a loading screen if faceapi is not ready yet
			checkFaceApi();
		}
	};
}

//--------------------------------------------------------------------------------

function makeShape2(history1, shapeStyle) {}

function replayShape2(history1, shapeStyle) {}

function renderShape2(shape) {}

function recordShape2(data) {}

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

function softerBody(pose) {
	// [{pos,part}...]
	// Needs an array of objects that have position.x,position.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];

	// We'll use these later for the torso
	let l1, l2, r1, r2;

	/*  

	point,
	i = 0,
	angles = par.angles,
	minR = 5,
	maxR = 100,
	maxX = 2,
	maxY = 2,
	maxOff = par.phase,
	effect = par.effect

	First argument is the point to expand. 
	Second argument is the distance between
	each point in angles (for example, an angle distance of 1 will add 360
	points). 
	Next two arguments are minimum and maxium radius. 
	Fifth and sixth arguments control how fast the shape will oscilate within 
	the min/max radius values.
	Seventh argument is the maximum phase offset (higher values make the shape 
	appear to rotate.)
	Eighth argument is an iterator used for the noise function.
	Last argument is a modifier applied to every point for adding jitter.


	*/
	pose.forEach((p, i) => {
		switch (p.part) {
			case 'nose':
				let tempNose = {};
				newArr = newArr.concat(expandBlob(p, 1, 10, 100));
				break;
			case 'leftEar':
			case 'rightEar':
				newArr.push([p.position.x, p.position.y]);
				break;
			case 'leftEye':
			case 'rightEye':
				newArr.push([p.position.x, p.position.y]);
				break;
			// Arms
			case 'leftShoulder':
				l1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p, 1, 10, 50, 50, 20, -1));
				break;
			case 'rightShoulder':
				r1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p, 1, 10, 50, 50, 20, -1));
				break;
			case 'leftElbow':
			case 'rightElbow':
			case 'leftWrist':
			case 'rightWrist':
			case 'leftHip':
				l2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p));
				break;
			case 'rightHip':
				r2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p));
				break;
			// case 'leftKnee':
			// case 'rightKnee':
			// case 'leftAnkle':
			// case 'rightAnkle':
			default:
				newArr.push([p.position.x, p.position.y]);
				break;
		}
	});

	// Torso
	let leftSide = p5.Vector.lerp(l1, l2, 0.5);
	let rightSide = p5.Vector.lerp(r1, r2, 0.5);
	let middle1 = p5.Vector.lerp(l1, r1, 0.5);
	let middle2 = p5.Vector.lerp(l2, r2, 0.5);

	newArr = newArr.concat(expandBlob(leftSide));
	newArr = newArr.concat(expandBlob(rightSide));
	newArr = newArr.concat(expandBlob(middle1));
	newArr = newArr.concat(expandBlob(middle2));

	return newArr;
}

function expandBlob(
	point,
	angles = par.angles,
	minR = 5,
	maxR = 100,
	maxX = 2,
	maxY = 2,
	maxOff = par.phase,
	effect = par.effect
) {
	let x, y;
	let px, py;
	let newArr = [];
	if (point.x) {
		px = point.x;
		py = point.y;
	} else if (point.position) {
		px = point.position.x;
		py = point.position.y;
	} else if (point[0]) {
		px = point[0];
		py = point[1];
	}
	for (let a = 0; a < 360; a += par.angles) {
		let xoff = map(cos(a + phase), -1, 1, 0, par.maxY * par.effect);
		let yoff = map(sin(a + phase), -1, 1, 0, par.maxX * par.effect);
		let r = map(
			noise(xoff, yoff, zoff),
			0,
			1,
			par.minR * par.effect,
			par.maxR * par.effect
		);
		x = px + r * cos(a);
		y = py + r * sin(a);
		newArr.push([x, y]);
	}
	let pOff = map(noise(zoff), 0, 1, 0, par.phase * par.effect);
	phase += pOff;
	zoff += par.zNoiseOffset;
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
	monitor.rect(box.x, box.y, box.width, box.height);
	monitor.noStroke();
	monitor.fill('red');
	monitor.push();
	// monitor.translate(monitor.width, 0);
	// monitor.scale(-1, 1);
	monitor.text(
		round(score * 100, 2) + ' ' + current,
		box.bottomLeft.x,
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
		text('Waiting for faceapi', width / 2, height / 2);
		pop();
	}
}

// Takes pose history, creates an array of expanded points based on shape type
function prepareShape(history, shapeType) {
	let newArr = [];
	if (shapeType === 'softer') {
		history.forEach(p => {
			newArr.push(softerBody(p));
		});
	} else {
		history.forEach(p => {
			newArr.push(sharperBody(p));
		});
	}
	return newArr;
}

function normalizeExpression(expression) {
	if (expression[1] > 0.01) {
		return expression[1];
	} else {
		return 0.01;
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
