require('babel-polyfill');
var fs = require('fs');
var express = require('express');
var yaml = require('js-yaml');
var jiazu = require('./src');
//import { nodesToTree, measureNode, layoutTree, drawNode, drawChildrenLink, drawGeneration, drawDetailButton } from './src';
const window = require('svgdom')
    .setFontDir('./dist/fonts')
    .setFontFamilyMappings({
        'Song': 'SourceHanSerifCN-Bold.ttf',
        'Hei': 'SourceHanSansSC-Regular.ttf',
        'Kai': 'FZKTK.ttf'
    })
    .preloadFonts();

var data;
try {
    data = yaml.safeLoad(fs.readFileSync(__dirname + '/data/hong.yaml', 'utf8'));
} catch(e) {
    console.log(e);
    process.exit(-1);
}

const SVG = require('svg.js')(window);
const document = window.document;
const paper = SVG(document.documentElement);


var treeInfo = jiazu.nodesToTree(data.Family.Members, undefined, undefined, function(d) {
    return d.Name;
}, function(d) {
    ret = [];
    if (d.Alias) {
        ret.push('又名：' + d.Alias);
    }
    if (d.Spouse) {
        if (d.Spouse instanceof Array) {
            var ret = [];
            ret.push('元：' + d.Spouse[0]); 
            ret.push('继：' + d.Spouse[1]);
        } else {
            var prefix = '偶：';
            if (d.Gender && d.Gender === 'M') prefix = '妻：';
            else if (d.Gender && d.Gender === 'F') prefix = '夫：';
            ret.push(prefix + d.Spouse);
        }
    }
    return ret;
});

var root = treeInfo.root;
var id2Index = treeInfo.id2Index;
var members = treeInfo.members;

var layoutInfo = jiazu.layoutTree(paper, members, id2Index);

var generationOffset = layoutInfo.generationOffset;
var size = layoutInfo.size;

var repeat = function(str, n) {
    var ret = "";
    for (var i = 0; i < n; i++)
        ret = ret + str;
    return ret;
};

var titleBar = paper.group();
var title = titleBar
    .text(data.Family.Title)
    .attr('font-family', 'Song')
    .attr('font-size', '72')
    .attr('text-anchor', 'middle')
    .move(size.width / 2, 0)
    .attr('dx', '0' + repeat(' 24', data.Family.Title.length - 1))
    .transform({ scaleX: 1.4 });

var titleHeight = title.bbox().height;
var subtitle = titleBar
    .text(data.Family.Subtitle)
    .attr('font-family', 'Hei')
    .attr('font-size', '24')
    .attr('text-anchor', 'middle')
    .move(size.width / 2, titleHeight + 40);

var content = paper.group().transform({
    x: 0,
    y: titleBar.bbox().height + 70
});

for (var i = 0; i < members.length; i++) {
    jiazu.drawNode(paper, content, members[i]);
}

for (var i = 0; i < members.length; i++) {
    jiazu.drawChildrenLink(paper, content, members[i], treeInfo, layoutInfo);
}

jiazu.drawGeneration(paper, content, layoutInfo);
// setupDetailButton(paper, content, detailData, treeInfo);

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

paper.attr("width", size.width);
paper.attr("height", titleBar.bbox().height + content.bbox().height + 40);

var app = express();
app.set('views', __dirname + '/src/views');
app.set('view engine', 'pug');

app.get('/', function(req, res) {
    res.render('index', {
        title: data.Family.Title,
        svg: paper.svg()
    });
});

app.use('/fonts/', express.static(__dirname + '/dist/fonts'));
app.use('/', express.static(__dirname + '/assets'));

app.listen(3333, "127.0.0.1", function() {
    console.log('Website listening on port 3333');
});
