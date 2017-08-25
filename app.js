require('babel-polyfill');
var fs = require('fs');
var express = require('express');
var yaml = require('js-yaml');
const window = require('svgdom')
    .setFontDir('./dist/fonts')
    .setFontFamilyMappings({
        'Song': 'SourceHanSerifCN-Bold.ttf',
        'Hei': 'SourceHanSansSC-Regular.ttf',
        'Kai': 'FZKTK.ttf'
    })
    .preloadFonts();
const SVG = require('svg.js')(window);
const document = window.document;

var data;
try {
    data = yaml.safeLoad(fs.readFileSync(__dirname + '/data/hong.yaml', 'utf8'));
} catch(e) {
    console.log(e);
    process.exit(-1);
}




var app = express();
app.set('views', __dirname + '/src/views');
app.set('view engine', 'pug');

app.get('/', function(req, res) {
    res.render('index', {
        title: data.Family.Title,
        subtitle: data.Family.Subtitle,
	comment: data.Family.Comment.replace(/\n/g, "\\n"),
        family: data.Family.Members,
        detail: data.Family.Details,
	changelog: data.Family.Changelog.replace(/\n/g, "\\n")
    });
});

app.use('/fonts/', express.static(__dirname + '/dist/fonts'));
app.use('/', express.static(__dirname + '/assets'));

app.listen(3333, "127.0.0.1", function() {
    console.log('Website listening on port 3333');
});
