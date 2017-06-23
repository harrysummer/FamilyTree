const fontkit = require('fontkit');
const yaml = require('js-yaml');
const fs = require('fs');
const cp = require('child_process');
const mkdirp = require('mkdirp');

let data = null;
try {
    data = yaml.safeLoad(fs.readFileSync(__dirname + '/data/hong.yaml', 'utf8'));
} catch(e) {
    console.log(e);
    process.exit(-1);
}

let titleTexts = "";
let titleTextSet = {};
for (let i = 0; i < data.Family.Title.length; ++i) {
    titleTextSet[data.Family.Title[i]] = true;
}
for (let c in titleTextSet)
    titleTexts += c;
titleTextSet = null;

let nameTexts = "";
let nameTextSet = {};
for (let i = 0; i < data.Family.Members.length; ++i) {
    let name = data.Family.Members[i].Name;
    if (name) {
        for (let j = 0; j < name.length; ++j) {
            nameTextSet[name[j]] = true;
        }
    }
}
for (let c in nameTextSet)
    nameTexts += c;
nameTextSet = null;

let outPath = `${__dirname}/dist/fonts`;
if (!fs.existsSync(outPath)) {
    mkdirp.sync(outPath);
}
let cmd = 'pyftsubset';
let args_otf = [
    `${__dirname}/data/SourceHanSerifCN-Bold.otf`,
    `--text='${titleTexts}'`,
    `--output-file=${__dirname}/dist/fonts/SourceHanSerifCN-Bold.otf`
];
let args_woff = [
    `${__dirname}/data/SourceHanSerifCN-Bold.otf`,
    `--text='${titleTexts}'`,
    `--output-file=${__dirname}/dist/fonts/SourceHanSerifCN-Bold.woff`,
    '--flavor=woff',
    '--with-zopfli'
];
let args_woff2 = [
    `${__dirname}/data/SourceHanSerifCN-Bold.otf`,
    `--text='${titleTexts}'`,
    `--output-file=${__dirname}/dist/fonts/SourceHanSerifCN-Bold.woff2`,
    '--flavor=woff2',
    '--with-zopfli'
];
let process = cp.spawn(cmd, args_woff, {cwd: __dirname});
process.stdout.on('data', (data)=>console.log(`STDOUT: ${data}`));
process.stderr.on('data', (data)=>console.log(`STDERR: ${data}`));
process.on('exit', (code)=>console.log('Child process exited with code ' + code));

process = cp.spawn(cmd, args_woff2, {cwd: __dirname});
process.stdout.on('data', (data)=>console.log(`STDOUT: ${data}`));
process.stderr.on('data', (data)=>console.log(`STDERR: ${data}`));
process.on('exit', (code)=>console.log('Child process exited with code ' + code));

process = cp.spawn(cmd, args_otf, {cwd: __dirname});
process.stdout.on('data', (data)=>console.log(`STDOUT: ${data}`));
process.stderr.on('data', (data)=>console.log(`STDERR: ${data}`));
process.on('exit', (code)=>console.log('Child process exited with code ' + code));
