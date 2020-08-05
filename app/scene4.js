function scene04() {
	// --enter
	this.enter = function () {
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = true;
		select('body').addClass('light');

		resetRecVariables();
		chooseScene('#scene-04');
		resizeCanvas(820, 820);
		canvas.parent('#canvas-04');
		button = select('#save-button');
		button.removeClass('primary');
		button.html('Download the abstract you');
		button.mousePressed(() => {
			saveAbstractYou();
		});
	};

	// --4draw
	this.draw = function () {
		background('#f9f9f9');
		mirror();
		playHistoryShape3(voiceHistory);
		if (par.frameRate) fps();
	};
}

function saveAbstractYou() {}
