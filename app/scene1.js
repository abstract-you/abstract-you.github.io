function scene01() {
	this.enter = function () {
		noseAnchor = '';
		resetRecVariables();
		chooseScene('#scene-01');
		canvas.parent('#canvas-01');
		resizeCanvas(820, 820);
		// resize video for a larger preview this time
		sample.size(627, 470);
		sample.hide();
		vf.parent('#webcam-monitor-01');
		vf.show();
		button = select('#record-button-01');
		button.mousePressed(() => {
			startPreroll();
		});
		// if (par.debug) getNewVideo('assets/01.mp4')
	};

	this.setup = function () {};

	// --1draw
	this.draw = function () {
		vf.background(0);
		background(255);
		translate(width, false);
		scale(-1, 1);

		if (sample) {
			// vs is 500x470 but feed is 627x470
			vf.image(sample, -50, 0);
		}

		if (poses) {
			if (poses[0]) {
				let pose = poses[0].pose.keypoints;

				// Draw skeleton in vf
				if (!preroll) previewSkeleton(poses[0]);

				// Draw pose for reference
				// if (par.showPose) {
				// 	push();
				// 	stroke('red');
				// 	strokeWeight(10);
				// 	pose.forEach(p => {
				// 		point(p.position.x, p.position.y);
				// 	});
				// 	pop();
				// }

				// Draw expanded points for reference
				if (par.showExpanded) {
					push();
					stroke('paleturquoise');
					strokeWeight(5);
					expanded.forEach(p => {
						point(p[0], p[1]);
					});
					pop();
				}

				deriveProportions(pose);

				if (rec) recordPose(pose);

				if (!full) drawShape(pose);
			}
		}

		playPreroll();

		if (play && !preroll) playShape(history1);
		if (par.frameRate) fps();
	};
}

function playShape(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawShape(history);
}

// Draws an outline based on posenet keypoints
function drawShape(points) {
	retargetAnchorsFromPose(points);
	expanded = bodyNet(anchors, par.happy);
	hullSet = hull(expanded, 150);

	// Looks better than endShape(CLOSE)
	hullSet.push(hullSet[1]);
	hullSet.push(hullSet[0]);

	let padded = [];

	// function remap(point, range, dim, padding) {
	// 	return map(point, 0, range, padding, dim - padding);
	// }

	hullSet.forEach(p => {
		padded.push([
			remap(p[0], sample.width, width, par.padding),
			remap(p[1], sample.height, height, par.padding),
		]);
	});

	push();
	stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	padded.forEach(p => {
		curveVertex(p[0], p[1]);
	});

	endShape();
	pop();
}

function bodyNet(pose) {
	let newArr = [];

	// We'll use these later for the torso
	let l1, l2, r1, r2;

	// expandEllipse(point, 50, 50, 52)
	//
	// The first argument is the point to expand
	// The next two arguments are the minimum and maximum radius for the circle
	// (by default both are 50 so the size is fixed. If there's a range, it will
	// slowly move between the two extremes at random)
	// The last argument is the distance between each point in angles
	// (for example, an angle distance of 1 will add 360 points)

	pose.forEach((p, i) => {
		switch (p.part) {
			case 'nose':
				newArr = newArr.concat(expandEllipse(p, 80,95,20));
				break;
			case 'leftEar':
			case 'rightEar':
				newArr = newArr.concat(expandEllipse(p, 20,35));
				break;
			case 'leftEye':
			case 'rightEye':
				break;
			case 'leftShoulder':
				l1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p, 20,35));
				break;
			case 'rightShoulder':
				r1 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p));
				break;
			case 'leftElbow':
			case 'rightElbow':
				newArr = newArr.concat(expandEllipse(p, 70, 96));
				break;
			case 'leftWrist':
			case 'rightWrist':
			case 'leftHip':
				l2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p));
				break;
			case 'rightHip':
				r2 = createVector(p.position.x, p.position.y);
				newArr = newArr.concat(expandEllipse(p, 70, 96, 20));
				break;
			case 'leftKnee':
			case 'rightKnee':
				newArr = newArr.concat(expandEllipse(p, 70, 96, 20));
				break;
			case 'leftAnkle':
			case 'rightAnkle':
			default:
				newArr = newArr.concat(expandEllipse(p));
				break;
		}
	});

	// fill in the torso area so the convex hull algorithm has more to work with
	let leftSide = p5.Vector.lerp(l1, l2, 0.5);
	let rightSide = p5.Vector.lerp(r1, r2, 0.5);
	let middle1 = p5.Vector.lerp(l1, r1, 0.5);
	let middle2 = p5.Vector.lerp(l2, r2, 0.5);

	newArr = newArr.concat(expandEllipseXY(leftSide.x, leftSide.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(rightSide.x, rightSide.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(middle1.x, middle1.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(middle2.x, middle2.y, 50, 50, 54));

	return newArr;
}

function recordPose(points) {
	history1.push(points);
	setCounter(par.framesToRecord - history1.length);
	if (history1.length === par.framesToRecord) finishRecording();
}

function expandEllipseXY(px, py, minr, maxr, angles) {
	if (!angles) angles = 30;
	let newX, newY;
	let newArr = [];
	for (let a = 0; a < 360; a += angles) {
		let r = random(minr, maxr);
		newX = px + r * cos(a);
		newY = py + r * sin(a);
		newArr.push([newX, newY]);
	}
	// cl(newArr)
	return newArr;
}

function expandEllipse(point, minr = 50, maxr = 50, inc = 60) {
	console.log('expandEllipse ', point, minr, maxr, inc);
	let x, y;
	let px, py;
	let newArr = [];
	if (point.position) {
		px = point.position.x;
		py = point.position.y;
	} else if (point[0]) {
		px = point[0];
		py = point[1];
	}
	for (let a = 0; a < 360; a += inc) {
		let offset = (frameCount % 10) / 1000;
		let r = map(noise(offset), 0, 1, minr, maxr);
		x = px + r * cos(a);
		y = py + r * sin(a);
		newArr.push([x, y]);
	}
	// cl(newArr)
	return newArr;
}

function previewSkeleton(pose) {
	let skeleton;
	if (pose) {
		if (pose.skeleton[0]) {
			skeleton = pose.skeleton;

			// For every skeleton, loop through all body connections
			for (let j = 0; j < skeleton.length; j++) {
				let partA = skeleton[j][0];
				let partB = skeleton[j][1];
				vf.push();
				vf.translate(-50, 0);
				vf.stroke('#AFEEEE');
				vf.line(
					partA.position.x,
					partA.position.y,
					partB.position.x,
					partB.position.y
				);
				vf.ellipse(partA.position.x, partA.position.y, 5);
				vf.ellipse(partB.position.x, partB.position.y, 5);
				vf.pop();
			}
		}
	}
}
