function scene03() {
	// --enter
	this.enter = function () {
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = true;
		startMic();
		ampl = new p5.Amplitude();
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
		ampl.setInput(mic);

		background(255);

		if (par.debug) graphVoice(ampl.getLevel());
		mirror(); // Mirror canvas to match mirrored video

		if (!full) {
			playLiveShape3(

				ampl.getLevel()
			);
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
				offset = map(level[0], 0, 255, -50, 50);
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
	let scale = map(level,0,1,.5,3.5)
	retargetAnchorsFromPose(history);
	if (type === 'softer') {
		expanded = softerBody(anchors, 1,scale*par.voiceScaleModifier);
	} else {
		expanded = sharperBody(anchors, 1,scale*par.voiceScaleModifier);
	}
	hullSet = hull(expanded, par.roundness);
	if (rec) recordVoice(hullSet);

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
	push()
	fill(127);
	stroke(127);
	textAlign(CENTER, CENTER)

	// Draw an ellipse with size based on volume
	// ellipse(width / 2, height / 2, 10 + rms * 200, 10 + rms * 200);
	ellipse(width / 2, height - 100, 10 + rms * 200);
	text(floor(rms*200),width/2,height - 150)
	pop()
}
