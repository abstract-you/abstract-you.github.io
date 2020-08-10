function scene04() {
	// --enter
	this.enter = function () {
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = true;
		resetRecVariables();
		select('body').addClass('light');

		chooseScene('#scene-04');
		resizeCanvas(820, 820);
		canvas.parent('#canvas-04');
		button = select('#save-button');
		button.hide();
		restartButton = select('#restart-button');
		restartButton.mousePressed(refreshPage);
	};

	// --4draw
	this.draw = function () {
		background('#f9f9f9');
		mirror();
		playHistoryShape3(voiceHistory);
		if (par.frameRate) fps();
	};
}

function saveAbstractYou() {
	save(canvas, 'abstract.png');
}

function refreshPage() {
	location.replace('/');
}
