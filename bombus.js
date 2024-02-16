"use strict";
(() => {
let
	buzzing = false,
	petting = false,
	minDist = 100,
	queen = document.createElementNS("http://www.w3.org/2000/svg", "use"),
	workers = Math.max(5, Math.min(100, visualViewport.width * visualViewport.height / 80000)),
	timing = 1000 / 60, gate = ~~(timing), maxCorrection = Math.min(8, Math.max(2, gate/timing + 1)), 
	garden, beesknees, hive = [], touch = { x: Infinity, y: Infinity }, then, elapsed,
	request, reqFrame = window.requestAnimationFrame || ((cb) => { return window.setTimeout(cb, 1000 / 60) }), canFrame = window.cancelAnimationFrame || ((i) => { clearTimeout(i) });

class Bombus {
	#el;
	#buzzing = true;
	#size = (Math.random() * 10) + 20;
	#x = Math.floor(Math.random() * visualViewport.width);
	#y = Math.floor(Math.random() * visualViewport.height);
	#center = { x: this.#x, y: this.#y };
	#direction = { x: 0, y: 0 };
	#flipped = Math.random() > .5;
	#touchDistance = Infinity;
	#velocity = { x: 0, y: 0, absolute: 0, force: 0 };
	#oscilation = {
		step: 0,
		size: Math.random() / 10,
		delta: Math.random() / 40 + 0.1
	};
	constructor(queen) {
		this.#el = queen.cloneNode(true)
		this.#el.setAttribute("href", "#" + beesknees[Math.ceil((Math.random() * beesknees.length) - 1)].id);
		this.#el.setAttribute("width", ~~this.#size);
		this.#el.setAttribute("height", ~~this.#size);
		garden.appendChild(this.#el);

		let speed = Math.random() * 1.2 + 0.5;

		this.#direction.x = this.#velocity.x = speed;
		this.#direction.y = this.#velocity.y = speed / 3 * (Math.random() > .5 ? 1 : -1);

		if (this.#flipped)
			this.#el.classList.add("flip");

		this.fly(1);
	}

	fly(multiplier) {
		if (this.#buzzing) {
			this.#accelerate(multiplier);
			this.#move(multiplier);
		}
	}

	#accelerate(multiplier) {
		if (petting) {
			if (this.#flipped) {
				this.#touchDistance = Math.sqrt(Math.pow(visualViewport.width - this.#center.x - touch.x, 2) + Math.pow(this.#center.y - touch.y, 2));
				if (this.#touchDistance < minDist) {
					this.#velocity.force = Math.min(.1, minDist / Math.pow(this.#touchDistance, 2) * 5);
					this.#velocity.x += ((touch.x - (visualViewport.width - this.#center.x)) / this.#touchDistance) * this.#velocity.force * multiplier;
					this.#velocity.y -= ((touch.y - this.#center.y) / this.#touchDistance) * this.#velocity.force * 2 * multiplier;
				}
			} else {
				this.#touchDistance = Math.sqrt(Math.pow(this.#center.x - touch.x, 2) + Math.pow(this.#center.y - touch.y, 2));
				if (this.#touchDistance < minDist) {
					this.#velocity.force = Math.min(.1, minDist / Math.pow(this.#touchDistance, 2) * 5);
					this.#velocity.x -= ((touch.x - this.#center.x) / this.#touchDistance) * this.#velocity.force / 2 * multiplier;
					this.#velocity.y -= ((touch.y - this.#center.y) / this.#touchDistance) * this.#velocity.force * multiplier;
				}
			}
		}

		this.#velocity.y -= Math.cos(this.#oscilation.step += this.#oscilation.delta * (.5 + Math.random())) * this.#oscilation.size * multiplier;

		this.#velocity.x = this.#velocity.x * .99 + Math.abs(this.#direction.x) * (this.#velocity.x > this.#direction.x ? -.01 : .01);
		this.#velocity.y = this.#velocity.y * .99 + Math.abs(this.#direction.y) * (this.#velocity.y > this.#direction.y ? -.01 : .01);
	}

	#move(multiplier) {
		if (this.#y + 50 < -this.#size) {
			this.#y = visualViewport.height;
			this.#velocity.y = this.#direction.y
		} else if (this.#y - 50 > visualViewport.height) {
			this.#y = -this.#size;
			this.#velocity.x = this.#direction.x
		}

		if (this.#x + 50 < -this.size) {
			this.#x = visualViewport.width;
			this.#velocity.x = this.#direction.x;
		} else if (this.#x - 50 > visualViewport.width) {
			this.#x = -this.#size;
			this.#velocity.y = this.#direction.y
		}

		this.#velocity.absolute = Math.abs(this.#velocity.x) + Math.abs(this.#velocity.y);

		if (this.#velocity.absolute > 3) {
			this.#velocity.x /= this.#velocity.absolute / 1.5;
			this.#velocity.y /= this.#velocity.absolute / 1.5;
		}

		this.#y += this.#velocity.y * multiplier;
		this.#x += this.#velocity.x * multiplier;

		this.#el.setAttribute("x", ~~this.#x);
		this.#el.setAttribute("y", ~~this.#y);

		this.#center.x = this.#x + this.#size / 2;
		this.#center.y = this.#y + this.#size / 2;
	}

	sleep() {
		this.#buzzing = false;
		garden.removeChild(this.#el);
	}
}


function fly(multiplier) {
	multiplier = Math.min(maxCorrection, multiplier);
	hive.forEach(worker => {
		worker.fly(multiplier);
	});
};

function animate(now) {
	elapsed = now - then;

	if (elapsed > gate) {
		then = now;
		fly(elapsed / timing);
	} else {
		canFrame(request)
	}

	if (buzzing) {
		request = reqFrame(animate);
	}
}

function init() {
	if (!garden) {
		garden = document.querySelector("svg#bb-garden");
		beesknees = garden.querySelectorAll("symbol");
		document.addEventListener("pointermove", (e) => {
			petting = true;
			touch.x = e.clientX;
			touch.y = e.clientY;
		});
		document.addEventListener("pointerout", () => { petting = false; });
	}

	if (!buzzing) {
		buzzing = true;
		then = document.timeline.currentTime;
		request = reqFrame(animate);
	}
}

window.bombus = {
	summer: function (bees = workers) {
		init();
		for (let i = 0; i < bees; i++) {
			hive.push(new Bombus(queen));
		}
	},
	winter: function () {
		buzzing = false;
		hive.forEach((worker) => {
			worker.sleep();
		});
		hive = [];
	},
	bps: function (bps) {
		gate = ~~(1000 / bps)
		maxCorrection = Math.min(8, Math.max(2, gate/timing + 1));
	}
};
})()
