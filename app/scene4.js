function scene04() {
	this.enter = function () {
		dbg('scene04');
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
		// -----load a prerecordeded dataset if there's nothing from step 1
		// dancer.js should be a posenet recording of a person dancing. It
		// also stores skeleton data so we're extracting just the poses first
		if (history1.length === 0) {
			if (recordedPose) {
				recordedPose.forEach(p => {
					if (p) history1.push(p.pose.keypoints);
				});
			}
		}

		// check results of previous steps
		history2
			? (finalShapeType = analyzeExpressionHistory(history2))
			: (finalShapeType = 'softer');
		history3
			? (finalScale = analyzeVoiceHistory(history3))
			: (finalScale = 0.2);

		// -----page
		select('body').addClass('light');
		sketchCanvas.parent('#canvas-04');
		resizeCanvas(820, 820);
		background(colors.primary);

		gifc = createGraphics(400, 400);
		gifc.id('gif-canvas');
		gifc.hide();

		// -----ui
		recButton = select('#save-button');
		recButton.mousePressed(startGifRecording);
		restartButton = select('#restart-button');
		restartButton.mousePressed(refreshPage);

		// -----scene management
		chooseScene('#scene-04');
	};

	// --4draw
	this.draw = function () {
		// -----prepare the frame
		stopWebcam(sample);
		background(colors.primary);
		// mirror the canvas to match the mirrored video from the camera
		translate(width, 0);
		scale(-1, 1);

		// -----replay final shape

		if (rec) {
			push();
			mirror(); // Unmirror so we can write in the right direction
			textAlign(CENTER, CENTER);
			textSize(24);
			text('CREATING GIF', width / 2, height / 2);
			pop();
			replayShape3(history1, finalShapeType, finalScale, true);
			capturer.capture(document.getElementById('gif-canvas'));
			gifFrames++;
		} else {
			replayShape3(history1, finalShapeType, finalScale);
		}

		if (gifFrames >= par.gifFrames) {
			capturer.stop();
			capturer.save();
			//TODO: stop CCapture and resume animation
			mgr.showScene(mgr.scene.fnScene);
		}

		// -----admin
		if (par.frameRate || par.debug) {
			push();
			mirror();
			fps();
			pop();
		}
	};
}

function refreshPage() {
	location.replace('/');
}

function startGifRecording() {
	rec = true;
	gifFrames++;
	// -----gif recorder
	capturer.start();
	capturer.capture(document.getElementById('gif-canvas'));
}

// Gets called by replayShape3 when recording a gif
// Renders gif to a smaller canvas
// No fancy mapping, just halve every value
function renderGifShape(shape, shapeType) {
	gifc.background(colors.primary);
	gifc.push();
	gifc.stroke(0);
	gifc.strokeWeight(par.shapeStrokeWeight / 2);
	gifc.noFill();
	gifc.beginShape();
	if (shapeType === 'softer') {
		shape.forEach(p => {
			gifc.curveVertex(p[0] / 2, p[1] / 2);
		});
	} else if (shapeType === 'sharper') {
		shape.forEach(p => {
			gifc.vertex(p[0] / 2, p[1] / 2);
		});
	} else {
		console.error('bad shape type from renderShape2');
	}
	gifc.endShape();
	gifc.pop();
}
