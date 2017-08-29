const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const mkdirp = require('mkdirp');
var Promise = require("bluebird");

function subset(input, text, outputPath, fmt) {
    return new Promise(function (resolve, reject) {
        if (!fs.existsSync(outputPath)) {
            mkdirp.sync(outputPath);
        }
        let output = path.join(outputPath, path.basename(input, path.extname(input)) + '.' + fmt);
        let cmd = 'pyftsubset';
        let args = [
            input,
            `--text='${text}'`,
            `--output-file=${output}`
        ];
        if (fmt === 'woff') {
            args.push('--flavor=woff');
            args.push('--with-zopfli');
        } else if (fmt === 'woff2') {
            args.push('--flavor=woff2');
            args.push('--with-zopfli');
        }
        let process = cp.spawn(cmd, args, {cwd: __dirname});
        process.stdout.on('data', (data)=>console.log(data.toString('utf8')));
        process.stderr.on('data', (data)=>console.error(data.toString('utf8')));
        process.on('exit', (code) => {
            if (code == 0) {
                console.log(`${output} font created successfully`);
                resolve();
            } else {
                reject(`${output} font creation failed`);
            }
        });
    });
}

function OTF2TTF(input, output) {
    return new Promise(function (resolve, reject) {
        let process = cp.spawn('fontforge', [
            '-lang=ff',
            '-c', 'Open($1);CIDFlatten();Generate($2);Quit(0);',
            input,
            output
        ], {cwd: __dirname});
        process.stdout.on('data', (data)=>console.log(data.toString('utf8')));
        process.stderr.on('data', (data)=>console.error(data.toString('utf8')));
        process.on('exit', (code) => {
            if (code == 0) {
                console.log(`${output} created successfully`);
                resolve();
            } else {
                reject(`${output} creation failed`);
            }
        });
    });
}

function makeFont(text, fontName, outputPath) {
    const inputFile = `${__dirname}/data/${fontName}`;
    const ext = path.extname(fontName);
    const baseName = path.basename(fontName, ext);
    const outputFile = path.join(outputPath,  baseName + '.ttf');

    var p = Promise.resolve();
    if (ext === '.otf' || ext === '.OTF') {
        p = p
            .then(() => subset(inputFile, text, outputPath, 'otf'))
            .then(() => OTF2TTF(path.join(outputPath, baseName + '.otf'), path.join(outputPath, baseName + '.ttf')));
    } else {
        p = p.then(() => subset(inputFile, text, outputPath, 'ttf'));
    }
    return p
        .then(() => subset(path.join(outputPath, baseName + '.ttf'), text, outputPath, 'woff'))
        .then(() => subset(path.join(outputPath, baseName + '.ttf'), text, outputPath, 'woff2'));
}

function mergeAndMakeFont(text, fontNames, outputPath, outputName) {
    return Promise.mapSeries(fontNames, fontName => {
        const inputFile = `${__dirname}/data/${fontName}`;
        const ext = path.extname(fontName);
        const baseName = path.basename(fontName, ext);
        const outputFile = path.join(outputPath,  baseName + '.ttf');
        var p = Promise.resolve();
        if (ext === '.otf' || ext === '.OTF') {
            p = p
                .then(() => subset(inputFile, text, outputPath, 'otf'))
                .then(() => OTF2TTF(path.join(outputPath, baseName + '.otf'), path.join(outputPath, baseName + '.ttf')));
        } else {
            p = p.then(() => subset(inputFile, text, outputPath, 'ttf'));
        }
        return p.then(() => path.join(outputPath, baseName + '.ttf'));
    })
    .then(files => new Promise((resolve, reject) => {
        let process = cp.spawn('pyftmerge', files, {cwd: __dirname});
        process.stdout.on('data', (data)=>console.log(data.toString('utf8')));
        process.stderr.on('data', (data)=>console.error(data.toString('utf8')));
        process.on('exit', (code) => {
            if (code == 0) {
                console.log(`font merge successfully`);
                resolve();
            } else {
                reject(`font merge failed`);
            }
        });
    }))
    .then(() => fs.renameSync(path.join(__dirname, 'merged.ttf'), path.join(outputPath, outputName + '.ttf')))
    .then(() => subset(path.join(outputPath, outputName + '.ttf'), text, outputPath, 'woff'))
    .then(() => subset(path.join(outputPath, outputName + '.ttf'), text, outputPath, 'woff2'));
}

function addStringToSet(S, str) {
    for (let i = 0; i < str.length; ++i) {
        S[str[i]] = true;
    }
    return S;
}

function convertSetToString(S) {
    let ret = "";
    for (let c in S) {
        ret += c;
    }
    return ret;
}

function uniqueString(str) {
    return convertSetToString(addStringToSet({}, str));
}

let data = null;
try {
    data = yaml.safeLoad(fs.readFileSync(__dirname + '/data/hong.yaml', 'utf8'));
} catch(e) {
    console.log(e);
    process.exit(-1);
}

let titleTexts = uniqueString(data.Family.Title);

let nameTextSet = {};
for (let i = 0; i < data.Family.Members.length; ++i) {
    let name = data.Family.Members[i].Name;
    if (name) {
        nameTextSet = addStringToSet(nameTextSet, name);
    }
}
let nameTexts = convertSetToString(nameTextSet);

let otherTextSet = {};
otherTextSet = addStringToSet(otherTextSet, "始祖一二三四五六七八九十世夫妻元继嗣祧养");
otherTextSet = addStringToSet(otherTextSet, data.Family.Subtitle);
for (let i = 0; i < data.Family.Members.length; ++i) {
    let spouse = data.Family.Members[i].Spouse;
    if (spouse) {
        otherTextSet = addStringToSet(otherTextSet, spouse);
    }
    let note = data.Family.Members[i].Spouse;
    if (note) {
        otherTextSet = addStringToSet(otherTextSet, note);
    }
}

let otherTexts = convertSetToString(otherTextSet);


makeFont(titleTexts, 'SourceHanSerifCN-Bold.otf', __dirname + '/dist/fonts')
    .then(() => makeFont(otherTexts, 'SourceHanSansSC-Regular.otf', __dirname + '/dist/fonts'))
    //.then(() => makeFont(nameTexts, 'FZKTK.TTF', __dirname + '/dist/fonts'))
    .then(() => mergeAndMakeFont(nameTexts, ['TH-Khaai-TP0.ttf','TH-Khaai-TP2.ttf'], __dirname + '/dist/fonts', 'TH-Khaai'))
    .catch(e => {
        console.error(e);
    });
