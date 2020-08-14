function scene04() {
	// --enter
	this.enter = function () {
		frameRate(par.frameRate);
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		isFaceapiStandby = true;
		full = false;
		rec = false;
		preroll = false;
		play = false;
		phase = 0.0;
		select('body').addClass('light');

		finalShapeType = analyzeExpressionHistory(history2);
		chooseScene('#scene-04');
		resizeCanvas(820, 820);
		canvas.parent('#canvas-04');
		recButton = select('#save-button');
		recButton.hide();
		restartButton = select('#restart-button');
		restartButton.mousePressed(refreshPage);
	};

	// --4draw
	this.draw = function () {
		background('#f9f9f9');
		mirror();
		playHistoryShape3(history3);
		playHistoryShape3(history3, finalShapeType);
		if (par.frameRate) fps();
	};
}

function saveAbstractYou() {
	save(canvas, 'abstract.png');
}

function refreshPage() {
	location.replace('/');
}
