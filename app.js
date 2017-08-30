var express = require('express');
var Tree = require('./src/tree');
var layout = require('./src/layout');
var svg = require('./src/svg');
var util = require('./src/util');

var tree = Tree.parseDataFile(__dirname + '/data/hong.yaml');

var canvas = svg.createCanvas();
layout.prepareTree(canvas, tree);

var layoutInfo = layout.layoutTree(canvas, tree);

svg.drawLayout(canvas, layoutInfo);
var svgStr = canvas.svg();
svg.deleteCanvas(canvas);

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
    var subtree = Tree.subtree(tree, parseInt(req.params.id));
    var canvas = svg.createCanvas();
    var layoutInfo = layout.layoutTree(canvas, subtree);
    svg.drawLayout(canvas, layoutInfo, {
        drawTitle: false,
        drawSubtitle: false,
        drawToolbar: true
    });
    var svgStr = canvas.svg();
    svg.deleteCanvas(canvas);

    res.render('index', {
        title: tree.data.Family.Title + ' - ' + util.zhGeneration(subtree.getRoot().depth) + subtree.getRoot().name + "公后代",
        svg: svgStr
    });
});

app.get('/tree/:id/depth/:depth', function(req, res, next) {
    var subtree = Tree.subtree(tree, parseInt(req.params.id), parseInt(req.params.depth));
    var canvas = svg.createCanvas();
    var layoutInfo = layout.layoutTree(canvas, subtree);
    layoutInfo.depthLimit = parseInt(req.params.depth);
    svg.drawLayout(canvas, layoutInfo, {
        drawTitle: false,
        drawSubtitle: false,
        drawToolbar: true
    });
    var svgStr = canvas.svg();
    svg.deleteCanvas(canvas);

    res.render('index', {
        title: tree.data.Family.Title + ' - ' + util.zhGeneration(subtree.getRoot().depth) + subtree.getRoot().name + "公后代（" + util.zhNumber(parseInt(req.params.depth)) + "代以内）",
        svg: svgStr
    });
});

app.use('/fonts/', express.static(__dirname + '/dist/fonts'));
app.use('/', express.static(__dirname + '/assets'));

app.listen(3333, "127.0.0.1", function() {
    console.log('Website listening on port 3333');
});
