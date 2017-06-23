const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const mkdirp = require('mkdirp');

function subset(input, text, outputPath, fmt) {
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
    process.on('exit', (code)=> {
        if (code == 0)
            console.log(`${output} font created successfully`);
        else
            console.error(`${output} font creation failed`);
    });
    return process;
}

function makeFont(text, fontName, outputPath) {
    const inputFile = `${__dirname}/data/${fontName}`;
    const ext = path.extname(fontName);
    const baseName = path.basename(fontName, ext);
    if (ext === '.otf' || ext === '.OTF') {
        subset(inputFile, text, outputPath, 'otf')
            .on('exit', (code) => {
                if (code == 0) {
                    const input = path.join(outputPath, baseName + '.otf');
                    const output = path.join(outputPath,  baseName + '.ttf');
                    let process = cp.spawn('fontforge', [
                        '-lang=ff',
                        '-c', 'Open($1);CIDFlatten();Generate($2);Quit(0);',
                        input,
                        output
                    ], {cwd: __dirname});
                    process.stdout.on('data', (data)=>console.log(data.toString('utf8')));
                    process.stderr.on('data', (data)=>console.error(data.toString('utf8')));
                    process.on('exit', (code)=> {
                        if (code == 0)
                            console.log(`${output} created successfully`);
                        else
                            console.error(`${output} creation failed`);
                    });
                }
            });
    } else {
        subset(inputFile, text, outputPath, 'ttf')
    }
    subset(inputFile, text, outputPath, 'woff');
    subset(inputFile, text, outputPath, 'woff2');
}

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

makeFont(titleTexts, 'SourceHanSerifCN-Bold.otf', __dirname + '/dist/fonts');
makeFont(nameTexts, 'FZKTK.TTF', __dirname + '/dist/fonts');
