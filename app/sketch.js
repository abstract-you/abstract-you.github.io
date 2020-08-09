// --posenet
let canvas, vf;
let status;
let sample;
let webcamPreview;
let button;
let videoSample = 'assets/01.mp4';

let sceneReady = false;

let rec = false;
let preroll = false;
let play = false;
let full = false;
let prerollCounter = 0;

let posenet;
let poses = [];

/*
Stores recording from step 1 as array of posenet poses
[ 
	{ part: 'nose', position: { x: 1, y: 1 } },
	...
] 
*/
let history1 = [];

/*
 */
let history2 = [];

let history3 = [];

/*
Used separately to choose the final expression
*/
let expressionAggregate = [];

let voiceHistory = [];
let options = { maxPoseDetections: 1 };

let micLevel;

let noseAnchor;
let anchors = [];
let expanded = [];
let hullSet = [];

let phase = 0.0;
let zoff = 0.0;

let eyeDist;
let shoulderDist;
let hipDist;
let eyeShoulderRatio;
let eyeWaistRatio;
let shoulderWaistRatio;

// --faceapi
let faceapi;
let detections = [];
let faceapiLoaded = false;
let faceapiStandby = true;
let isFaceApiReady = false;

const faceOptions = {
	withLandmarks: false,
	withExpressions: true,
	withDescriptors: false,
};

// --sound

let mic;
let spectrum;
let ampl;

let mgr, g;

const NOSE = 0;
const LEFTEYE = 1;
const RIGHTEYE = 2;
const LEFTEAR = 3;
const RIGHTEAR = 4;
const LEFTSHOULDER = 5;
const RIGHTSHOULDER = 6;
const LEFTELBOW = 7;
const RIGHTELBOW = 8;
const LEFTWRIST = 9;
const RIGHTWRIST = 10;
const LEFTHIP = 11;
const RIGHTHIP = 12;
const LEFTKNEE = 13;
const RIGHTKNEE = 14;
const LEFTANKLE = 15;
const RIGHTANKLE = 16;
const PARTS = [
	'nose',
	'leftEye',
	'rightEye',
	'leftEar',
	'rightEar',
	'leftShoulder',
	'rightShoulder',
	'leftElbow',
	'rightElbow',
	'leftWrist',
	'rightWrist',
	'leftHip',
	'rightHip',
	'leftKnee',
	'rightKnee',
	'leftAnkle',
	'rightAnkle',
];

// p5.disableFriendlyErrors = true;
function mousePressed() {
  userStartAudio();
}
function setup() {
	getAudioContext().suspend();

	angleMode(DEGREES);
	mgr = new SceneManager();

	// loadSample();
	// // Preload scenes. Preloading is normally optional
	// // ... but needed if showNextScene() is used.

	mgr.addScene(scene00);
	mgr.addScene(scene01);
	mgr.addScene(scene02);
	mgr.addScene(scene03);
	mgr.addScene(scene04);

	canvas = createCanvas(350, 350);
	canvas.parent('#canvas-01');

	vf = createGraphics(500, 470);
	vf.translate(vf.width, 0);
	vf.scale(-1, 1);
	vf.textFont('Space Mono');

	background(255);
	textFont('Space Mono');

	// Prepare anchors to chase posenet points
	PARTS.forEach(p => {
		let anchor = new Anchor(width / 2, height / 2, p);
		anchors.push(anchor);
	});
	// --b

	select('#begin-button').mousePressed(() => {
		mgr.showScene(scene01);
	});

	// Prepare a dedicated anchor for the intro screen
	noseAnchor = new Anchor(width / 2, height / 2);

	// start getting faceapi ready

	startWebcam();
	// getNewVideo(videoSample)

	if (!isFaceApiReady) faceapi = ml5.faceApi(sample, faceOptions, faceReady);
	gotoScene();
}

function draw() {
	mgr.draw();
}

function gotoScene() {
	switch (par.scene) {
		case 0:
			mgr.showScene(scene00);
			break;
		case 1:
			mgr.showScene(scene01);
			break;
		case 2:
			mgr.showScene(scene02);
			break;
		case 3:
			mgr.showScene(scene03);
			break;
		case 4:
			mgr.showScene(scene04);
			break;
		default:
			break;
	}
}

function startMic() {
	mic = new p5.AudioIn();
	mic.start();
}

function startWebcam() {
	sample = createCapture(VIDEO, webcamReady);
	// TODO - too ugly
	sample.parent('#webcam-monitor-0' + par.scene);
}

function webcamReady() {
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		poses = results;
		sceneReady = true;
	});
}

function modelReady() {
	// modelReady
}

function faceReady() {
	isFaceApiReady = true;
	faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
	if (error) {
		l(error);
		return;
	}
	detections = result;
	faceapiLoaded = true;
	if (!faceapiStandby) faceapi.detect(gotFaces);
}

// =============================================================
// =                         BEGIN SCENES                      =
// =============================================================

// --0 intro

function scene00() {
	this.enter = function () {
		// Hide previous scene
		select('#scene-01').addClass('hidden');
		// show this scene
		select('#scene-00').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-00');
		// move the webcam monitor over
		sample.parent('#webcam-monitor-00');
		// resize video to fit previe frame
		sample.size(467, 350);
	};

	// --0draw
	this.draw = function () {
		background(255);
		if (sceneReady) {
			if (poses[0]) {
				let p = createVector(poses[0].pose.nose.x, poses[0].pose.nose.y);
				noseAnchor.setTarget(p);

				noseAnchor.behaviors();
				noseAnchor.update();
				// if (par.showAnchors) noseAnchor.show();

				let nx = noseAnchor.position.x;
				let ny = noseAnchor.position.y;

				// Keeps shape from reaching the corners
				let pad = constrain(80, 0, width / 4);
				// Mirror? Flip back?
				let fx = map(nx, 0, width, width, 0);
				let cx = constrain(fx, pad, width - pad);
				let cy = constrain(ny, pad, height - pad);

				push();
				translate(cx, cy);
				stroke(0);
				strokeWeight(par.shapeStrokeWeight);
				noFill();
				beginShape();
				for (let a = 0; a < 360; a += 1) {
					// Follow a circular path through the noise space to create a smooth flowing shape
					let xoff = map(cos(a + phase), -1, 1, 0, 1);
					let yoff = map(sin(a + phase), -1, 1, 0, 1);
					let r = map(noise(xoff, yoff, zoff), 0, 1, 50, 60);
					let x = r * cos(a);
					let y = r * sin(a);
						curveVertex(x, y);
				}
				endShape(CLOSE);
				phase += 0.001;
				zoff += 0.03;
				pop();
			}
		}
		mirror();
		if (par.frameRate) fps();
		mirror(); // Yeah, perfectly reasonable solution...
	};
}

function refreshAnchors() {
	anchors.forEach(a => {
		a.behaviors();
		a.update();
		if (par.showAnchors) a.show();
	});
}

// Takes an array of posenet keypoints
// What happens if this array also has epxression data at index [17]?
function retargetAnchorsFromPose(targets) {
	// TODO: mark anchors, text or color or something
	anchors.forEach((a, i) => {
		if (targets[i]) {
			let v = createVector(targets[i].position.x, targets[i].position.y);
			a.setTarget(v);
		} else {
			let v = createVector(targets[0].position.x, targets[0].position.y);
			a.setTarget(v);
		}
		a.behaviors();
		a.update();
		if (par.showAnchors) a.show();
	});
}

function retargetAnchorsFromPoints(targets) {
	// console.log('retargetAnchorsFromPoints',targets)
	anchors.forEach((a, i) => {
		if (targets[i]) {
			let v = createVector(targets[i][0], targets[i][1]);
			a.setTarget(v);
		} else {
			let v = createVector(targets[0][0], targets[0][1]);
			a.setTarget(v);
		}
		a.behaviors();
		a.update();
		if (par.showAnchors) a.show();
	});
}

// Gets a posenet pose and returns distance between two points
function poseDist(pose, a, b) {
	let left = createVector(pose[a].position.x, pose[a].position.y);
	let right = createVector(pose[b].position.x, pose[b].position.y);
	return p5.Vector.dist(left, right);
}

// Gets a posenet pose and returns eye distance
function checkEyeDist(pose) {
	// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
	// 1	leftEye, 2	rightEye
	let left = createVector(pose[1].position.x, pose[1].position.y);
	let right = createVector(pose[2].position.x, pose[2].position.y);
	return p5.Vector.dist(left, right);
}

// Gets a posenet pose and returns eye-should ratio
function checkEyeShoulderRatio() {
	// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
	//  1	leftEye
	//  2	rightEye
	//  5	leftShoulder
	//  6	rightShoulder
}

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

function makePointSet(vArr) {
	let set = [];
	vArr.forEach(v => {
		let pt = [v.x, v.y];
		set.push(pt);
	});
	return set;
}

function startPreroll() {
	preroll = true;
	button.addClass('preroll');
	button.html('...');
	button.mousePressed(finishRecording);
}

function cancelRecording() {
	resetRecVariables();
	button.removeClass('preroll');
	button.removeClass('rec');
	button.html('Record');
	if (mgr.isCurrent(scene01)) {
		button.mousePressed(() => {
			startPreroll();
		});
	} else {
		button.mousePressed(() => {
			noPreroll();
		});
	}
}

function noPreroll() {
	startRecording();
}

function startRecording() {
	preroll = false;
	prerollCounter = 0;
	rec = true;
	button.addClass('rec');
	button.html('Stop');
	button.mousePressed(finishRecording);
}

function setCounter(count) {
	// Easier than trying to figure out which counter is shown...
	let counters = selectAll('.counter');
	counters.forEach(counter => {
		counter.html(count);
	});
}

function finishRecording() {
	// TODO localStorage?
	rec = false;
	full = true;
	play = true;
	button.removeClass('rec');
	button.addClass('primary');
	button.html('Next');
	button.mousePressed(() => {
		mgr.showNextScene();
	});
	let counters = selectAll('.counter');
	counters.forEach(counter => {
		counter.html('000');
	});
}

function deriveProportions(pose) {
	eyeDist = floor(poseDist(pose, LEFTEYE, RIGHTEYE));
	shoulderDist = floor(poseDist(pose, LEFTSHOULDER, RIGHTSHOULDER));
	hipDist = floor(poseDist(pose, LEFTHIP, RIGHTHIP));
}

function mirror() {
	translate(width, 0);
	scale(-1, 1);
}

function updateAnchors() {
	anchors.forEach(a => {
		a.topSpeed = par.topSpeed;
		a.maxForce = par.maxAcc;
	});
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
	mirror(); // Unmirror so we can read the text
	textSize(14);
	fill(200);
	text(floor(frameRate()), 20, height - 20);
	pop();
}

// Call this when entering a scene to reset variables that hold record state
function resetRecVariables() {
	if (par.debug) console.log('Resetting play heads');
	full = false;
	rec = false;
	preroll = false;
	play = false;
	phase = 0.0;
}

function getNewVideo(loc) {
	sample = createVideo(loc, videoReady);
	sample.volume(0);
	sample.loop();
	sample.size(627, 470);
	sample.hide();
}

function videoReady() {
	if (par.debug) console.log('Video Ready');
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		// console.log('Poses Ready')
		poses = results;
	});
}

function remap(point, range, dim, padding) {
	// console.log('remap',point, range, dim, padding)
	return map(point, 0, range, padding, dim - padding);
}

// remapPosenet(p, sample.width, sample.height, width, height, par.padding),
function remapPosenetToArray(point, rWidth, rHeight, cWidth, cHeight, padding) {
	// console.log('remapPosenetToArray',point, rWidth, rHeight, cWidth, cHeight, padding)
	let newX = map(point.position.x, 0, rWidth, padding, cWidth - padding);
	let newY = map(point.position.y, 0, rHeight, padding, cHeight - padding);
	return [newX, newY];
}
