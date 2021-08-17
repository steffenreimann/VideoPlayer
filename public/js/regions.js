var regions = document.getElementsByClassName('region');

Object.keys(regions).forEach(function(regionId) {
	var regionWrapper = regions[regionId];
	let bg = document.createElement('div');
	bg.classList.add('bg');
	regionWrapper.appendChild(bg);

	var mousePosi = { x: 0, y: 0 };
	var mouseDownPosi = { x: 0, y: 0 };
	var currentRegion;
	bg.addEventListener('mousemove', function(e) {
		mousePosi.x = e.offsetX;
		mousePosi.y = e.offsetY;

		//console.log('mousemove = ', e.offsetX);
		//console.log(e.offsetX / regionWrapper.offsetWidth * 100);
		if (currentRegion) {
			currentRegion.change(regionWrapper, currentRegion.initPosi, mousePosi.x);
		}
	});
	bg.addEventListener('mousedown', function(e) {
		console.log('mousedown = ', e);
		mouseDownPosi.x = e.offsetX;
		if (currentRegion) {
			currentRegion.classList.remove('newRegion');
		}
		//currentRegion = addRegion(regionWrapper, mousePosi.x, mousePosi.x);
		currentRegion = new Region(regionWrapper, mousePosi.x, mousePosi.x);
		currentRegion.init();
	});

	bg.addEventListener('mouseup', function(e) {
		console.log('mouseup = ', e);
		console.log('region.style.wdith = ', regionWrapper.offsetWidth);
		currentRegion.wrapper.classList.remove('newRegion');
		currentRegion = null;
		//newRegion.style.right = region.offsetWidth - mousePosi.x + 'px';
	});
});

var mousePosi = { x: 0, y: 0 };
document.addEventListener('mousemove', (event) => {
	//console.log(`Mouse X: ${event.clientX}, Mouse Y: ${event.clientY}`);
	mousePosi.x = event.clientX;
	mousePosi.y = event.clientY;
});

class Region {
	constructor(regionsContainer) {
		this.regionsContainer = regionsContainer;
		this.wrapper = document.createElement('div');
		this.wrapperHead = document.createElement('div');
		this.wrapperLeft = document.createElement('div');
		this.wrapperRight = document.createElement('div');

		this.wrapper.classList.add('region1');
		this.wrapper.classList.add('newRegion');

		this.wrapperHead.classList.add('RegionHead');
		this.wrapperLeft.classList.add('RegionLeft');
		this.wrapperRight.classList.add('RegionRight');

		this.wrapper.appendChild(this.wrapperHead);
		this.wrapper.appendChild(this.wrapperLeft);
		this.wrapper.appendChild(this.wrapperRight);

		regionsContainer.appendChild(this.wrapper);

		this.duration = 0;
		this.startPoint = 0;
		this.endPoint = 0;
		// Calculate init Position
		this.initPosi = mousePosi.x - getPosition(regionsContainer).x;

		var procent1 = this.initPosi / regionsContainer.offsetWidth * 100;

		this.wrapper.style.left = procent1 + '%';

		console.log('New Region this.initPosi = ', this.initPosi);
	}

	init() {
		console.log('init this= ', this);
		var that = this;
		this.mouseID = -1;
		//Assign events
		this.wrapperHead.addEventListener('mousedown', function(e) {
			console.log(`RegionHead.mousedown `, this.mouseID);
			if (that.mouseID == -1) {
				that.mouseID = setInterval(function(params) {
					that.move(e.offsetX);
				}, 10 /*execute every 100ms*/);
			} else {
				clearInterval(that.mouseID);
				that.mouseID = -1;
			}
		});
		this.wrapperHead.addEventListener('mouseup', function(params) {
			if (that.mouseID != -1) {
				clearInterval(that.mouseID);
				that.mouseID = -1;
			}
		});

		this.wrapperLeft.addEventListener('mousedown', function(e) {
			console.log(`RegionLeft.mousedown `, this.mouseID);
			if (that.mouseID == -1) {
				that.mouseID = setInterval(function(params) {
					console.log('Left move = ', e.offsetX);
					that.moveStart(e.offsetX);
				}, 10 /*execute every 100ms*/);
			} else {
				clearInterval(that.mouseID);
				that.mouseID = -1;
			}
		});

		this.wrapperLeft.addEventListener('mouseup', function(params) {
			if (that.mouseID != -1) {
				clearInterval(that.mouseID);
				that.mouseID = -1;
			}
		});
	}

	changePointer(bool) {
		if (!bool) {
			this.wrapperHead.style.pointerEvents = 'none';
			this.wrapperLeft.style.pointerEvents = 'none';
			this.wrapperRight.style.pointerEvents = 'none';
		} else {
			this.wrapperHead.style.pointerEvents = 'all';
			this.wrapperLeft.style.pointerEvents = 'all';
			this.wrapperRight.style.pointerEvents = 'all';
		}
	}

	change(regionsContainer, value1, value2) {
		var procent1 = value1 / regionsContainer.offsetWidth * 100;
		var procent2 = value2 / regionsContainer.offsetWidth * 100;

		console.log(`this.duration = ${this.duration}, procent1 = ${procent1}, procent2 = ${procent2}`);
		if (procent1 < procent2) {
			this.wrapper.style.left = procent1 + '%';
			this.wrapper.style.right = 100 - procent2 + '%';
			this.startPoint = procent1;
			this.endPoint = procent2;
			this.duration = 100 - (100 - procent2 + procent1);
		} else {
			this.wrapper.style.left = procent2 + '%';
			this.wrapper.style.right = 100 - procent1 + '%';
			this.startPoint = procent2;
			this.endPoint = procent1;
			this.duration = 100 - (100 - procent1 + procent2);
		}
	}
	move(clickPosiXonElement) {
		var procent1 = (mousePosi.x - clickPosiXonElement - getPosition(this.regionsContainer).x) / this.regionsContainer.offsetWidth * 100;
		var procent2 = 100 - (procent1 + this.duration);

		this.wrapper.style.left = procent1 + '%';
		this.wrapper.style.right = procent2 + '%';
	}
	moveStart(clickPosiX) {
		console.log('moveStart');

		var procent1 = (mousePosi.x - clickPosiX - getPosition(this.regionsContainer).x) / this.regionsContainer.offsetWidth * 100;
		this.wrapper.style.left = procent1 + '%';

		this.duration = 100 - (this.endPoint + procent1);
		console.log(`this.duration = ${this.duration}`);
	}
	moveEnd(clickPosiXonElement) {
		console.log('moveEnd');
		console.log(this.wrapper.offsetWidth);
		console.log(clickPosiX);

		var procent1 = (mousePosi.x - clickPosiX - getPosition(this.regionsContainer).x) / this.regionsContainer.offsetWidth * 100;
		this.wrapper.style.right = procent1 + '%';
		console.log(procent1);
		this.duration = 100 - (100 - procent2 + procent1);
	}
}

function setPointerEvents(element, value) {
	element.style.pointerEvents = value;
}

function getPosition(el) {
	var xPos = 0;
	var yPos = 0;

	while (el) {
		if (el.tagName == 'BODY') {
			// deal with browser quirks with body/window/document and page scroll
			var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
			var yScroll = el.scrollTop || document.documentElement.scrollTop;

			xPos += el.offsetLeft - xScroll + el.clientLeft;
			yPos += el.offsetTop - yScroll + el.clientTop;
		} else {
			// for all other non-BODY elements
			xPos += el.offsetLeft - el.scrollLeft + el.clientLeft;
			yPos += el.offsetTop - el.scrollTop + el.clientTop;
		}

		el = el.offsetParent;
	}
	return {
		x: xPos,
		y: yPos
	};
}
