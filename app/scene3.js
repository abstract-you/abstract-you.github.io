function scene03() {
	// --enter
	this.enter = function () {
		console.log('entering scene 03')
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = true;
		startMic();
		vf.hide();

		finalShapeType = analyzeExpressionHistory(history2);

	full = false;
	rec = false;
	preroll = false;
	play = false;
	phase = 0.0;
		history3 = [];

		chooseScene('#scene-03');
		canvas.parent('#canvas-03');
		resizeCanvas(820, 820);

		recButton = select('#record-button-03');
		recButton.html('Record');
		recButton.removeClass('primary');
		recButton.removeClass('rec');
		recButton.removeClass('preroll');
		recButton.mousePressed(() => {
			noPreroll();
		});
		recButton.show();
		counterButton = select('#counter-03');
		counterButton.show();
		redoButton = select('#redo-03');
		redoButton.mousePressed(() => {
			mgr.showScene(scene03);
		});
		redoButton.hide();
		nextButton = select('#next-button-03');
		nextButton.mousePressed(() => {
			mgr.showScene(scene04);
		});
		nextButton.hide();
	};

	// --3draw

	this.draw = function () {
		micLevel = mic.getLevel();

		background('#f9f9f9');

		if (par.debug) graphVoice(micLevel);
		mirror(); // Mirror canvas to match mirrored video

		if (!full) {
			playLiveShape3(history1, finalShapeType, micLevel);
		}
		if (full) playHistoryShape3(history3, finalShapeType);
		if (par.frameRate) fps();
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
