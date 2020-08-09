class Paramaterize {
	constructor() {
		this.scene = 0;
		this.showHUD = true;
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
		this.framesToRecord = 900; // 900 frames is about 15 seconds
		this.shapeStrokeWeight = 3.5;
		this.mississippi = 240; // 240 frames is about 4 seconds
		this.roundnessSharper = 80;
		this.roundnessSofter = 120;
		this.roundness1 = 150;
		this.roundness3 = 150;
		this.angles = 1;
		this.emotionalScale = 0.5;
		this.innerStar = 100;
		this.outerStar = 200;
		this.starPoints = 9;
		this.noseOnly = false;
		this.useSamplePose = true;
		this.debug = false;
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

par = new Paramaterize();
let gui = new dat.GUI({ autoPlace: true });
let sceneGui = gui.add(par, 'scene');
sceneGui.onChange(() => {
	gotoScene();
});
gui.add(par, 'debug')
gui.add(par, 'showHUD');
gui.add(par, 'showExpanded');
gui.add(par, 'showCurves');
gui.add(par, 'frameRate');
gui.add(par, 'framesToRecord');
gui.add(par, 'shapeStrokeWeight');
gui.add(par, 'mississippi');
gui.add(par, 'roundness1');
gui.add(par, 'roundness3');
gui.add(par, 'roundnessSofter');
gui.add(par, 'roundnessSharper');
gui.add(par, 'padding');
gui.add(par, 'padding2');
gui.add(par, 'sampleWidth');
gui.add(par, 'sampleHeight');
gui.add(par, 'angles');
gui.add(par, 'phase');
gui.add(par, 'minSoundLevel');
gui.add(par, 'maxSoundLevel');
gui.add(par, 'effect');
gui.add(par, 'minR');
gui.add(par, 'maxR');
gui.add(par, 'maxY');
gui.add(par, 'maxX');
gui.add(par, 'levelLow');
gui.add(par, 'levelHigh');
gui.add(par, 'topSpeed');
gui.add(par, 'maxAcc');
gui.add(par, 'noseYOffset');
gui.add(par, 'shapeStrokeWeight');
gui.hide()