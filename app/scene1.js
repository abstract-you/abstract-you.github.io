function scene01() {
	this.enter = function () {
		dbg('scene01');
		frameRate(par.frameRate);
		// ----- clean-up
		noseAnchor = '';
		sample.size(par.webcamWidth, par.webcamHeight);
		sample.hide();
		isFaceapiStandby = true;
		select('body').removeClass('light');
		// ----- reset state vars
		history1 = [];
		full = false;
		rec = false;
		preroll = false;
		// ----- page layout
		sketchCanvas.parent('#canvas-01');
		resizeCanvas(820, 820);
		// show preview in secondary canvas
		monitor.parent('#webcam-monitor-01');
		monitor.resizeCanvas(500, 470);
		monitor.show();
		// ----- rewire ui
		rewireUI();
		recButton.mousePressed(() => startPreroll());
		// ----- scene management
		chooseScene('#scene-01');
	};

	this.draw = function () {
		// -----prepare the scene
		background(colors.primary);
		// show a dark background on the webcam monitor until the webcam feed starts
		monitor.background(0);
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
		// -----live poses
		push();
		mirror();
		if (poses) {
			if (poses[0]) {
				let pose = poses[0].pose.keypoints;
				let skeleton = poses[0].skeleton;
				// Anchor.chasePose(pose);

				// -----setup
				// show the posenet skeleton on the monitor canvas
				if (skeleton[0] && !preroll) previewSkeleton();
				// updates proportions in global variables
				// deriveProportions(pose);
				// -----
				// -----record shape
				// add frame to recording
				if (rec) recordShape1(pose);

				// -----
				// -----play live shape
				// play a live shape when there is no recording
				if (par.s01UseStar) {
					makeShape2(pose, 'kiki');
				} else if (par.s01UseBlob) {
					makeShape2(pose, 'bouba');
				} else if (!full) {
					makeShape1(pose);
				}
			}
		}
		// -----
		// -----replay recorded shape
		if (full && !preroll && !rec) replayShape1();
		// -----preroll
		// preroll plays a countdown on the monitor before recording starts
		// loop recording (if available)
		if (preroll) playPreroll();
		pop();

		// -----admin
		// shows framerate in the corner of the canvas for debugging purposes
		if (par.frameRate || par.debug) fps();
	};
}

// -----shape pipeline: draw basic shape based on pose data
// (1) Anchors target points and stabilize jerky movements and posenet quirks.
// (2) Expanded shapes are drawn around anchors to form a body around the
// skeleton, points based on those shapes are added to the array. (3) Convex
// hull is calculated from all points to determine outline path (Roundness is
// the concavity paramater, how tightly the hull wraps around the points.) (4)
// Padding is addded to keep the shape centered
function makeShape1(pose) {
	Anchor.chasePose(pose);
	let expanded = kikiFromAnchors();
	let hullSet = hull(expanded, par.roundnessNeutral);
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

// draw final shape outline
function renderShape1(shape) {
	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	shape.forEach(p => {
		vertex(p[0], p[1]);
	});
	endShape();
	pop();
}

// replays a shape from history
// use frameCounter as an iterator for looping through the recorded array
function replayShape1() {
	// console.log('replayShape1:', history1)
	let i = frameCount % history1.length;
	// let pose = Object.entries(history1[i]);
	makeShape1(history1[i]);
}

// stores pose in history1, this will be the base for the shape in later steps
// updates counter with remaining frames
// stops recording when recordFrames is reached
function recordShape1(data) {
	history1.push(data);
	updateCounter(par.recordFrames - history1.length);
	if (history1.length > par.recordFrames) {
		dbg('recorded ' + par.recordFrames + ' frames');
		finishRecording();
	}
}

// Shows a posenet skeleton on the webcam monitor
// TRY. either figure out how to make posenet show the skeleton with lower confidence,
// or build it manually based on the points that are alawys available. Plus some basic
// paramaters like minimum/maximum bone length (relative to some general proportion?)
function previewSkeleton() {
	let skeleton = poses[0].skeleton;
	// For every skeleton, loop through all body connections
	for (let i = 0; i < skeleton.length; i++) {
		let partA = skeleton[i][0];
		let partB = skeleton[i][1];
		monitor.push();
		mirror(monitor);
		// realign with mirrored video
		monitor.translate(monitor.width / 2, 0);
		monitor.stroke('#AFEEEE');
		monitor.noFill();
		monitor.line(
			partA.position.x,
			partA.position.y,
			partB.position.x,
			partB.position.y
		);
		monitor.stroke(255);
		monitor.fill(255);
		monitor.ellipse(partA.position.x, partA.position.y, 5);
		monitor.ellipse(partB.position.x, partB.position.y, 5);
		monitor.pop();
	}
}

function startPreroll() {
	preroll = true;
	full = false;
	recButton.addClass('rec');
	recButton.html('Stop');
	recButton.mousePressed(cancelRecording);
}

function noPreroll() {
	startRecording();
}

// shows a 3...2..1... animation on the second canvas
// crude animation timing based on modulo of the frameCounter, but seems to work well enough
function playPreroll() {
	console.log('playPreroll');
	let counter = floor(map(prerollCounter, 0, par.preRecCounterFrames, 3.9, 0));
	if (counter > 0) {
		monitor.push();
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
		dbg('preroll calling startRecording()');
		startRecording();
	}
}

function neutralFromAnchors() {
	let newArr = [];
	newArr = newArr.concat(anchors.nose.neutralExpand(3));
	newArr = newArr.concat(anchors.leftEar.neutralExpand());
	newArr = newArr.concat(anchors.rightEar.neutralExpand());
	newArr = newArr.concat(anchors.rightEar.neutralExpand());
	newArr = newArr.concat(anchors.rightEar.neutralExpand());
	newArr = newArr.concat(anchors.leftShoulder.neutralExpand(2));
	newArr = newArr.concat(anchors.rightShoulder.neutralExpand(2));
	newArr = newArr.concat(anchors.leftElbow.neutralExpand(2));
	newArr = newArr.concat(anchors.rightElbow.neutralExpand(2));
	newArr = newArr.concat(anchors.leftWrist.neutralExpand(2));
	newArr = newArr.concat(anchors.rightWrist.neutralExpand(2));
	newArr = newArr.concat(anchors.leftHip.neutralExpand(2));
	newArr = newArr.concat(anchors.rightHip.neutralExpand(2));
	newArr = newArr.concat(anchors.leftKnee.neutralExpand(2));
	newArr = newArr.concat(anchors.rightKnee.neutralExpand());
	newArr = newArr.concat(anchors.leftAnkle.neutralExpand());
	newArr = newArr.concat(anchors.rightAnkle.neutralExpand());
	return newArr;
}
