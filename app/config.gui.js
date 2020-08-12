class Paramaterize {
	constructor() {
		this.scene = '1';
		this.recordFrames = 900; // 900 frames is about 15 seconds
		this.preRecCounterFrames = 20; // 240 frames is about 4 seconds

		// ----- general
		this.frameRate = 60 // TODO do I still need this?

		// ----- scene01 ellipse
		this.ellipseOffsetIncrement = 0.01;
		this.ellipseMinRadius = 38;
		this.ellipseMaxRadius = 40;
		this.ellipseIncrement = 60;

		this.hideShape = false;
		this.referenceAnchorRadius = 10;
		this.showHUD = false;
		this.levelLow = -50;
		this.levelHigh = 50;
		this.effect = 1;
		this.phase = 0.0001;
		this.minR = -100;
		this.maxR = 200;
		this.maxY = 111;
		this.maxX = 111;
		this.minSoundLevel = 300;
		this.maxSoundLevel = -550;
		this.voiceScaleModifier = 1;
		this.shapeStrokeWeight = 3.5;
		this.roundnessSharper = 80;
		this.roundnessSofter = 120;
		this.step1Roundness = 150;
		this.roundness3 = 150;
		this.angles = 1;
		this.emotionalScale = 0.5;
		this.innerStar = 100;
		this.outerStar = 200;
		this.starPoints = 9;
		this.noseOnly = false;
		this.useSamplePose = true;
		this.debug = true;
		this.frameRate = false;
		this.phaseMultiplier = 0.1;
		this.emotionalIntensity = 10;
		this.noiseMax = 1;
		this.xNoiseMax = 1;
		this.yNoiseMax = 1;
		this.zNoiseOffset = 0.0001;
		this.phaseMaxOffset = 0.01;
		this.nosePhaseMax = 0.0001;
		this.phaseMax = 0.0001;
		this.inc = 12;
		this.noseRadius = 120;
		this.blobMin = 50;
		this.blobMax = 100;
		this.blobOffset = 0.1;
		this.blobPhaseOffset = 0.1;
		this.noseMinRadius = 100;
		this.noseMaxRadius = 200;
		this.topSpeed = 10;
		this.maxAcc = 4;
		this.radius = 50;
		this.noseYOffset = 155;
		this.earRadius = 35;
		this.wristRadius = 55;
		this.autoRadius = true;
		this.autoRadiusRatio = 0.5;
		this.manualRadiusRatio = 1;
		this.noseExpandRatio = 3.5;
		this.noiseLevel = 0.001;
		this.showExpanded = false;
		this.showAnchors = false;
		this.showPose = false;
		this.showHull = false;
		this.fillShape = false;
		this.showCurves = true;
		this.audioResolution = 32; // bins
		this.happy = 1;
		this.angry = 1;
		this.padding = 200;
		this.padding2 = 210;
		this.sampleWidth = 627;
		this.sampleHeight = 470;
	}
}

let par = new Paramaterize();
let gui = new dat.GUI({ autoPlace: true });

// -----scene routing
let sceneGui = gui.add(par, 'scene', [0, 1, 2, 3, 4]);
sceneGui.onChange(() => sceneRouter());

// -----important 
gui.add(par, 'debug');
gui.add(par, 'recordFrames');
gui.add(par, 'preRecCounterFrames');

// -----01scene
let f01 = gui.addFolder('Step 01');
f01.add(par, 'ellipseIncrement');
f01.add(par, 'ellipseMinRadius');
f01.add(par, 'ellipseMaxRadius');
f01.add(par, 'ellipseOffsetIncrement');

// gui.add(par, 'showHUD');
// gui.add(par, 'showExpanded');
// gui.add(par, 'showCurves');
// gui.add(par, 'frameRate');
// gui.add(par, 'recordFrames');
// gui.add(par, 'shapeStrokeWeight');
// gui.add(par, 'preRecCounterFrames');
// gui.add(par, 'step1Roundness');
// gui.add(par, 'roundness3');
// gui.add(par, 'roundnessSofter');
// gui.add(par, 'roundnessSharper');
// gui.add(par, 'padding');
// gui.add(par, 'padding2');
// gui.add(par, 'sampleWidth');
// gui.add(par, 'sampleHeight');
// gui.add(par, 'angles');
// gui.add(par, 'phase');
// gui.add(par, 'minSoundLevel');
// gui.add(par, 'maxSoundLevel');
// gui.add(par, 'effect');
// gui.add(par, 'minR');
// gui.add(par, 'maxR');
// gui.add(par, 'maxY');
// gui.add(par, 'maxX');
// gui.add(par, 'levelLow');
// gui.add(par, 'levelHigh');
// gui.add(par, 'topSpeed');
// gui.add(par, 'maxAcc');
// gui.add(par, 'noseYOffset');
// gui.add(par, 'shapeStrokeWeight');
// gui.add(par, 'hideShape');
// gui.add(par, 'referenceAnchorRadius');
gui.show();
