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
		kample.size(668, 500);
		sample.hide();
		isFaceapiStandby = true;

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

		// -----scene setup, start the mic and hide the webcam monitor
		// get the shape type
		startMic();
		monitor.hide();
		if (history2) {
			finalShapeType = analyzeExpressionHistory(history2);
		} else {
			finalShapeType = 'softer';
		}
		// -----page layout
		sketchCanvas.parent('#canvas-02');
		resizeCanvas(820, 820);

		// ----- rewire ui
		// rehook and reset and show record button
		recButton = select('#record-button-03');
		recButton.html('Record');
		recButton.removeClass('rec');
		recButton.mousePressed(() => startRecording());
		recButton.show();
		// reset and show counter
		counterButton = select('#counter-03');
		// update recording time based on recording frames. assumes a recording time
		// of less than 60 seconds...
		counterButton.html('00:' + par.recordFrames / 60);
		counterButton.show();
		// rehook button for this scene, and hide for now
		redoButton = select('#redo-03');
		redoButton.mousePressed(() => mgr.showScene(scene03));
		redoButton.hide();
		// rehook next button for this scene, and hide for now
		nextButton = select('#next-button-03');
		nextButton.mousePressed(() => mgr.showScene(scene04));
		nextButton.hide();
		// ----- scene management
		chooseScene('#scene-03');
	};

	this.draw = function () {
		// -----prepare the frame
		background(colors.primary);
		background('#f9f9f9');
		// mirror the canvas to match the mirrored video from the camera
		translate(width, 0);
		scale(-1, 1);
		// get a reading from the mic
		micLevel = mic.getLevel();
		if (micLevel) {
			if (par.debug) graphVoice(micLevel);
			// -----play live shape
			if (!full) {
				playLiveShape3(history1, finalShapeType, micLevel);
			}
		}
		if (full) playHistoryShape3(history3, finalShapeType);
			// -----admin
			if (par.frameRate || par.debug) {
				push();
				mirror();
				fps();
				pop();
			}
	};
}

function voiceNet(points, level) {
	let newArr = [];
	let phase = 0.0;
	points.forEach((p, i) => {
		let x, y;
		let offset = 0;
		if (level) {
			if (level[0]) {
				offset = map(level[0], 0, 255, par.levelHigh, par.levelLow);
			}
		}
		x = p[0] + phase + offset * sin(i);
		y = p[1] + phase + offset * cos(i);
		newArr.push([x, y]);
	});
	phase += par.phaseMaxOffset;
	return newArr;
}

function recordVoice(history) {
	history3.push(history);
	updateCounter(par.recordFrames - history3.length);
	if (history3.length === par.recordFrames) finishRecording();
}

function playLiveShape3(history, type, level) {
	// console.log('playLiveShape3',history,type,level)
	if (!history[0]) {
		history = samplePose;
	}
	let cp = frameCount % history.length;
	drawLiveShape3(history[cp], type, level);
}

function drawLiveShape3(history, type, level) {
	// console.log('drawLiveShape3', history, type, level);
	let scale = map(level, 0, 1, par.minSoundLevel, par.maxSoundLevel);
	Anchor.chasePose(history);
	if (type === 'softer') {
		expanded = softerBody(anchors);
		hullSet = hull(expanded, par.roundnessSofter);
	} else {
		expanded = sharperBody(anchors);
		hullSet = hull(expanded, par.roundnessSharper);
	}

	let padded = [];

	hullSet.forEach(p => {
		padded.push([
			remap(p[0], par.sampleWidth, width, scale),
			remap(p[1], par.sampleHeight, height, scale),
		]);
	});

	if (rec) recordVoice(padded);

	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	padded.forEach(p => {
		if (type === 'softer') {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
}

function playHistoryShape3(history, type) {
	let cp = frameCount % history.length;
	drawHistoryShape3(history[cp], type);
}

function drawHistoryShape3(history, type) {
	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	history.forEach(p => {
		if (type === 'softer') {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
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
