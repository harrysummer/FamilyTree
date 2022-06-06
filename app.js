import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseDataFile, subtree as _subtree } from './src/tree.js';
import { prepareTree, layoutTree } from './src/layout.js';
import { createCanvas, drawLayout } from './src/svg.js';
import { zhGeneration, zhNumber } from './src/util.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

var tree = parseDataFile(__dirname + '/data/hong.yaml');

var canvas = createCanvas();
prepareTree(canvas, tree);

var layoutInfo = layoutTree(canvas, tree);

drawLayout(canvas, layoutInfo);
var svgStr = canvas.svg();

var app = express();
app.set('views', __dirname + '/src/views');
app.set('view engine', 'pug');

app.get('/', function(req, res) {
    res.render('index', {
        title: tree.data.Family.Title,
        svg: svgStr
    });
});

app.get('/tree/:id', function(req, res, next) {
    var subtree = _subtree(tree, parseInt(req.params.id));
    var canvas = createCanvas();
    var layoutInfo = layoutTree(canvas, subtree);
    drawLayout(canvas, layoutInfo, {
        drawTitle: false,
        drawSubtitle: false,
        drawToolbar: true,
        drawAncestors: true
    }, tree);
    var svgStr = canvas.svg();

    res.render('index', {
        title:  zhGeneration(subtree.getRoot().depth) + subtree.getRoot().name + "公后代 - " + tree.data.Family.Title,
        svg: svgStr
    });
});

app.get('/tree/:id/depth/:depth', function(req, res, next) {
    var subtree = _subtree(tree, parseInt(req.params.id), parseInt(req.params.depth));
    var canvas = createCanvas();
    var layoutInfo = layoutTree(canvas, subtree);
    layoutInfo.depthLimit = parseInt(req.params.depth);
    drawLayout(canvas, layoutInfo, {
        drawTitle: false,
        drawSubtitle: false,
        drawToolbar: true,
        drawAncestors: true
    }, tree);
    var svgStr = canvas.svg();

    res.render('index', {
        title:  zhGeneration(subtree.getRoot().depth) + subtree.getRoot().name + "公后代（" + zhNumber(parseInt(req.params.depth)) + "代以内） - " + tree.data.Family.Title,
        svg: svgStr
    });
});

app.use('/fonts/', express.static(__dirname + '/dist/fonts'));
app.use('/', express.static(__dirname + '/assets'));

app.listen(3333, "127.0.0.1", function() {
    console.log('Website listening on port 3333');
});
