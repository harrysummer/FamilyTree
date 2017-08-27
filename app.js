var express = require('express');
var Tree = require('./src/tree');
var layout = require('./src/layout');
var svg = require('./src/svg');

var tree = Tree.parseDataFile(__dirname + '/data/hong.yaml');
//var subtree = Tree.subtree(tree, 0, 7);

var canvas = svg.createCanvas();
layout.prepareTree(canvas, tree);

var layoutInfo = layout.layoutTree(canvas, tree);

svg.drawLayout(canvas, layoutInfo);
var svgStr = canvas.svg();
svg.deleteCanvas(canvas);

// var commentText = paper
//   .text()
//   .move(100, layoutInfo.nodePerLevel[4][layoutInfo.nodePerLevel[4].length-1].y + 200)
//   .addClass('comment');
//   commentText.selectAll('tspan:nth-child(n+2)')
//   .attr({ dy: "1.2em" , x: 100 });
// var commentBBox = commentText.bbox();
// var commentRect = paper
//   .rect(commentBBox.width + 80, commentBBox.height + 80)
//   .move(commentBBox.x - 40, commentBBox.y - 40)
//   .addClass('comment-border');
// content.add(commentRect, commentText);

// var changelogText = paper
//   .text(changelog.split("\n"))
//   .move(100, layoutInfo.nodePerLevel[4][layoutInfo.nodePerLevel[4].length-1].y + 200 + commentBBox.height + 100)
//   .addClass('comment');
//   changelogText.selectAll('tspan:nth-child(n+2)')
//   .attr({ dy: "1.2em" , x: 100 });
// var changelogBBox = changelogText.bbox();
// var changelogRect = paper
//   .rect(changelogBBox.width + 80, changelogBBox.height + 80)
//   .move(changelogBBox.x - 40, changelogBBox.y - 40)
//   .addClass('comment-border');
// content.add(changelogRect, changelogText);

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
        drawTitle: false
    });
    var svgStr = canvas.svg();
    svg.deleteCanvas(canvas);

    res.render('index', {
        title: tree.data.Family.Title,
        svg: svgStr
    });
});

app.get('/tree/:id/depth/:depth', function(req, res, next) {
    var subtree = Tree.subtree(tree, parseInt(req.params.id), parseInt(req.params.depth));
    var canvas = svg.createCanvas();
    var layoutInfo = layout.layoutTree(canvas, subtree);
    svg.drawLayout(canvas, layoutInfo, {
        drawTitle: false
    });
    var svgStr = canvas.svg();
    svg.deleteCanvas(canvas);

    res.render('index', {
        title: tree.data.Family.Title,
        svg: svgStr
    });
});

app.get('/depth/:depth', function(req, res, next) {
    var subtree = Tree.subtree(tree, tree.getRoot().id, parseInt(req.params.depth));
    var canvas = svg.createCanvas();
    var layoutInfo = layout.layoutTree(canvas, subtree);
    svg.drawLayout(canvas, layoutInfo, {
        drawTitle: false
    });
    var svgStr = canvas.svg();
    svg.deleteCanvas(canvas);

    res.render('index', {
        title: tree.data.Family.Title,
        svg: svgStr
    });
});

app.use('/fonts/', express.static(__dirname + '/dist/fonts'));
app.use('/', express.static(__dirname + '/assets'));

app.listen(3333, "127.0.0.1", function() {
    console.log('Website listening on port 3333');
});
