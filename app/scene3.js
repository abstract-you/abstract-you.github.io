function scene03() {
	this.enter = function () {
		dbg('scene03');
		frameRate(par.frameRate);
		// ----- clean-up from previous scenes
		noseAnchor = '';
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
			isPosenetReady = false;
		}
		isFaceapiStandby = true;
		sample.size(par.webcamWidth, par.webcamHeight);
		sample.hide();
		stopWebcam(sample);
		select('body').removeClass('light');
		// -----load a prerecordeded dataset if there's nothing from step 1
		// dancer.js should be a posenet recording of a person dancing. It
		// also stores skeleton data so we're extracting just the poses first
		if (history1.length === 0) {
			recordedPose.forEach(p => {
				if (p) history1.push(p.pose.keypoints);
			});
		}

		// ----- reset state vars
		history3 = [];
		full = false;
		rec = false;
		preroll = false;
		play = false;

		// -----scene setup
		// start the mic in a browser-friendly way
		startMic();
		// hide the webcam monitor
		monitor.hide();
		// check results of previous step
		if (history2) {
			finalShapeType = analyzeExpressionHistory(history2);
		} else {
			finalShapeType = 'bouba';
		}

		// -----page
		sketchCanvas.parent('#canvas-03');
		resizeCanvas(820, 820);
		rewireUI();

		// ----- scene management
		chooseScene('#scene-03');
	};

	// -----draw
	this.draw = function () {
		// -----prepare the frame
		stopWebcam(sample);
		background(colors.primary);
		// mirror the canvas to match the mirrored video from the camera
		translate(width, 0);
		scale(-1, 1);

		// -----mic
		let micLevel = 0;
		if (mic.getLevel()) {
			micLevel = mic.getLevel();
			// mic reference
			if (par.debug && !full) graphVoice(micLevel);

			// record mic level
			if (rec && !full) recordVoice(micLevel);
		}

		// play live shape
		if (!full) replayShape3(history1, finalShapeType, micLevel);

		// play recorded shape
		if (full)
			replayShape3(history1, finalShapeType, analyzeVoiceHistory(history3));

		// -----admin
		if (par.frameRate || par.debug) {
			push();
			mirror();
			fps();
			pop();
		}
	};
}

// -----shape pipeline: step 3, scale shape according to mic level
// (1) Anchors target history points to redraw the basic shape from step 1 (2) A
// shape type is determined from expression data (3) Expanded shapes are drawn
// around anchors based on the shape type (4) Convex hull is calculated from all
// points to determine outline path. Roundness is set based on shape type (5)
// Mic level is applied to padding to scale the shape
function makeShape3(pose, shapeType, micLevel, gif = false) {
	Anchor.chasePose(pose);
	// expand and get hull based on live shape type
	let expanded = [];
	let hullSet = [];
	if (shapeType === 'bouba') {
		expanded = boubaFromAnchors();
		hullSet = hull(expanded, par.roundnessBouba);
	} else if (shapeType === 'kiki') {
		expanded = kikiFromAnchors();
		// console.log(expanded)
		hullSet = hull(expanded, par.roundnessKiki);
	} else {
		console.error('bad shape type from drawLiveShape3');
	}

	hullSet.push(hullSet[1]);
	hullSet.push(hullSet[0]);

	// remap to canvas and apply padding
	// this also applies the micLevel to scale the shape
	let scale = map(micLevel, 0, 1, par.voiceMinPadding, par.voiceMaxPadding);
	let padded = remapFromPose(hullSet, scale);

	if (gif) {
		renderGifShape(padded, shapeType);
	} else {
		if (!par.hideShape) renderShape2(padded, shapeType);
	}
	// -----reference shapes
	if (par.showExpanded || par.debug)
		drawRef(remapFromPose(expanded), 'paleturquoise', 5);
	if (par.showHullset || par.debug) drawRef(remapFromPose(hullSet), 'cyan', 5);
}

function replayShape3(history, shapeType, micLevel, gif) {
	let cp = frameCount % history.length;
	makeShape3(history[cp], shapeType, micLevel, gif);
}

function recordVoice(history) {
	history3.push(history);
	updateCounter(par.recordFrames - history3.length);
	if (history3.length >= par.recordFrames) finishRecording();
}

function graphVoice(rms) {
	push();
	fill(127);
	stroke(127);
	textAlign(CENTER, CENTER);

	// Draw an ellipse with size based on volume
	// ellipse(width / 2, height / 2, 10 + rms * 200, 10 + rms * 200);
	ellipse(width / 2, height - 100, 10 + rms * 200);
	text(floor(rms * 200), width / 2, height - 150);
	pop();
}

function analyzeVoiceHistory(levels) {
	let sum = levels.reduce((a, b) => a + b, 0);
	let average = sum / levels.length;
	return average;
}
