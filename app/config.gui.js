class Paramaterize {
	constructor() {
		this.scene = '1';
		this.debug = false;

		// ----- general
		this.frameRate = 60;
		this.recordFrames = 900; // 900 frames is about 15 seconds
		this.preRecCounterFrames = 20; // 240 frames is about 4 seconds
		this.videoSync = 0;
		this.shapeStrokeWeight = 3.5;
		this.padding = 200;
		this.gifFrames = 100;
		this.topSpeed = 20;
		this.maxAcc = 10;
		this.minScore = 0;

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

		// -----neutral
		this.roundnessNeutral = 250;
		this.ellipseIncrement = 30;
		this.ellipseMinRadius = 75;
		this.ellipseMaxRadius = 75;
		this.ellipseOffsetIncrement = 0.01;
		this.neutral0 = 2.5;
		this.neutral1 = 0;
		this.neutral2 = 0;
		this.neutral3 = 1;
		this.neutral4 = 1;
		this.neutral5 = 2;
		this.neutral6 = 2;
		this.neutral7 = 2;
		this.neutral8 = 2;
		this.neutral9 = 1;
		this.neutral10 = 1;
		this.neutral11 = 1;
		this.neutral12 = 1;
		this.neutral13 = 1;
		this.neutral14 = 1;
		this.neutral15 = 1;
		this.neutral16 = 1;

		// -----bouba
		this.modifierBouba = 1;
		this.roundnessBouba = 250;
		this.angleIncBouba = 20;
		this.minRadiusBouba = 5;
		this.maxRadiusBouba = 90;
		this.maxXNoiseBouba = 10;
		this.maxYNoiseBouba = 10;
		this.phaseShiftBouba = 0.2;
		this.zOffBouba = 0.007;
		this.bouba0steps = 10;
		this.bouba0 = 2.2;
		this.bouba1 = 0;
		this.bouba2 = 0;
		this.bouba3 = 1;
		this.bouba4 = 1;
		this.bouba5 = 2;
		this.bouba6 = 2;
		this.bouba7 = 2;
		this.bouba8 = 2;
		this.bouba9 = 1;
		this.bouba10 = 1;
		this.bouba11 = 1;
		this.bouba12 = 1;
		this.bouba13 = 1;
		this.bouba14 = 1;
		this.bouba15 = 1;
		this.bouba16 = 1;

		// -----kiki
		this.modifierKiki = 1;
		this.roundnessKiki = 100;
		this.starPoints = 11;
		this.starInternalRadius = 70;
		this.starExternalRadius = 150;
		this.noiseRangeKiki = 50;
		this.xNoiseStepKiki = 0.01;
		this.yNoiseStepKiki = 0.01;
		this.phaseShiftKiki = 0.01;
		this.kiki0 = 2;
		this.kiki1 = 0;
		this.kiki2 = 0;
		this.kiki3 = 0;
		this.kiki4 = 0;
		this.kiki5 = 2;
		this.kiki6 = 2;
		this.kiki7 = 2;
		this.kiki8 = 2;
		this.kiki9 = 1;
		this.kiki10 = 1;
		this.kiki11 = 1;
		this.kiki12 = 1;
		this.kiki13 = 1;
		this.kiki14 = 1;
		this.kiki15 = 1;
		this.kiki16 = 1;

		// -----01
		this.boubaStep1 = false;
		this.kikiStep1 = false;

		// -----02
		this.showExpressionGraph = false;
		this.alwaysKiki = false;

		// -----03
		this.voiceScaleModifier = 1;
		this.voiceMaxPadding = -20;
		this.voiceMinPadding = 220;
		this.phaseMaxOffset = 0.01;
		this.phaseMax = 0.0001;
		this.defaultScale = 0.1;

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

		this.nose0 = function () {};
		this.leftEye1 = function () {};
		this.rightEye2 = function () {};
		this.leftEar3 = function () {};
		this.rightEar4 = function () {};
		this.leftShoulder5 = function () {};
		this.rightShoulder6 = function () {};
		this.leftElbow7 = function () {};
		this.rightElbow8 = function () {};
		this.leftWrist9 = function () {};
		this.rightWrist10 = function () {};
		this.leftHip11 = function () {};
		this.rightHip12 = function () {};
		this.leftKnee13 = function () {};
		this.rightKnee14 = function () {};
		this.leftAnkle15 = function () {};
		this.rightAnkle16 = function () {};
	}
}

let par = new Paramaterize();
let gui = new dat.GUI({
	autoPlace: true,
	width: 350,
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
f00.add(par, 'videoSync');
f00.add(par, 'shapeStrokeWeight');
f00.add(par, 'padding');
f00.add(par, 'gifFrames');
f00.add(par, 'topSpeed');
f00.add(par, 'maxAcc');
f00.add(par, 'minScore');

// -----reference
let fr = gui.addFolder('Reference');
fr.add(par, 'showFrameRate');
fr.add(par, 'hideShape');
fr.add(par, 'showExpanded');
fr.add(par, 'showAnchors');
// fr.add(par, 'showPose');
// fr.add(par, 'showHull');

// -----neutral

let f011 = gui.addFolder('neutral');
f011.add(par, 'roundnessNeutral');
f011.add(par, 'ellipseIncrement');
f011.add(par, 'ellipseMinRadius');
f011.add(par, 'ellipseMaxRadius');
f011.add(par, 'ellipseOffsetIncrement');
f011.add(par, 'neutral0');
f011.add(par, 'neutral1');
f011.add(par, 'neutral2');
f011.add(par, 'neutral3');
f011.add(par, 'neutral4');
f011.add(par, 'neutral5');
f011.add(par, 'neutral6');
f011.add(par, 'neutral7');
f011.add(par, 'neutral8');
f011.add(par, 'neutral9');
f011.add(par, 'neutral10');
f011.add(par, 'neutral11');
f011.add(par, 'neutral12');
f011.add(par, 'neutral13');
f011.add(par, 'neutral14');
f011.add(par, 'neutral15');
f011.add(par, 'neutral16');

// -----bouba
let f022 = gui.addFolder('bouba');
f022.add(par, 'modifierBouba');
f022.add(par, 'roundnessBouba');
f022.add(par, 'angleIncBouba', 2);
f022.add(par, 'minRadiusBouba');
f022.add(par, 'maxRadiusBouba');
f022.add(par, 'maxXNoiseBouba');
f022.add(par, 'maxYNoiseBouba');
f022.add(par, 'phaseShiftBouba');
f022.add(par, 'zOffBouba');
f022.add(par, 'bouba0steps');
f022.add(par, 'bouba0');
f022.add(par, 'bouba1');
f022.add(par, 'bouba2');
f022.add(par, 'bouba3');
f022.add(par, 'bouba4');
f022.add(par, 'bouba5');
f022.add(par, 'bouba6');
f022.add(par, 'bouba7');
f022.add(par, 'bouba8');
f022.add(par, 'bouba9');
f022.add(par, 'bouba10');
f022.add(par, 'bouba11');
f022.add(par, 'bouba12');
f022.add(par, 'bouba13');
f022.add(par, 'bouba14');
f022.add(par, 'bouba15');
f022.add(par, 'bouba16');
// f022.open()

// -----kiki
let f023 = gui.addFolder('kiki');
f023.add(par, 'modifierKiki');
f023.add(par, 'roundnessKiki');
f023.add(par, 'starPoints');
f023.add(par, 'starInternalRadius');
f023.add(par, 'starExternalRadius');
f023.add(par, 'noiseRangeKiki');
f023.add(par, 'xNoiseStepKiki');
f023.add(par, 'yNoiseStepKiki');
f023.add(par, 'phaseShiftKiki');
f023.add(par, 'kiki0');
f023.add(par, 'kiki1');
f023.add(par, 'kiki2');
f023.add(par, 'kiki3');
f023.add(par, 'kiki4');
f023.add(par, 'kiki5');
f023.add(par, 'kiki6');
f023.add(par, 'kiki7');
f023.add(par, 'kiki8');
f023.add(par, 'kiki9');
f023.add(par, 'kiki10');
f023.add(par, 'kiki11');
f023.add(par, 'kiki12');
f023.add(par, 'kiki13');
f023.add(par, 'kiki14');
f023.add(par, 'kiki15');
f023.add(par, 'kiki16');
// f023.open()

// -----01scene
let f01 = gui.addFolder('Step 01');

f01.add(par, 'boubaStep1');
f01.add(par, 'kikiStep1');

// -----02scene
let f021 = gui.addFolder('Step 02');
f021.add(par, 'alwaysKiki');
f021.add(par, 'showExpressionGraph');

// -----03
let f003 = gui.addFolder('Step 03');
f003.add(par, 'voiceScaleModifier');
f003.add(par, 'voiceMinPadding');
f003.add(par, 'voiceMaxPadding');
f003.add(par, 'defaultScale');

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

// -----part index
let partIndex = gui.addFolder('Part Index');
partIndex.add(par, 'nose0');
partIndex.add(par, 'leftEye1');
partIndex.add(par, 'rightEye2');
partIndex.add(par, 'leftEar3');
partIndex.add(par, 'rightEar4');
partIndex.add(par, 'leftShoulder5');
partIndex.add(par, 'rightShoulder6');
partIndex.add(par, 'leftElbow7');
partIndex.add(par, 'rightElbow8');
partIndex.add(par, 'leftWrist9');
partIndex.add(par, 'rightWrist10');
partIndex.add(par, 'leftHip11');
partIndex.add(par, 'rightHip12');
partIndex.add(par, 'leftKnee13');
partIndex.add(par, 'rightKnee14');
partIndex.add(par, 'leftAnkle15');
partIndex.add(par, 'rightAnkle16');

if (par.debug) {
	gui.open();
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
