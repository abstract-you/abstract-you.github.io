class Anchor {
	constructor(x, y, p) {
		this.position = createVector(x, y);
		this.target = createVector(x, y);
		this.vel = p5.Vector.random2D();
		this.acc = createVector();
		this.r = 10;
		this.topSpeed = par.topSpeed;
		this.maxForce = par.maxAcc;
		this.part = p;
	}

	update() {
		this.position.add(this.vel);
		this.vel.add(this.acc);
		this.acc.mult(0);
	}

	show() {
		push()
		noStroke();
		fill('mistyrose');
		ellipse(this.position.x, this.position.y, this.r);
		// text(this.part,this.position.x,this.position.y)
		pop()
	}

	addVertex() {
		curveVertex(this.position.x, this.position.y);
	}

	setTarget(v) {
		this.target = v
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
		desired.setMag(this.topSpeed);
		let steer = p5.Vector.sub(desired, this.vel);
		return steer.limit(this.maxForce);
	}

	flee(target) {
		let desired = p5.Vector.sub(target, this.position);
		if (desired.mag() < 90) {
			desired.setMag(this.topSpeed);
			// Reverse direction
			desired.mult(-1);
			let steer = p5.Vector.sub(desired, this.vel);
			steer.limit(this.maxForce);
			return steer;
		} else {
			return createVector(0, 0);
		}
	}

	arrive(target) {
		let desired = p5.Vector.sub(target, this.position);
		let distance = desired.mag();
		let speed = this.topSpeed;
		if (distance < 100) {
			speed = map(distance, 0, 100, 0, this.topSpeed);
		}
		desired.setMag(speed);
		let steer = p5.Vector.sub(desired, this.vel);
		return steer.limit(this.maxForce);
	}

	/**
	 * Gets an array of keypoints from PoseNet
	 * Creates an array of p5 vectors
	 */
	static makeVectorArray(arr) {
		let newArr = [];
		for (const p of arr) {
			let x = p.position.x;
			let y = p.position.y;
			let newP = createVector(p.position.x, p.position.y);
			newP.part = p.part;
			newArr.push(newP);
		}
		return newArr;
	}

	static expandPoints(arr, r) {
		let newArr = [];
		arr.forEach(p => {
			let px = p.x;
			let py = p.y;
			for (let angle = 0; angle < 360; angle += 37) {
				let x = px + r * sin(angle);
				let y = py + r * cos(angle);
				let newP = createVector(x, y);
				newP.px = px;
				newP.py = py;
				newArr.push(newP);
			}
		});
		return newArr;
	}

	static expandHeadPoints(arr, r) {
		let newArr = [];
		arr.forEach(p => {
			if (p.part === 'nose' || p.part === 'leftEye' || p.part === 'rightEye') {
				let px = p.x;
				let py = p.y;
				for (let angle = 0; angle < 360; angle += 37) {
					let x = px + r * sin(angle);
					let y = py + r * cos(angle);
					let newP = createVector(x, y);
					newP.px = px;
					newP.py = py;
					newArr.push(newP);
				}
			} else {
				let newP = createVector(p.x, p.y);
				newP.px = p.x;
				newP.py = p.y;
				newP.part = p.part;
				newArr.push(newP);
			}
		});
		return newArr;
	}
	/**
	 * Get an array of points.
	 * Return points to draw a convex hull around them.
	 */
	static convexHull(points) {
		function removeMiddle(a, b, c) {
			var cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
			var dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
			return cross < 0 || (cross == 0 && dot <= 0);
		}
		points.sort(function (a, b) {
			return a.x != b.x ? a.x - b.x : a.y - b.y;
		});

		var n = points.length;
		var hull = [];

		for (var i = 0; i < 2 * n; i++) {
			var j = i < n ? i : 2 * n - 1 - i;
			while (
				hull.length >= 2 &&
				removeMiddle(hull[hull.length - 2], hull[hull.length - 1], points[j])
			)
				hull.pop();
			hull.push(points[j]);
		}

		hull.pop();
		return hull;
	}
}

/**
 * License for convexhull-js
 *

The MIT License (MIT)

Copyright (c) 2015 Andrey Naumenko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
