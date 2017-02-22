var fs = require('fs'),
    path = require('path');

function getDirectories(srcpath) {

  return fs.readdirSync(srcpath).map(function(file) {
	var dir = path.join(srcpath, file);
	try {
	    if (!fs.statSync(dir).isDirectory())
	    	return null;

		return fs.readdirSync(dir).reduce((acc, cur) => {
					var subdir = path.join(dir, cur);
					var stat = fs.statSync(subdir);
					if (stat.isDirectory(subdir)) {
						acc.dir_count++;
						dirs.push(cur);
					}
					else {
						acc.file_count++;
						acc.file_size += Math.round(stat.size / 1024 / 1024);
					}
					return acc;
		        }, {
				path : dir,
		        	file_count : 0,
		        	file_size : 0,
		        	dir_count : 0,
				dirs : []
		        });

	}
	catch (err) {
		return err;
	}
  });
}

var dirs = getDirectories(process.argv[2] || 'd:/');

dirs.filter(d => d && d.dir_count > 0).reduce((acc, cur) => {
if (cur)
console.log('with subfolder ' + cur.path);
}, null);

dirs.filter(d => d && d.dir_count == 0 && d.file_size < 100).reduce((acc, cur) => {

var spawn = require('child_process').spawn;
    var proc = spawn('cmd',  ['/c', 'rmdir', '/q', '/s', cur.path]);

  

    proc.on('close', function (code) {
	if (code)
        	console.log('error delete exit code ' + code + ' ' + cur.path);
	else
		console.log('deleted ' + cur.path);
    });

});

