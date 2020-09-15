let capturer = new CCapture({
	framerate: 20,
	format: 'gif',
	workersPath: './lib/',
});
let gifFrames = 0;
let gifc;

// scene manager
let mgr;

const osnoise = new OpenSimplexNoise();

// shape recording in three commulative steps
// step 1, anchor positions
let history1 = [];
// step 2, expression history
let history2 = [];
// step 3, mic level history
let history3 = [];
// the final shape type is the most common expression from history2
let finalShapeType;
// the final scale is the average mic level from history3
let finalScale;

// will hold the canvas
// contains the canvas DOM element in .canvas
// (will be needed for CCapture)
let sketchCanvas;
// secondary canvas for showing the webacm preview
// and drawing posenet and faceapi feedback
let monitor;
// webcam video feed
let sample;

let phase = 0.0;
let zoff = 0.0;

// ui elements
let recButton;
let nextButton;
let restartButton;
let redoButton;
let counterButton;

// state variables for managing the ui
let rec = false;
let preroll = false;
let play = false;
let full = false;
let prerollCounter = 0;
let isWebcamReady = false;
let isPosenetReady = false;
let isFaceapiLoaded = false;
let isFaceApiReady = false;
let isFaceapiStandby = true;

// ml5/posenet
let posenet;
let poses = [];
let posenetOptions = {
	// imageScaleFactor: 0.3,
	// outputStride: 16,
	// flipHorizontal: false,
	// minConfidence: 0.5,
	// scoreThreshold: 0.5,
	// nmsRadius: 20,
	// detectionType: 'single',
	// multiplier: 0.75,
	maxPoseDetections: 1,
};

// ratios for shape calibration
let eyeDist;
let shoulderDist;
let hipDist;
let eyeShoulderRatio;
let eyeWaistRatio;
let shoulderWaistRatio;

// faceapi and expressions
let faceapi;
let detections = [];
const faceOptions = {
	withLandmarks: false,
	withExpressions: true,
	withDescriptors: false,
};

// mic management (for scene03)
let mic;
let micLevel;
let spectrum;
let ampl;

// anchors with a basic physics engine to build the shape around
// the anchors object stores anchors keyed by part name
let anchors = {
	nose: '',
	leftEye: '',
	rightEye: '',
	leftEar: '',
	rightEar: '',
	leftShoulder: '',
	rightShoulder: '',
	leftElbow: '',
	rightElbow: '',
	leftWrist: '',
	rightWrist: '',
	leftHip: '',
	rightHip: '',
	leftKnee: '',
	rightKnee: '',
	leftAnkle: '',
	rightAnkle: '',
};
let noseAnchor;

const SKELETON = [
	[11, 5],
	[7, 5],
	[7, 9],
	[11, 13],
	[13, 15],
	[12, 6],
	[8, 6],
	[8, 10],
	[12, 14],
	[14, 16],
	[5, 6],
	[11, 12],
];

// makes it easier to read the code for calling specific parts
const NOSE = 0;
const LEYE = 1;
const REYE = 2;
const LEAR = 3;
const REAR = 4;
const LSHOULDER = 5;
const RSHOULDER = 6;
const LELBOW = 7;
const RELBOW = 8;
const LWRIST = 9;
const RWRIST = 10;
const LHIP = 11;
const RHIP = 12;
const LKNEE = 13;
const RKNEE = 14;
const LANKLE = 15;
const RANKLE = 16;

let colors = {
	primary: '#f9f9f9',
	dark: '#101010',
};

p5.disableFriendlyErrors = true;

function setup() {
	// ----- scenemanager
	mgr = new SceneManager();
	mgr.addScene(scene00);
	mgr.addScene(scene01);
	mgr.addScene(scene02);
	mgr.addScene(scene03);
	mgr.addScene(scene04);
	angleMode(DEGREES);
	sketchCanvas = createCanvas(350, 350);
	sketchCanvas.parent('#canvas-01');
	textFont('Space Mono');
	background(255);
	monitor = createGraphics(500, 470);
	monitor.textFont('Space Mono');
	monitor.background(255);
	if (!par.demoMode) startWebcam();
	if (par.demoMode) getNewVideo('app/demo.mp4');
	// start getting faceapi ready
	if (!isFaceApiReady && !par.demoMode)
		faceapi = ml5.faceApi(sample, faceOptions, faceLoaded);
	// Prepare anchors to chase posenet points
	Object.keys(anchors).forEach(partName => {
		let anchor = new Anchor(width / 2, height / 2, partName);
		anchors[partName] = anchor;
	});
	// Prepare a dedicated anchor for the intro screen
	noseAnchor = new Anchor(width / 2, height / 2);
	select('#begin-button').mousePressed(() => {
		mgr.showScene(scene01);
	});
	frameRate(par.frameRate);
	// Very basic routing
	sceneRouter();
	// required for making audio work for the microphone (in scene3)
	getAudioContext().suspend();
	// Check for something in localstroage
	isDownloaded = store('downloadedShape');
	if (isDownloaded) {
		console.log('download found');
		history1 = store('history1');
		history2 = store('history2');
		history3 = store('history3');
		mgr.showScene(scene04);
	}
}

function draw() {
	mgr.draw();
}

function sceneRouter() {
	// dat.GUI gets these options as an array of numbers (not strings), so
	// something probably needs to be changed
	switch (par.scene) {
		case '0':
			mgr.showScene(scene00);
			break;
		case '1':
			mgr.showScene(scene01);
			break;
		case '2':
			mgr.showScene(scene02);
			break;
		case '3':
			mgr.showScene(scene03);
			break;
		case '4':
			mgr.showScene(scene04);
			break;
		default:
			console.log('bad scene request');
			break;
	}
}

function startMic() {
	mic = new p5.AudioIn();
	mic.start();
	// required for making audio work for the microphone (in scene3)
	// https://p5js.org/reference/#/p5/userStartAudio
	// (it gets suspended in setup and resumed )
	// TODO: make sure it actually works correctly when called from here
	userStartAudio();
}

function stopWebcam(webcam) {
	if (webcam.elt.srcObject) {
		webcam.elt.srcObject.getTracks().forEach(t => {
			t.stop();
		});
	}
}
function startWebcam() {
	sample = createCapture(VIDEO, webcamReady);
}

function webcamReady() {
	isWebcamReady = true;
	posenet = ml5.poseNet(sample, posenetOptions, modelReady);
	posenet.on('pose', function (results) {
		poses = results;
	});
}

function modelReady() {
	isPosenetReady = true;
	// modelReady
}

function faceLoaded() {
	isFaceapiLoaded = true;
	faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
	if (error) {
		console.error(error);
		return;
	}
	detections = result;
	isFaceApiReady = true;
	if (!isFaceapiStandby) faceapi.detect(gotFaces);
}

function startRecording() {
	full = false;
	preroll = false;
	prerollCounter = 0;
	rec = true;
	redoButton.hide();
	nextButton.hide();
	recButton.show();
	recButton.addClass('rec');
	recButton.html('Stop');
	recButton.mousePressed(finishRecording);
	counterButton.show();
}

function updateCounter(remainingFrames) {
	let secs = floor(remainingFrames / 60);
	counterButton.html('0:' + secs);
}

function finishRecording() {
	preroll = false;
	prerollCounter = 0;
	rec = false;
	full = true;
	recButton.hide();
	nextButton.show();
	counterButton.hide();
	redoButton.show();
}

// Used when stopping during the preroll, before there's any recording at all
function cancelRecording() {
	preroll = false;
	prerollCounter = 0;
	rec = false;
	full = false;
	recButton.html('Record');
	recButton.removeClass('rec');
	recButton.mousePressed(() => startPreroll());
	counterButton.html('00:' + par.recordFrames / 60);
}

// the logic behind this idea is deeply flawed, since
// the readings are impacted by dozens of other factors before
// the actual body proprortions show through
function deriveProportions(pose) {
	// eyeDist = floor(poseDist(pose, LEFTEYE, RIGHTEYE));
	// shoulderDist = floor(poseDist(pose, LEFTSHOULDER, RIGHTSHOULDER));
	// hipDist = floor(poseDist(pose, LEFTHIP, RIGHTHIP));
}

function mirror(obj = sketchCanvas) {
	obj.translate(width, 0);
	obj.scale(-1, 1);
}

// Hides everything and then shows the desired scene
function chooseScene(sceneId) {
	if (par.debug) console.log('Going to ', sceneId);
	selectAll('.fullscreen').forEach(el => {
		el.addClass('hidden');
	});
	select(sceneId).removeClass('hidden');
}

// Use in draw() to show framerate in bottom left corner
function fps() {
	push();
	textSize(14);
	fill(200);
	text(floor(frameRate()), 18, height - 20);
	pop();
}

// useful for setting up tests
function getNewVideo(loc) {
	sample = createVideo(loc, videoReady);
	sample.volume(0);
	sample.loop();
	sample.hide();
}

function videoReady() {
	if (par.debug) console.log('Video Ready');
	posenet = ml5.poseNet(sample, posenetOptions, modelReady);
	posenet.on('pose', function (results) {
		// console.log('Poses Ready')
		poses = results;
	});
}

function drawRef(points, color, weight) {
	push();
	stroke(color);
	strokeWeight(weight);
	points.forEach(p => {
		point(p[0], p[1]);
	});
	pop();
}

// wrapper for console.log that only fires if debug is true in dat.gui
function dbg(message) {
	if (par.debug) console.log(message);
}

// remaps points from the sample dimensions to the canvas dimensions
// applies padding, which also centers and scales the shape
function remapFromPose(pointArr, padding = par.padding) {
	// console.log('remapFromPose');
	// console.log(padding);
	// console.log(pointArr);
	// If there's no pose, we just return an empty array to draw nothing (this
	// seemed like the simplest way to integrate a confidence score)
	if (!pointArr[0]) return [];
	let webcamWidth = sample.width ? sample.width : 640;
	let webcamHeight = sample.height ? sample.height : 480;
	let remapped = pointArr.map(point => {
		return [
			remap(point[0], webcamWidth, width, padding),
			remap(point[1], webcamHeight, height, padding),
		];
	});
	return remapped;
}

// remaps a single number
function remap(point, range, target, padding) {
	return map(point, 0, range, padding, target - padding);
}

function rewireUI(sceneIndex) {
	if (!sceneIndex) {
		sceneIndex = mgr.findSceneIndex(mgr.scene.fnScene);
	}
	// rehook and reset and show record button
	recButton = select('#record-button-0' + sceneIndex);
	recButton.html('Record');
	recButton.removeClass('rec');
	recButton.mousePressed(() => startRecording());
	recButton.show();
	// reset and show counter
	counterButton = select('#counter-0' + sceneIndex);
	// update recording time based on recording frames. assumes a recording time
	// of less than 60 seconds...
	counterButton.html('0:' + par.recordFrames / 60);
	counterButton.show();
	// rehook button for this scene, and hide for now
	redoButton = select('#redo-0' + sceneIndex);
	redoButton.mousePressed(() => mgr.showScene(mgr.scene.fnScene));
	redoButton.hide();
	// rehook next button for this scene, and hide for now
	nextButton = select('#next-button-0' + sceneIndex);
	nextButton.mousePressed(() => mgr.showNextScene());
	nextButton.hide();
}
