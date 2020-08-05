function scene02() {
	// --enter
	this.enter = function () {
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = false;
		if (!faceapiLoaded) faceapi = ml5.faceApi(sample, faceOptions, faceReady);
		resetRecVariables();
		chooseScene('#scene-02');
		canvas.parent('#canvas-02');
		resizeCanvas(820, 820);
		vf.parent('#webcam-monitor-02');
		button = select('#record-button-02');
		button.removeClass('primary');
		button.html('Record');
		button.mousePressed(() => {
			noPreroll();
		});
	};

	// --draw
	this.draw = function () {
		background(255);
		mirror(); // Mirror canvas to match mirrored video
		// The preview is 500x470 but the cam feed is 627x470
		if (sample) vf.image(sample, -50, 0);
		if (faceapiLoaded) {
			// First just the graph
			if (detections[0] && par.debug) graphExpressions();
			if (!full && history1[0] && detections[0]) {
				// Play the recording from the previous step with expressions applied
				// Record into 
				playLiveShape2(history1);
			} else if (full && history2[0]) {
				// Play the recording	from this step (using the logic from the next step)
				playHistoryShape2(history1, analyzeExpressionHistory(expressionAggregate));
				// playShape3(history2);
			} else if (par.useSamplePose) {
				// Play a prerecorded pose
				playLiveShape2(samplePose);
			}
		} else {
			// Show a notice if we have to wait for the api
			checkFaceApi();
		}
		if (par.frameRate) fps();
	};
}

// Plays the history from step1 and applies expression data on top of it
// Gets loaded with `history1` which is an array of posenet poses
function playLiveShape2(history) {
	let cp = frameCount % history.length; // TODO: sync iterator
	drawLiveShape2(history[cp]);
}

function drawLiveShape2(points) {
	let shapeType = getShapeType();
	if (rec && detections[0]) recordExpression(points, shapeType);

	retargetAnchorsFromPose(points);

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

	hullSet = hull(expanded, par.roundness);

	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	hullSet.forEach(p => {
		if (par.showCurves) {
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

	retargetAnchorsFromPose(history);
	if (shapeType === 'softer') {
		expanded = softerBody(anchors, 1.1);
	} else {
		expanded = sharperBody(anchors, 1.1);
	}
	hullSet = hull(expanded, par.roundness);

	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	hullSet.forEach(p => {
		if (par.showCurves) {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
}

function sharperBody(pose, fExp, scaleMulti = 1) {
	// [{pos,part}...]
	// Needs an array of objects that have postion.x,position.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];

	// We'll use these later for the torso
	let l1, l2, r1, r2;

	pose.forEach((p, i) => {
		switch (p.part) {
			case 'nose':
				// function expandBlob(point, angles, minr, maxr, maxx,maxy, maxoff, texp) {
				newArr = newArr.concat(
					star(
						p.position.x,
						p.position.y,
							par.innerStar*scaleMulti,
							par.outerStar*scaleMulti,
						par.starPoints
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
							par.innerStar*scaleMulti,
							par.outerStar*scaleMulti,
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

function softerBody(pose, fExp, scaleMulti=1) {
	// [{pos,part}...]
	// Needs an array of objects that have position.x,position.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];

	// We'll use these later for the torso
	let l1, l2, r1, r2;

	pose.forEach((p, i) => {
		switch (p.part) {
			case 'nose':
				// function expandBlob(point, angles, minr, maxr, maxx,maxy, maxoff, texp) {
				newArr = newArr.concat(expandBlob(p, 1, 1, 200*scaleMulti, 2, 4, 0.05, i, fExp));
				break;
			case 'leftEar':
			case 'rightEar':
				newArr = newArr.concat(expandBlob(p, 5, 5, 50, 2, 4, 0.01, i, fExp));
				break;
			case 'leftEye':
			case 'rightEye':
				newArr.push([p.position.x, p.position.y]);
				break;
			// Arms
			case 'leftShoulder':
				l1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p, 5, 5, 150, 2, 4, 0.01, i, fExp));
				break;
			case 'rightShoulder':
				r1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p, 5, 5, 150, 2, 4, -0.01, i, fExp));
				break;
			// case 'leftElbow':
			// case 'rightElbow':
			// case 'leftWrist':
			// case 'rightWrist':
			case 'leftHip':
				l2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p, 10, 5, 50, 2, 4, 0.02, i, fExp));
				break;
			case 'rightHip':
				r2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandBlob(p, 10, 5, 50, 2, 4, -0.02, i, fExp));
				break;
			// case 'leftKnee':
			// case 'rightKnee':
			// case 'leftAnkle':
			// case 'rightAnkle':
			default:
				newArr = newArr.concat(expandBlob(p, 5, 5, 100, 2, 4, 0.01, i, fExp));
				break;
		}
	});

	// Torso
	let leftSide = p5.Vector.lerp(l1, l2, 0.5);
	let rightSide = p5.Vector.lerp(r1, r2, 0.5);
	let middle1 = p5.Vector.lerp(l1, r1, 0.5);
	let middle2 = p5.Vector.lerp(l2, r2, 0.5);

	newArr = newArr.concat(
		expandBlob(leftSide, 5, 1, 100, 2, 4, 0.001, -1, fExp)
	);
	newArr = newArr.concat(
		expandBlob(rightSide, 5, 1, 100, 2, 4, 0.001, -2, fExp)
	);
	newArr = newArr.concat(expandBlob(middle1, 5, 1, 100, 2, 4, 0.001, -3, fExp));
	newArr = newArr.concat(expandBlob(middle2, 5, 1, 100, 2, 4, 0.001, -4, fExp));

	return newArr;
}

function expandBlob(point, angles, minR, maxR, maxX, maxY, maxOff, i, fExp) {
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
	if (!fExp) fExp = par.emotionalScale;
	let effect = fExp;
	for (let a = 0; a < 360; a += angles) {
		let xoff = map(cos(a + phase), -1, 1, 0, maxX * effect) + i;
		let yoff = map(sin(a + phase), -1, 1, 0, maxY * effect) + i;
		let r = map(noise(xoff, yoff, zoff), 0, 1, minR * effect, maxR * effect);
		x = px + r * cos(a);
		y = py + r * sin(a);
		newArr.push([x, y]);
	}
	let pOff = map(noise(zoff), 0, 1, 0, maxOff * effect);
	phase += pOff * par.phaseMultiplier;
	zoff += par.zNoiseOffset;
	return newArr;
}

function graphExpressions() {
	let expressions;
	push();
	translate(width, 0);
	scale(-1, 1);
	if (detections) {
		if (detections.length > 0) {
			({ expressions } = detections[0]);
			let keys = Object.keys(expressions);
			keys.forEach((item, idx) => {
				textAlign(RIGHT);
				text(item, 110, idx * 20 + 22);
				const val = map(expressions[item], 0, 1, 0, 100);
				text(floor(val), 140, idx * 20 + 22);
				rect(160, idx * 20 + 10, val, 15);
			});
			let current = topExpression(detections[0].expressions);
			textAlign(CENTER);
			textSize(18);
			text(current, width / 2, height - 18);
			textAlign(LEFT);
		}
	}
	pop();
}

function topExpression(unsorted) {
	let sorted = [];
	sorted = Object.entries(unsorted);
	sorted.sort((a, b) => b[1] - a[1]);
	return sorted[0][0];
}

function recordExpression(hist, typ) {
	history2.push(hist);
	expressionAggregate.push(typ);
	setCounter(par.framesToRecord - history2.length);
	if (history2.length === par.framesToRecord) finishRecording();
}

// Runs on expressionAggregate which is an array of shape types (softer/sharper)
function analyzeExpressionHistory(exps) {
	let softer = 0;
	let sharper = 0;
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
	if (softer > sharper) {
		return 'softer';
	} else {
		return 'sharper';
	}
}

function checkFaceApi() {
	if (!faceapiLoaded) {
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

// // soft = expressions[0][1] + expressions[1][1] + expressions[6][1];
// // sharp =
// // 	expressions[2][1] +
// // 	expressions[3][1] +
// // 	expressions[4][1] +
// // 	expressions[5][1];

// expression = topExpression(expressions);
