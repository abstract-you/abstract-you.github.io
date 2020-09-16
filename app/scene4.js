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

		savedShape = getItem('savedShape');
		if (savedShape) console.log(savedShape);

		// check results of previous steps
		history2
			? (finalShapeType = analyzeExpressionHistory(history2))
			: (finalShapeType = 'bouba');
		history3
			? (finalScale = analyzeVoiceHistory(history3))
			: (finalScale = par.defaultScale);

		// -----page
		select('body').addClass('light');
		sketchCanvas.parent('#canvas-04');
		resizeCanvas(820, 820);
		background(colors.primary);

		gifc = createGraphics(400, 400);
		gifc.background(colors.primary);
		gifc.id('gif-canvas');
		gifc.hide();

		// -----ui
		recButton = select('#save-button');
		recButton.addClass('primary');
		recButton.removeClass('secondary');
		recButton.mousePressed(startGifRecording);
		restartButton = select('#restart-button');
		restartButton.mousePressed(redoAbstract);

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
			store('downloadedShape', true);
			store('history1', history1);
			store('history2', history2);
			store('history3', history3);
			capturer.save();
		}

		// -----admin
		if (par.showFrameRate || par.debug) {
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

function redoAbstract() {
	store('downloadedShape', false);
	refreshPage();
}

function showResumeAfterDownload() {
	console.log('download started');
	downloadStarted = true;
	let resumeButton = createButton('Resume Playback');
	resumeButton.position(955, 414);
	resumeButton.elt.addEventListener('click', refreshPage);
	resumeButton.mousePressed('refreshPage');
}

function startGifRecording() {
	rec = true;
	gifFrames++;
	recButton.removeClass('primary');
	recButton.addClass('secondary');
	// -----gif recorder
	capturer.start();
	capturer.capture(document.getElementById('gif-canvas'));
}

// Gets called by replayShape3 when recording a gif
// Renders gif to a smaller canvas
// No fancy mapping, just halves every value
function renderGifShape(shape, shapeType) {
	gifc.background(colors.primary);
	gifc.push();
	gifc.stroke(0);
	gifc.strokeWeight(par.shapeStrokeWeight / 2);
	gifc.noFill();
	gifc.beginShape();
	if (shapeType === 'bouba') {
		shape.forEach(p => {
			gifc.curveVertex(p[0] / 2, p[1] / 2);
		});
	} else if (shapeType === 'kiki') {
		shape.forEach(p => {
			gifc.vertex(p[0] / 2, p[1] / 2);
		});
	} else {
		console.error('bad shape type from renderShape2');
	}
	gifc.endShape();
	gifc.pop();
}
