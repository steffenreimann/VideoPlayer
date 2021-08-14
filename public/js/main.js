/**
 * Screoll Down
 */
function scrolldown() {
	window.scrollTo(0, document.body.scrollHeight);
}

/**
 * get InnerHTML with ID
 * @param {String} elementID Element ID 
 */
function getHTML(elementID) {
	return document.getElementById(elementID).innerHTML;
}

/**
 * @param {String} str String to copy
 */
const copyToClipboard = (str) => {
	const el = document.createElement('textarea');
	el.value = str;
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
};

/**
 * Generate a UUID
 */
function UUID() {
	function ff(s) {
		var pt = (Math.random().toString(16) + '000000000').substr(2, 8);
		return s ? '-' + pt.substr(0, 4) + '-' + pt.substr(4, 4) : pt;
	}
	return ff() + ff(true) + ff(true) + ff();
}

/**
 * @param {number} num Number to Check
 * @param {number} min Min Number
 * @param {number} max Max Number
 */
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * @param {number} fps Frames per Secounds
 * @param {number} time Duration in Seconds
 */
function getNumberOfFrames(fps, time) {
	return fps * time;
}

function calcBitRate(width, height, color, fps) {
	return width * height * color / (8 * 1024) * fps;
}

function BitToByte(data) {
	return b2b / 8;
}

function calcVideoFileSize(VideoBitrate, AudioBitrate, duration) {
	var VideoSize = VideoBitrate * duration;
	var AudioSize = AudioBitrate * duration;
	var out = VideoSize + AudioSize;

	//console.log('VideoBitrate = ', VideoBitrate);
	//console.log('AudioBitrate = ', AudioBitrate);
	//console.log('duration = ', duration);
	//console.log('VideoSize = ', VideoSize);
	//console.log('AudioSize = ', AudioSize);
	//console.log('out = ', out);

	return out;
}

function openPage(pageName, elmnt, color) {
	var i, tabcontent, tablinks;
	console.log(pageName);
	tabcontent = document.getElementsByClassName('tabcontent');
	console.log(tabcontent);
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = 'none';
	}
	tablinks = document.getElementsByClassName('tablink');
	console.log(tablinks);
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].style.backgroundColor = '';
	}
	document.getElementById(pageName).style.display = 'block';
	elmnt.style.backgroundColor = color;
}

// Get the element with id="defaultOpen" and click on it
//document.getElementById("defaultOpen").click();

/**
 * @param {number} value Frames per Secounds
 * @param {number} inputMin Input Value Minimal 
 * @param {number} inputMax Input Value Maximal
 * @param {number} outputMin Output Value Minimal
 * @param {number} outputMax Output Value Maximal
 */
function map(value, inputMin, inputMax, outputMin, outputMax) {
	return outputMin + (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin);
}
