class Anchor {
	constructor(x, y, part) {
		this.position = createVector(x, y);
		this.target = createVector(x, y);
		this.vel = p5.Vector.random2D();
		this.acc = createVector();
		this.referenceShapeRadius = 12;
		this.part = part;
		this.zoff = 0.0;
		this.starPhase = 0.0;
		this.boubaPhase = 0.0;
		this.starXOff = 0.0;
		this.starYOff = 0.0;
		this.ellipseXOff = 0.0;
		this.ellipseYOff = 0.0;
		this.seed = random(1000);
		this.rotation = random([1, 0]);
		// this.blobSeed = random(1000);
		// this.starSeed1 = random(1000);
		// this.starSeed2 = random(1000);
		this.topSpeed = par.topSpeed;
		this.maxAcc = par.maxAcc;
		this.score = 1;
	}

	update() {
		this.position.add(this.vel);
		this.vel.add(this.acc);
		this.acc.mult(0);
	}

	show() {
		// Probably a very bad idea...
		let webcamWidth = sample.width ? sample.width : 640;
		let webcamHeight = sample.height ? sample.height : 480;
		let x = remap(this.position.x, webcamWidth, width, par.padding);
		let y = remap(this.position.y, webcamHeight, height, par.padding);
		push();
		noStroke();
		fill('pink');
		ellipse(x, y, par.referenceAnchorRadius);
		pop();
	}

	addVertex() {
		curveVertex(this.position.x, this.position.y);
	}

	setTarget(v) {
		this.target = v;
	}

	setScore(s) {
		// if (!this.part === 'nose') {
		this.score = s;
		// }
	}

	behaviors() {
		let goto = this.arrive(this.target);
		this.applyForce(goto);
	}

	applyForce(f) {
		this.acc.add(f);
	}

	seek(target) {
		let desired = p5.Vector.sub(target, this.position);
		desired.setMag(par.topSpeed);
		let steer = p5.Vector.sub(desired, this.vel);
		return steer.limit(par.maxAcc);
	}

	flee(target) {
		let desired = p5.Vector.sub(target, this.position);
		if (desired.mag() < 90) {
			desired.setMag(par.topSpeed);
			// Reverse direction
			desired.mult(-1);
			let steer = p5.Vector.sub(desired, this.vel);
			steer.limit(par.maxAcc);
			return steer;
		} else {
			return createVector(0, 0);
		}
	}

	arrive(target) {
		let desired = p5.Vector.sub(target, this.position);
		let distance = desired.mag();
		let speed = par.topSpeed;
		if (distance < 100) {
			speed = map(distance, 0, 100, 0, par.topSpeed);
		}
		desired.setMag(speed);
		let steer = p5.Vector.sub(desired, this.vel);
		return steer.limit(par.maxAcc);
	}

	neutralExpand(modifier = 1) {
		if (modifier === 0 || this.score < par.minScore) {
			return [];
		}
		let px = this.position.x;
		let py = this.position.y;
		let x, y;
		let newArr = [];
		for (let a = 0; a < 360; a += par.ellipseIncrement) {
			noiseSeed(this.seed);
			let r =
				map(
					noise(this.ellipseXOff, this.ellipseYOff),
					0,
					1,
					par.ellipseMinRadius,
					par.ellipseMaxRadius
				) * modifier;
			x = px + r * cos(a);
			y = py + r * sin(a);
			newArr.push([x, y]);
			this.ellipseXOff += par.ellipseOffsetIncrement;
			this.ellipseYOff += par.ellipseOffsetIncrement;
		}
		return newArr;
	}

	boubaExpand(modifier = 1) {
		if (modifier === 0 || this.score < par.minScore) {
			return [];
		}
		noiseSeed(this.seed);
		modifier = modifier * par.modifierBouba;
		let px = this.position.x;
		let py = this.position.y;
		let x, y;
		let newArr = [];
		let localPhase = this.boubaPhase;

		if (this.rotation) {
			localPhase = -localPhase;
		}

		angleMode(DEGREES);
		for (let a = 0; a < 360; a += par.angleIncBouba) {
			let xoff = map(cos(a), -1, 1, 0, par.maxXNoiseBouba);
			let yoff = map(sin(a), -1, 1, 0, par.maxYNoiseBouba);

			let n = noise(xoff, yoff, this.zoff);
			// let n = osnoise.noise3D(xoff, yoff, this.zoff);

			let r = map(n, 0, 1, par.minRadiusBouba, par.maxRadiusBouba) * modifier;
			x = px + r * cos(a + localPhase);
			y = py + r * sin(a + localPhase);

			newArr.push([x, y]);
		}
		this.boubaPhase += par.phaseShiftBouba;
		this.zoff += par.zOffBouba;
		return newArr;
	}

	kikiExpand(modifier = 1) {
		if (modifier === 0 || this.score < par.minScore) {
			return [];
		}
		noiseSeed(this.seed);
		modifier = modifier * par.modifierKiki;
		let x = this.position.x;
		let y = this.position.y;
		let newArr = [];

		let radius1 = par.starInternalRadius * modifier;
		let radius2 = par.starExternalRadius * modifier;
		let npoints = par.starPoints;
		// return [];

		push();
		angleMode(RADIANS);
		let angle = TWO_PI / npoints;
		let halfAngle = angle / 2.0;
		for (let a = 0; a < TWO_PI; a += angle) {
			let sx =
				map(
					noise(this.starXOff, this.starYOff),
					-1,
					1,
					-par.noiseRangeKiki,
					par.noiseRangeKiki
				) +
				x +
				cos(a - this.starPhase / 2) * radius2;
			this.starXOff += par.xNoiseStepKiki;
			let sy =
				map(
					noise(this.starXOff, this.starYOff),
					-1,
					1,
					-par.noiseRangeKiki,
					par.noiseRangeKiki
				) +
				y +
				sin(a - this.starPhase / 2) * radius2;
			this.starYOff += par.yNoiseStepKiki;
			newArr.push([sx, sy]);
			sx = x + cos(a + halfAngle + this.starPhase) * radius1;
			sy = y + sin(a + halfAngle + this.starPhase) * radius1;
			newArr.push([sx, sy]);
		}
		pop();
		this.starPhase += par.phaseShiftKiki;

		return newArr;
	}

	static chasePose(targets) {
		Object.keys(anchors).forEach((partName, i) => {
			let anchor = anchors[partName];
			if (targets[i]) {
				anchor.setTarget(
					createVector(targets[i].position.x, targets[i].position.y)
				);
			} else {
				anchor.setTarget(
					createVector(targets[0].position.x, targets[0].position.y)
				);
			}
			anchor.setScore(targets[i].score);
			anchor.behaviors();
			anchor.update();
			if (par.showAnchors || par.debug) anchor.show();
		});
	}
	static refreshAnchors() {
		Object.keys(anchors).forEach((partName, i) => {
			let anchor = anchors[partName];
			anchor.behaviors();
			anchor.update();
			if (par.showAnchors) anchor.show();
		});
	}
}
