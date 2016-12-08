
var readlineSync = require('readline-sync');
var fs = require('fs');
var uuid = require('node-uuid');
var dir = process.argv[2] || 'd:/';

if (dir.slice(-1) != '/' && dir.slice(-1) != '\\') 
	dir += '\\';

var reg_time = /^(.+)(\(.+\))\.\w{3,4}$/i;
var reg_part = /^(.+)(_part\d+)\.\w{3,4}$/i;

var files=fs.readdirSync(dir).filter(
    function(file) 
    { 
	var ext = file.substr(-4);
        return ext === '.mp4'
        || ext === '.avi'
        || ext === '.mkv' 
        || ext === '.wmv';
    }
)

var dict_name_uid = [];
var name_ignore = [];

for(var i=0;i<files.length;i++){
    //console.log(files[i]);

    var matches = files[i].match(reg_part);
    
    if (!matches) {
        matches = files[i].match(reg_time);
    }
    // matched text: match[0]
    // match start: match.index
    // capturing group n: match[n]

    var part = '', name = '';
    if (matches) {
        name = matches[1];
        part = matches[2];
    }

    if (name) {

        if (name_ignore.indexOf(name) >= 0)
            continue;
            
        var find = dict_name_uid.filter((d) => d.name === name);

        if (find.length) {
            dict_name_uid.push({name: name, part: part, uid: find[0].uid, file:files[i]});
            //console.log(['a', find[0].uid + part + '.7z', '-p' + find[0].uid,  '-mhe', '-mx0', files[i]].join());
            continue;
        }
    } 

    var guid = uuid.v4().replace(/\-/g,'');

    if (readlineSync.keyInYN('Do you want to rename ' + (name || files[i]))) {
    // 'Y' key was pressed
        
        dict_name_uid.push({name: name, part: part, uid: guid, file:files[i]}); 
        //console.log(['a', guid + part + '.7z', '-p' + guid,  '-mhe', '-mx0', files[i]].join());
    // Do something... 
    } else {
        if (name)
            name_ignore.push(name);
                
        continue; 
    }
}

zip(0);

function zip(idx) {

    if (idx >= dict_name_uid.length)
    {

	 var updateData = dict_name_uid.map((d) => {return [d.file, d.uid + d.part + '.7z'];})
	var sheet = require('./sheet');

	sheet.updateSheet(updateData);
        return;
    }

    var d = dict_name_uid[idx];

    var spawn = require('child_process').spawn;
    var proc = spawn('7za',  ['a', dir + d.uid + d.part + '.7z', 
    '-p' + d.uid,  '-mhe', '-mx0', dir + d.file]);

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', function (data) {
        var str = data.toString();
        var lines = str.split(/(\r?\n)/g).filter((s) => s.indexOf('Creating archive') == 0);
        console.log(lines.join(""));
    });

    proc.on('close', function (code) {
        console.log('process exit code ' + code);

        zip(idx+1);
    });
}