function scene01() {
	this.enter = function () {
		dbg(scene01);
		// ----- clean-up from previous scenes
		noseAnchor = '';
		// resize video for a larger preview this time
		// TODO look into video positioning
		// sample.size(627, 470);
		sample.hide();
		// ----- reset state vars
		history1 = [];
		full = false;
		rec = false;
		preroll = false;
		play = false;
		// ----- page layout
		sketchCanvas.parent('#canvas-01');
		resizeCanvas(820, 820);
		// show preview in secondary canvas
		monitor.parent('#webcam-monitor-01');
		monitor.show();
		// ----- rewire ui
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
		// ----- scene management
		chooseScene('#scene-01');
	};

	this.draw = function () {
		// -----prepare the scene
		background(colors.primary);
		// show a dark background on the webcam monitor until the webcam feed starts
		monitor.background(0);
		// mirror the canvas to match the mirrored video from the camera
		mirror();
		// render video on the monitor canvas and center it
		// TODO: be smarter about adapting to different video sources
		if (sample) monitor.image(sample, -62, 0);
		// -----live poses
		if (poses) {
			if (poses[0]) {
				let pose = poses[0].pose.keypoints;
				let skeleton = poses[0].skeleton;
				// -----setup
				// show the posenet skeleton on the monitor canvas
				if (skeleton[0] && !preroll) previewSkeleton(skeleton);
				// updates proportions in global variables
				deriveProportions(pose);
				// -----
				// -----play live shape
				// play a live shape when there is no recording
				if (!full) makeShape1(pose);
				// -----
				// -----record shape
				// add frame to recording
				if (rec) recordShape1(anchors);
			}
		}
		// -----
		// -----replay recorded shape
		if (full && !preroll && history1[0]) replayShape1();
		// -----preroll
		// preroll plays a countdown on the monitor before recording starts
		// loop recording (if available)
		if (preroll) playPreroll();
		// -----debugging
		// shows framerate in the corner of the canvas for debugging purposes
		if (par.frameRate) fps();
	};
}

// -----shape pipeline
// Anchors target points and stabilize jerky movements and posenet quirks.
// Expanded shapes are drawn around anchors to form a body around the
// skeleton, points based on those shapes are added to the array. Convex hull
// is calculated from all points to determine outline path (Roundness is the
// concavity paramater, how tightly the hull wraps around the points.)
// TRY. Create additional expansion points around torso and between limb points
function makeShape1(points) {
	Anchor.chasePose(points);
	let expanded = [];
	expanded = expanded.concat(anchors.nose.ellipsify(3));
	expanded = expanded.concat(anchors.leftEar.ellipsify());
	expanded = expanded.concat(anchors.rightEar.ellipsify());
	expanded = expanded.concat(anchors.leftShoulder.ellipsify(2));
	expanded = expanded.concat(anchors.rightShoulder.ellipsify(2));
	expanded = expanded.concat(anchors.leftElbow.ellipsify());
	expanded = expanded.concat(anchors.rightElbow.ellipsify());
	expanded = expanded.concat(anchors.leftWrist.ellipsify());
	expanded = expanded.concat(anchors.rightWrist.ellipsify());
	expanded = expanded.concat(anchors.leftHip.ellipsify(2));
	expanded = expanded.concat(anchors.rightHip.ellipsify(2));
	expanded = expanded.concat(anchors.leftKnee.ellipsify());
	expanded = expanded.concat(anchors.rightKnee.ellipsify());
	expanded = expanded.concat(anchors.leftAnkle.ellipsify());
	expanded = expanded.concat(anchors.rightAnkle.ellipsify());
	let hullSet = hull(expanded, par.step1Roundness);
	// a hack, but it looks better than just doing endShape(CLOSE)
	hullSet.push(hullSet[1]);
	hullSet.push(hullSet[0]);
	// remap to canvas and apply padding
	let padded = remapFromPose(hullSet);
	// -----
	// -----final render call
	if (!par.hideShape) renderShape1(padded);
	// -----reference shapes
	if (par.showExpanded || par.debug)
		drawRef(remapFromPose(expanded), 'paleturquoise', 5);
	if (par.showHullset || par.debug) drawRef(remapFromPose(hullSet), 'cyan', 5);
	// (anchors draw their own reference after retaregtting)
}

// replays a shape from history
// use frameCounter as an iterator for looping through the recorded array
function replayShape1() {
	let i = frameCount % history1.length;
	renderShape1(history1[i]);
}

// draw final shape outline
function renderShape1(shape) {
	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	shape.forEach(p => {
		curveVertex(p[0], p[1]);
	});
	endShape();
	pop();
}

// stores anchors in history1, they will get reused in later steps
// updates counter with remaining frames
// stops recording when recordFrames is reached
function recordShape1(data) {
	history1.push(data);
	updateCounter(par.recordFrames - history1.length);
	if (history1.length === par.recordFrames) finishiRecording();
}

// Shows a posenet skeleton on the webcam monitor
// TRY. either figure out how to make posenet show the skeleton with lower confidence,
// or build it manually based on the points that are alawys available. Plus some basic
// paramaters like minimum/maximum bone length (relative to some general proportion?)
function previewSkeleton(skeleton) {
	// For every skeleton, loop through all body connections
	for (let i = 0; i < skeleton.length; i++) {
		let partA = skeleton[i][0];
		let partB = skeleton[i][1];
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

// shows a 3...2..1... animation on the second canvas
// crude animation timing based on modulo of the frameCounter, but seems to work well enough
function playPreroll() {
	let counter = floor(map(prerollCounter, 0, par.preRecCounterFrames, 3.9, 0));
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
