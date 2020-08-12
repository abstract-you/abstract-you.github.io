function scene01() {
	this.enter = function () {
		// clean-up from previous scenes
		noseAnchor = '';
		// resize video for a larger preview this time
		// TODO look into video positioning
		// sample.size(627, 470);
		sample.hide();
		// reset state vars
		history1 = [];
		full = false;
		rec = false;
		preroll = false;
		play = false;
		// page layout
		sketchCanvas.parent('#canvas-01');
		resizeCanvas(820, 820);
		// show preview in secondary canvas
		monitor.parent('#webcam-monitor-01');
		monitor.show();
		// rewire ui
		// rehook and reset and show record button
		recButton = select('#record-button-01');
		recButton.html('Record');
		recButton.removeClass('rec');
		recButton.mousePressed(() => startPreroll());
		recButton.show();
		// reset and show counter
		counterButton = select('#counter-01');
		counterButton.show();
		// rehook button for this scene, and hide for now
		redoButton = select('#redo-01');
		redoButton.mousePressed(() => mgr.showScene(scene01));
		redoButton.hide();
		// rehook button for this scene, and hide for now
		nextButton = select('#next-button-01');
		nextButton.mousePressed(() => mgr.showScene(scene02));
		nextButton.hide();
		// scene management
		chooseScene('#scene-01');
	};

	this.draw = function () {
		background(colors.primary);
		// show a dark background on the webcam monitor until the webcam feed starts
		monitor.background(0);
		// mirror the canvas to match the mirrored video from the camera
		mirror();
		// render video on the monitor canvas and center it
		// TODO: be smarter about adapting to different video sources
		if (sample) monitor.image(sample, -62, 0);
		// Check for live poses
		if (poses) {
			if (poses[0]) {
				let pose = poses[0].pose.keypoints;
				let skeleton = poses[0].skeleton;
				// stores body proportions in a few global variables
				deriveProportions(pose);
				if (par.showExpanded) drawRef(expanded, 'paletorquise', 5);
				if (rec) recordPose(pose);
				// play a live shape when there is no recording
				if (!full) drawShape(pose);
				// show the posenet skeleton on the monitor canvas
				if (skeleton[0] && !preroll) previewSkeleton(skeleton);
			}
		}
		// preroll plays a countdown on the monitor before recording starts
		if (preroll) playPreroll();
		// loop recording (if available)
		if (full && !preroll && history1[0]) playShape(history1);
		// shows framerate in the corner of the canvas for debugging purposes
		if (par.frameRate) fps();
	};
}

function playShape(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawShape(history[cp]);
}

function drawShape(points) {
	retargetAnchorsFromPose(points);
	expanded = bodyNet(anchors);
	hullSet = hull(expanded, par.roundness1);

	// Looks better than endShape(CLOSE)
	hullSet.push(hullSet[1]);
	hullSet.push(hullSet[0]);

	let padded = [];

	hullSet.forEach(p => {
		padded.push([
			remap(p[0], par.sampleWidth, width, par.padding),
			remap(p[1], par.sampleHeight, height, par.padding),
		]);
	});

	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	padded.forEach(p => {
		curveVertex(p[0], p[1]);
	});

	endShape();
	pop();
}

function bodyNet(pose) {
	let newArr = [];
	let l1, l2, r1, r2;

	pose.forEach((p, i) => {
		switch (p.part) {
			case 'nose':
				newArr = newArr.concat(expandEllipse(p, 80, 95, 20));
				break;
			case 'leftEar':
			case 'rightEar':
				newArr = newArr.concat(expandEllipse(p, 20, 35));
				break;
			case 'leftEye':
			case 'rightEye':
				break;
			case 'leftShoulder':
				l1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p, 20, 35));
				break;
			case 'rightShoulder':
				r1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p));
				break;
			case 'leftElbow':
			case 'rightElbow':
				newArr = newArr.concat(expandEllipse(p, 70, 96));
				break;
			case 'leftWrist':
			case 'rightWrist':
			case 'leftHip':
				l2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p));
				break;
			case 'rightHip':
				r2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p, 70, 96, 20));
				break;
			case 'leftKnee':
			case 'rightKnee':
				newArr = newArr.concat(expandEllipse(p, 70, 96, 20));
				break;
			case 'leftAnkle':
			case 'rightAnkle':
			default:
				newArr = newArr.concat(expandEllipse(p));
				break;
		}
	});

	// fill in the torso area so the convex hull algorithm has more to work with
	let leftSide = p5.Vector.lerp(l1, l2, 0.5);
	let rightSide = p5.Vector.lerp(r1, r2, 0.5);
	let middle1 = p5.Vector.lerp(l1, r1, 0.5);
	let middle2 = p5.Vector.lerp(l2, r2, 0.5);

	newArr = newArr.concat(expandEllipseXY(leftSide.x, leftSide.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(rightSide.x, rightSide.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(middle1.x, middle1.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(middle2.x, middle2.y, 50, 50, 54));

	return newArr;
}

function expandEllipseXY(px, py, minr, maxr, angles) {
	if (!angles) angles = 30;
	let newX, newY;
	let newArr = [];
	for (let a = 0; a < 360; a += angles) {
		let r = random(minr, maxr);
		newX = px + r * cos(a);
		newY = py + r * sin(a);
		newArr.push([newX, newY]);
	}
	// cl(newArr)
	return newArr;
}

function expandEllipse(point, minr = 50, maxr = 50, inc = 60) {
	// console.log('expandEllipse ', point, minr, maxr, inc);
	let x, y;
	let px, py;
	let newArr = [];
	if (point.position) {
		px = point.position.x;
		py = point.position.y;
	} else if (point[0]) {
		px = point[0];
		py = point[1];
	}
	for (let a = 0; a < 360; a += inc) {
		let offset = (frameCount % 10) / 1000;
		let r = map(noise(offset), 0, 1, minr, maxr);
		x = px + r * cos(a);
		y = py + r * sin(a);
		newArr.push([x, y]);
	}
	// cl(newArr)
	return newArr;
}

function previewSkeleton(pose) {
	let skeleton;
	if (pose) {
		if (pose.skeleton[0]) {
			skeleton = pose.skeleton;

			// For every skeleton, loop through all body connections
			for (let j = 0; j < skeleton.length; j++) {
				let partA = skeleton[j][0];
				let partB = skeleton[j][1];
				monitor.push();
				monitor.translate(-50, 0);
				monitor.stroke('#AFEEEE');
				monitor.line(
					partA.position.x,
					partA.position.y,
					partB.position.x,
					partB.position.y
				);
				monitor.ellipse(partA.position.x, partA.position.y, 5);
				monitor.ellipse(partB.position.x, partB.position.y, 5);
				monitor.pop();
			}
		}
	}
}

// Shows a 3...2..1... animation on the second canvas
function playPreroll() {
		let counter = floor(map(prerollCounter, 0, par.mississippi, 4, 0));
		if (counter > 0) {
			monitor.push();
			monitor.translate(monitor.width, 0);
			monitor.scale(-1, 1);
			monitor.noStroke();
			monitor.fill(0, 200);
			monitor.rect(0, 0, monitor.width, monitor.height);
			monitor.fill(255);
			monitor.textSize(180);
			monitor.textAlign(CENTER, CENTER);
			monitor.text(counter, monitor.width / 2, monitor.height / 2);
			monitor.pop();
			prerollCounter++;
		} else {
			startRecording();
		}
}

function recordPose(points) {
	history1.push(points);
	setCounter(par.framesToRecord - history1.length);
	if (history1.length === par.framesToRecord) finishRecording();
}
