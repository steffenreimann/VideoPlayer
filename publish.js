var fs = require('fs');
var sass = require('node-sass');

function compile(cb) {
	sass.render({ file: 'E:/html-framework/hb-front/main/main.scss' }, function(err, result) {
		console.log('Compile Finished');
		if (err) {
			console.log(err);
		} else {
			fs.writeFile('E:/html-framework/hb-front/main/dist/main.css', result.css, function(err) {
				console.log('New File writed to Disk');
				if (err) {
					console.log(err);
				}
				cb();
			});
		}
	});
}

function copy(cb) {
	fs.copyFile('E:/html-framework/hb-front/main/dist/main.css', 'E:/NodeJS/VideoPlayer/public/hb-front/main.css', (err) => {
		if (err) throw err;

		fs.copyFile('E:/html-framework/hb-front/main/dist/main.dev.js', 'E:/NodeJS/VideoPlayer/public/hb-front/main.dev.js', (err) => {
			if (err) throw err;

			cb();
		});
	});
}

compile(() => {
	copy(() => {
		console.log('Done');
	});
});
console.log('Start');
