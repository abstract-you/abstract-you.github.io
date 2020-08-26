class Paramaterize {
	constructor() {
		this.scene = '0';
		this.debug = true;
		// this.demoMode = true;

		// 500x470
		// this.dx = 320;
		// this.dy = 0;
		// this.dwidth = 500;
		// this.dheight = 470;
		// this.sx = 80;
		// this.sy = 0;
		// this.swidth = 480;
		// this.sheight = 480;

		this.dx = 320;
		this.dy = 0;
		this.dwidth = 500;
		this.dheight = 500;
		this.sx = 80;
		this.sy = 0;
		this.swidth = 480;
		this.sheight = 480;
		this.webcamWidth = 627;
		this.webcamHeight = 470;

		// dx Number: the x-coordinate of the destination rectangle in which to draw the source image
		// dy Number: the y-coordinate of the destination rectangle in which to draw the source image
		// dWidth Number: the width of the destination rectangle
		// dHeight Number: the height of the destination rectangle
		// sx Number: the x-coordinate of the subsection of the source image to draw into the destination rectangle
		// sy Number: the y-coordinate of the subsection of the source image to draw into the destination rectangle
		// sWidth Number: the width of the subsection of the source image to draw into the destination rectangle (Optional)
		// sHeight Number: the height of the subsection of the source image to draw into the destination rectangle (Optional)

		// ----- general
		this.frameRate = 60;
		this.recordFrames = 900; // 900 frames is about 15 seconds
		this.preRecCounterFrames = 240; // 240 frames is about 4 seconds
		this.showFrameRate = true;
		this.videoSync = 0;
		this.shapeStrokeWeight = 3.5;
		this.padding = 200;
		this.gifFrames = 100;
		this.noseYOffset = 155;
		this.topSpeed = 20;
		this.maxAcc = 10;

		// -----reference shapes
		this.hideShape = false;
		this.referenceAnchorRadius = 10;
		this.showExpanded = false;
		this.showAnchors = false;
		this.showPose = false;
		this.showHull = false;
		this.fillShape = false;
		this.showCurves = true;
		this.showFrameRate = false;

		// -----01 ellipse
		this.s01UseBlob = false;
		this.s01UseStar = false;
		this.ellipseOffsetIncrement = 0.01;
		this.ellipseMinRadius = 50;
		this.ellipseMaxRadius = 50;
		this.ellipseIncrement = 40;
		this.step1Roundness = 200;

		// -----02
		this.showExpressionGraph = false;
		this.lockStar = false;

		// -----02 softer
		this.blobModifier = 1;
		this.roundnessSofter = 120;
		this.blobAngleInc = 20;
		this.blobMinRadius = 50;
		this.blobMaxRadius = 110;
		this.blobMaxXNoise = 2;
		this.blobMaxYNoise = 2;
		this.blobPhaseShift = 0.001;
		this.blobZOff = 0.01;
		this.blob0Nose = 2;
		this.blob0NoseInc = 6;
		this.blob1LeftEye = 0;
		this.blob2RightEye = 0;
		this.blob3LeftEar = 1.5;
		this.blob4RightEar = 1.5;
		this.blob5LeftShoulder = 1.5;
		this.blob6RightShoulder = 1.5;
		this.blob7LeftElbow = 1.5;
		this.blob8RightElbow = 1.5;
		this.blob9LeftWrist = 1.5;
		this.blob10RightWrist = 1.5;
		this.blob11LeftHip = 1.5;
		this.blob12RightHip = 1.5;
		this.blob13LeftKnee = 1.5;
		this.blob14RightKnee = 1.5;
		this.blob15LeftAnkle = 1.5;
		this.blob16RightAnkle = 1.5;

		// -----02 sharper
		this.roundnessSharper = 100;
		this.starPoints = 7;
		this.starInternalRadius = 35;
		this.starExternalRadius = 70;
		this.starNoiseRange = 50;
		this.starNoiseStep = 0.01;
		this.starModifier = 1;
		this.star0Nose = 2.5;
		this.star1LeftEye = 0;
		this.star2RightEye = 0;
		this.star3LeftEar = 0.5;
		this.star4RightEar = 0.5;
		this.star5LeftShoulder = 1;
		this.star6RightShoulder = 1;
		this.star7LeftElbow = 1;
		this.star8RightElbow = 1;
		this.star9LeftWrist = 1;
		this.star10RightWrist = 1;
		this.star11LeftHip = 1.5;
		this.star12RightHip = 1.5;
		this.star13LeftKnee = 1;
		this.star14RightKnee = 1;
		this.star15LeftAnkle = 1;
		this.star16RightAnkle = 1;

		// -----scene03
		this.voiceScaleModifier = 1;
		this.voiceMaxPadding = -20;
		this.voiceMinPadding = 220;
		this.phaseMaxOffset = 0.01;
		this.phaseMax = 0.0001;
	}
}

let par = new Paramaterize();
let gui = new dat.GUI({
	autoPlace: true,
	width: 350,
	// load: getPresetJSON(),
	preset: 'Preset1',
});
gui.remember(par);

// -----scene routing
let sceneGui = gui.add(par, 'scene', [0, 1, 2, 3, 4]);
sceneGui.onChange(() => sceneRouter());
// -----toggle debug
gui.add(par, 'debug');

// -----general
let f00 = gui.addFolder('General');
f00.add(par, 'frameRate');
f00.add(par, 'recordFrames');
f00.add(par, 'preRecCounterFrames');
f00.add(par, 'showFrameRate');
f00.add(par, 'videoSync');
f00.add(par, 'shapeStrokeWeight');
f00.add(par, 'padding');
f00.add(par, 'gifFrames');
f00.add(par, 'noseYOffset');
f00.add(par, 'topSpeed');
f00.add(par, 'maxAcc');

// -----reference
let fr = gui.addFolder('Reference');
fr.add(par, 'showFrameRate');
fr.add(par, 'hideShape');
fr.add(par, 'showExpanded');
fr.add(par, 'showAnchors');
// fr.add(par, 'showPose');
// fr.add(par, 'showHull');

// -----01scene
let f01 = gui.addFolder('Step 01');

f01.add(par, 's01UseBlob');
f01.add(par, 's01UseStar');
f01.add(par, 'step1Roundness');
f01.add(par, 'ellipseIncrement', 2);
f01.add(par, 'ellipseMinRadius');
f01.add(par, 'ellipseMaxRadius');
f01.add(par, 'ellipseOffsetIncrement');

// -----02scene
let f021 = gui.addFolder('Step 02');
f021.add(par, 'showExpressionGraph');

// -----02softer
let f022 = gui.addFolder('Step 02 - Softer shape');
f022.add(par, 'blobModifier');
f022.add(par, 'roundnessSofter');
f022.add(par, 'blobAngleInc', 2);
f022.add(par, 'blobMinRadius');
f022.add(par, 'blobMaxRadius');
f022.add(par, 'blobMaxXNoise');
f022.add(par, 'blobMaxYNoise');
f022.add(par, 'blobPhaseShift');
f022.add(par, 'blobZOff');
f022.add(par, 'blob0Nose');
f022.add(par, 'blob0NoseInc');
f022.add(par, 'blob1LeftEye');
f022.add(par, 'blob2RightEye');
f022.add(par, 'blob3LeftEar');
f022.add(par, 'blob4RightEar');
f022.add(par, 'blob5LeftShoulder');
f022.add(par, 'blob6RightShoulder');
f022.add(par, 'blob7LeftElbow');
f022.add(par, 'blob8RightElbow');
f022.add(par, 'blob9LeftWrist');
f022.add(par, 'blob10RightWrist');
f022.add(par, 'blob11LeftHip');
f022.add(par, 'blob12RightHip');
f022.add(par, 'blob13LeftKnee');
f022.add(par, 'blob14RightKnee');
f022.add(par, 'blob15LeftAnkle');
f022.add(par, 'blob16RightAnkle');
// f022.open()

// -----02sharper
let f023 = gui.addFolder('Step 02 - Sharper shape');
f023.add(par, 'lockStar');
f023.add(par, 'starModifier');
f023.add(par, 'roundnessSharper');
f023.add(par, 'starPoints');
f023.add(par, 'starInternalRadius');
f023.add(par, 'starExternalRadius');
f023.add(par, 'starNoiseStep');
f023.add(par, 'star0Nose');
f023.add(par, 'star1LeftEye');
f023.add(par, 'star2RightEye');
f023.add(par, 'star3LeftEar');
f023.add(par, 'star4RightEar');
f023.add(par, 'star5LeftShoulder');
f023.add(par, 'star6RightShoulder');
f023.add(par, 'star7LeftElbow');
f023.add(par, 'star8RightElbow');
f023.add(par, 'star9LeftWrist');
f023.add(par, 'star10RightWrist');
f023.add(par, 'star11LeftHip');
f023.add(par, 'star12RightHip');
f023.add(par, 'star13LeftKnee');
f023.add(par, 'star14RightKnee');
f023.add(par, 'star15LeftAnkle');
f023.add(par, 'star16RightAnkle');
// f023.open()

// -----03
let f003 = gui.addFolder('Step 03');
f003.add(par, 'voiceScaleModifier');
f003.add(par, 'voiceMinPadding');
f003.add(par, 'voiceMaxPadding');

// -----video sync
let fvs = gui.addFolder('Video Sync');
// fvs.add(par, 'dx');
// fvs.add(par, 'dy');
// fvs.add(par, 'dwidth');
// fvs.add(par, 'dheight');
fvs.add(par, 'sx');
fvs.add(par, 'sy');
fvs.add(par, 'swidth');
fvs.add(par, 'sheight');
fvs.add(par, 'webcamWidth');
fvs.add(par, 'webcamHeight');

if (par.debug) {
	gui.close();
} else {
	gui.hide();
}

// this.dx = 380;
// this.dy = 0;
// this.dwidth = 500;
// this.dheight = 500;
// this.sx = 0;
// this.sy = 0;
// this.swidth = 500;
// this.sheight = 480;

// gui.add(par, 'dx');
// gui.add(par, 'dy');
// gui.add(par, 'dwidth');
// gui.add(par, 'dheight');
// gui.add(par, 'sx');
// gui.add(par, 'sy');
// gui.add(par, 'swidth');
// gui.add(par, 'sheight');
