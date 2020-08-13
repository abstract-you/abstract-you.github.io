// let gifc = new CCapture({
// 	framerate: 24, // TODO: investigate further
// 	verbose: true,
// 	format: 'gif',
// 	workersPath: './lib/',
// });

let colors = {
	primary: '#f9f9f9',
};

// scene manager
let mgr;

// shape recording in three commulative steps
// scene01 records anchor positions
let history1 = [];
// scene02 records top expressions
let history2 = [];
// scene03 records hull points
// a final shape type is required for drawing
let history3 = [];
// the final shape type is the most common expression from history2
// TODO should this be a global variable?
let finalShapeType;

// will hold the canvas
// contains the canvas DOM element in .canvas
// (will be needed for CCapture)
let sketchCanvas;
// secondary canvas for showing the webacm preview
// and drawing posenet and faceapi feedback
let monitor;
// webcam video feed
let sample;
// let sampleWidth;
// let sampleHeight;

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

// ratios for shape calibration (TODO)
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
// TODO: do we still need the name in the anchor itself?
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

// TODO: use to build a skeleton when posenet doesn't provide one
// (TODO: is there a setting to tweak in posenet to fix that?)
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

p5.disableFriendlyErrors = true;

function setup() {
	// required for making audio work for the microphone (in scene3)
	getAudioContext().suspend();
	// ----- dat.gui
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
	startWebcam();
	// start getting faceapi ready
	if (!isFaceApiReady) faceapi = ml5.faceApi(sample, faceOptions, faceLoaded);
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
	// Very basic routing
	sceneRouter();
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

function startWebcam() {
	sample = createCapture(VIDEO, webcamReady);
	// TODO - too ugly
}

function webcamReady() {
	isWebcamReady = true;
	// sampleWidth = sample.width;
	// sampleHeight = sample.height;
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

// // Gets a posenet pose and returns distance between two points
// function poseDist(pose, a, b) {
// 	let left = createVector(pose[a].position.x, pose[a].position.y);
// 	let right = createVector(pose[b].position.x, pose[b].position.y);
// 	return p5.Vector.dist(left, right);
// }

// // Gets a posenet pose and returns eye distance
// function checkEyeDist(pose) {
// 	// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
// 	// 1	leftEye, 2	rightEye
// 	let left = createVector(pose[1].position.x, pose[1].position.y);
// 	let right = createVector(pose[2].position.x, pose[2].position.y);
// 	return p5.Vector.dist(left, right);
// }

function drawAbstractShape() {
	if (par.fillShape) {
		stroke(0);
		strokeWeight(par.shapeStrokeWeight);
		fill(255);
	} else {
		stroke(0);
		strokeWeight(par.shapeStrokeWeight);
		noFill();
	}
	beginShape();
	anchors.forEach(a => {
		if (par.showCurves) {
			curveVertex(a.position.x, a.position.y);
		} else {
			vertex(a.position.x, a.position.y);
		}
	});
	endShape(CLOSE);
}

function startPreroll() {
	preroll = true;
	full = false;
	recButton.addClass('rec');
	recButton.html('Stop');
	recButton.mousePressed(cancelRecording);
}

function noPreroll() {
	startRecording();
}

// TODO: make sure cancel still works though...
// function cancelRecording() {
// 	resetRecVariables();
// 	recButton.removeClass('rec');
// 	recButton.html('Record');
// 	if (mgr.isCurrent(scene01)) {
// 		recButton.mousePressed(() => {
// 			startPreroll();
// 		});
// 	} else {
// 		recButton.mousePressed(() => {
// 			noPreroll();
// 		});
// 	}
// }

function startRecording() {
	full = false;
	preroll = false;
	prerollCounter = 0;
	rec = true;
	redoButton.hide()
	nextButton.hide()
	recButton.show()
	recButton.addClass('rec');
	recButton.html('Stop');
	recButton.mousePressed(finishRecording);
	counterButton.show()
}

function updateCounter(remainingFrames) {
	let secs = floor(remainingFrames / 60);
	counterButton.html('00:' + secs);
}

function finishRecording() {
	// TODO localStorage?
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
	// TODO localStorage?
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
	text(floor(frameRate()), 20, height - 20);
	pop();
}

// useful for setting up tests
function getNewVideo(loc) {
	sample = createVideo(loc, videoReady);
	sample.volume(0);
	sample.loop();
	// sample.size(627, 470);
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
function remapFromPose(pointArr) {
	let sampleWidth = sample.width ? sample.width : 640;
	let sampleHeight = sample.height ? sample.height : 480;
	let padding = par.padding ? par.padding : 50;
	let remapped = pointArr.map(point => {
		return [
			remap(point[0], sampleWidth, width, padding),
			remap(point[1], sampleHeight, height, padding),
		];
	});
	return remapped;
}

// remaps a single number
function remap(point, range, target, padding) {
	return map(point, 0, range, padding, target - padding);
}
