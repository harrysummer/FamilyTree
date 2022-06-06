import yaml from 'js-yaml';
import { join, basename, extname } from 'path';
import { existsSync, renameSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import mkdirp from 'mkdirp';

const __dirname = dirname(fileURLToPath(import.meta.url));

function subset(input, text, outputPath, fmt) {
    return new Promise(function (resolve, reject) {
        if (!existsSync(outputPath)) {
            mkdirp(outputPath);
        }
        let output = join(outputPath, basename(input, extname(input)) + '.' + fmt);
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
        let process = spawn(cmd, args, {cwd: __dirname});
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
        let process = spawn('python', [
            'otf2ttf.py',
            '-o', output,
            '--overwrite',
            input
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

async function makeFont(text, fontName, outputPath) {
    const inputFile = `${__dirname}/data/${fontName}`;
    const ext = extname(fontName);
    const baseName = basename(fontName, ext);

    if (ext === '.otf' || ext === '.OTF') {
        await subset(inputFile, text, outputPath, 'otf');
        await OTF2TTF(join(outputPath, baseName + '.otf'), join(outputPath, baseName + '.ttf'));
    } else {
        await subset(inputFile, text, outputPath, 'ttf');
    }
    await subset(join(outputPath, baseName + '.ttf'), text, outputPath, 'woff');
    await subset(join(outputPath, baseName + '.ttf'), text, outputPath, 'woff2');
}

async function mergeAndMakeFont(text, fontNames, outputPath, outputName) {
    const files = await Promise.all(fontNames.map(async fontName => {
        const inputFile = `${__dirname}/data/${fontName}`;
        const ext = extname(fontName);
        const baseName = basename(fontName, ext);
        const outputFile = join(outputPath, baseName + '.ttf');
        if (ext === '.otf' || ext === '.OTF') {
            await subset(inputFile, text, outputPath, 'otf');
            await OTF2TTF(join(outputPath, baseName + '.otf'), join(outputPath, baseName + '.ttf'));
        } else {
            await subset(inputFile, text, outputPath, 'ttf');
        }
        return join(outputPath, baseName + '.ttf');
    }));
    await new Promise((resolve, reject) => {
        let process = spawn('pyftmerge', files, { cwd: __dirname });
        process.stdout.on('data', (data) => console.log(data.toString('utf8')));
        process.stderr.on('data', (data_1) => console.error(data_1.toString('utf8')));
        process.on('exit', (code) => {
            if (code == 0) {
                console.log(`font merge successfully`);
                resolve();
            } else {
                reject(`font merge failed`);
            }
        });
    });
    renameSync(join(__dirname, 'merged.ttf'), join(outputPath, outputName + '.ttf'));
    await subset(join(outputPath, outputName + '.ttf'), text, outputPath, 'woff');
    await subset(join(outputPath, outputName + '.ttf'), text, outputPath, 'woff2');
}

function addStringToSet(S, str) {
    for (let c of str) {
        S[c] = true;
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
    data = yaml.load(readFileSync(__dirname + '/data/hong.yaml', 'utf8'));
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
otherTextSet = addStringToSet(otherTextSet, "始祖一二三四五六七八九十世夫妻元继嗣祧养回首页上溯一代显示到七世孙显示所有后代");
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
    .then(() => makeFont(nameTexts, 'FZKTK.TTF', __dirname + '/dist/fonts'))
    .then(() => mergeAndMakeFont(nameTexts, ['TH-Khaai-TP0.ttf','TH-Khaai-TP2.ttf', 'TH-Khaai-PUA.ttf'], __dirname + '/dist/fonts', 'TH-Khaai'))
    .catch(e => {
        console.error(e);
    });
