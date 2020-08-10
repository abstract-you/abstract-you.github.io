class Anchor {
	constructor(x, y, part) {
		this.position = createVector(x, y);
		this.target = createVector(x, y);
		this.vel = p5.Vector.random2D();
		this.acc = createVector();
		this.referenceShapeRadius = 12;
		this.part = part;
		this.zoff = 0.0;
		this.phase = 0.0;
		this.starXOff = 0.0;
		this.starYOff = 0.0;
		this.seed1 = random(1000);
		this.seed2 = random(1000);
		this.seed3 = random(1000);
		this.topSpeed = par.topSpeed;
		this.maxAcc = par.maxAcc;
	}

	update() {
		this.position.add(this.vel);
		this.vel.add(this.acc);
		this.acc.mult(0);
	}

	show() {
		push();
		noStroke();
		fill('red');
		let localRadius;
		if (
			this.part[0] === 'leftEye' ||
			this.part[0] === 'rightEye' ||
			this.part[0] === 'nose' ||
			this.part[0] === 'leftEar' ||
			this.part[0] === 'rightEar'
		) {
			localRadius = this.referenceShapeRadius;
		} else {
			localRadius = this.referenceShapeRadius * 0.8;
		}
		ellipse(this.position.x, this.position.y, localRadius);
		pop();
	}

	addVertex() {
		curveVertex(this.position.x, this.position.y);
	}

	setTarget(v) {
		this.target = v;
	}

	// Runs behaviors
	behaviors() {
		let goto = this.arrive(this.target);
		this.applyForce(goto);
	}

	// Applies forces returned by the bejavior functions
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

	blobify() {
		let px = this.position.x;
		let py = this.position.y;
		let x, y;
		let newArr = [];

		for (let a = 0; a < 360; a += par.angles) {
			let xoff = map(cos(a + this.phase), -1, 1, 0, par.maxY);
			let yoff = map(sin(a + this.phase), -1, 1, 0, par.maxX);

			noiseSeed(this.seed1);
			let n = noise(xoff, yoff, this.zoff);

			let r = map(n, 0, 1, par.minRadius, par.maxRadius);

			x = px + r * cos(a);
			y = py + r * sin(a);

			newArr.push([x, y]);
		}
		this.phase += par.maxPhaseShift;
		this.zoff = par.maxZOff;
		return newArr;
	}

	starify(effect=1) {
		let x = this.position.x;
		let y = this.position.y;
		let newArr = [];

		let offStep = 0.01;
		let radius1 = par.internalRadius * effect;
		let radius2 = par.externalRadius * effect;
		let npoints = par.starPoints;

		push();
		angleMode(RADIANS);
		let angle = TWO_PI / npoints;
		let halfAngle = angle / 2.0;
		for (let a = 0; a < TWO_PI; a += angle) {
			noiseSeed(this.seed2);
			let sx =
				map(noise(this.starXOff, this.starYOff), 0, 1, -5, 5) +
				x +
				cos(a) * radius2;
			// this.starXOff += offStep;
			noiseSeed(this.seed3);
			let sy =
				map(noise(this.starXOff, this.starYOff), 0, 1, -5, 5) +
				y +
				sin(a) * radius2;
			// this.starYOff += offStep;
			newArr.push([sx, sy]);
			sx = x + cos(a + halfAngle) * radius1;
			sy = y + sin(a + halfAngle) * radius1;
			newArr.push([sx, sy]);
		}
		pop();
		return newArr;
	}
}
