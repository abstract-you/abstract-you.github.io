function scene03() {
	// --enter
	this.enter = function () {
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = true;
		startMic();
		vf.hide();

		resetRecVariables();
		chooseScene('#scene-03');
		resizeCanvas(820, 820);
		canvas.parent('#canvas-03');
		button = select('#record-button-03');
		button.removeClass('primary');
		button.html('Record');
		button.mousePressed(() => {
			noPreroll();
		});
		if (sample) sample.hide();
	};

	// --3draw

	this.draw = function () {
		micLevel = mic.getLevel()
		let shapeStyle = analyzeExpressionHistory(expressionAggregate)

		background('#f9f9f9');

		if (par.debug) graphVoice(micLevel);
		mirror(); // Mirror canvas to match mirrored video

		if (!full) {
			playLiveShape3(history2, shapeStyle, micLevel);
		}
		if (full) playHistoryShape3(voiceHistory);
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
	voiceHistory.push(history);
	setCounter(par.framesToRecord - voiceHistory.length);
	if (voiceHistory.length === par.framesToRecord) finishRecording();
}

function playLiveShape3(history, type, level) {
	if (!history[0]) {
		history = samplePose;
	}
	let cp = frameCount % history.length;
	drawLiveShape3(history[cp], type, level);
}

function drawLiveShape3(history, type, level) {
	let scale = map(level, 0, 1, par.minSoundLevel, par.maxSoundLevel);
	retargetAnchorsFromPose(history);
	if (type === 'softer') {
		expanded = softerBody(anchors);
	} else {
		expanded = sharperBody(anchors);
	}
	hullSet = hull(expanded, par.roundness3);

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
		if (par.showCurves) {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
}

function playHistoryShape3(history) {
	let cp = frameCount % history.length;
	drawHistoryShape3(history[cp]);
}

function drawHistoryShape3(history) {
	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	history.forEach(p => {
		if (par.showCurves) {
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
