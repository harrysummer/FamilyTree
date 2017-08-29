const svgjs = require('svg.js');
const window = require('svgdom')
    .setFontDir(__dirname + '/../dist/fonts')
    .setFontFamilyMappings({
        'Song': 'SourceHanSerifCN-Bold.ttf',
        'Hei': 'SourceHanSansSC-Regular.ttf',
        'Kai': 'FZKTK.ttf'
    })
    .preloadFonts();
const vars = require('./variables');


const SVG = svgjs(window);
const document = window.document;

var createCanvas = function() {
    var ele = document.createElement('svg');
    var canvas = SVG(ele);
    canvas.parent = ele;
    return canvas;
}

var deleteCanvas = function(canvas) {
    document.removeChild(canvas.parent);
}

var drawNode = function(canvas, node) {
    var dx = node.x;
    var dy = node.y;

    var link = canvas.link('/tree/' + node.data.id);
    link.attr('xlink:href', '/tree/' + node.data.id);
    var g = link.group();
    g.transform({
        x: dx,
        y: dy
    });

    var curY = vars.nodePaddingTop;
    if (node.data.name) {
        var text = g.text(node.data.name).attr('font-family', 'Kai').attr('font-size', '24').attr('text-anchor', 'middle').move(node.data.width / 2, curY);
        curY += text.bbox().height;
    }
    if (node.data.note) {
        for (var i = 0; i < node.data.note.length; i++) {
            var text = g.text(node.data.note[i]).attr('font-family', 'Hei').attr('font-size', '10').attr('text-anchor', 'middle').move(node.data.width / 2, curY);
            curY += text.bbox().height;
        }
    }
    g.line(0, 0, 0, node.data.height).attr('stroke', 'black').attr('stroke-width', '2');
    g.line(node.data.width, 0, node.data.width, node.data.height).attr('stroke', 'black').attr('stroke-width', '2');
    if (node.data.terminated) {
        g.line(node.data.width + 5, 0, node.data.width + 5, node.data.height).attr('stroke', 'black').attr('stroke-width', '4');
    }

    return g;
};

var drawChildrenLink = function(canvas, node, layoutInfo) {
    if (node.data.children.length == 0)
        return;

    var midX = layoutInfo.genOffset[node.depth + 1];
    var firstChild = layoutInfo.getNodeById(node.data.children[0]);
    var lastChild = layoutInfo.getNodeById(node.data.children[node.data.children.length - 1]);

    var wordOnLink = { 'J': '继', 'T': '祧', 'S': '嗣', 'Y': '养' };

    if (!firstChild || !lastChild) {
        canvas.line(node.x + node.data.width, node.y + node.data.height / 2,
        midX, node.y + node.data.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
        return;
    }

    if (node.data.children.length > 1) {
        canvas.line(midX, firstChild.y + firstChild.data.height / 2,
            midX, lastChild.y + lastChild.data.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
        canvas.line(node.x + node.data.width, node.y + node.data.height / 2,
            midX, node.y + node.data.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
    }
    for (var i = 0; i < node.data.children.length; i++) {
        var child = layoutInfo.getNodeById(node.data.children[i]);
        if (node.data.children.length > 1) {
            if (!child.data.specialLink) {
                canvas.line(midX, child.y + child.data.height / 2,
                    child.x, child.y + child.data.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
            } else {
                canvas.line(midX, child.y + child.data.height / 2 - 2,
                    child.x, child.y + child.data.height / 2 - 2).attr('stroke', 'black').attr('stroke-width', '1');
                canvas.line(midX, child.y + child.data.height / 2 + 2,
                    child.x, child.y + child.data.height / 2 + 2).attr('stroke', 'black').attr('stroke-width', '1').attr('stroke-dasharray', '5, 2');
                if (wordOnLink[child.data.specialLink]) {
                    var t = canvas.text(wordOnLink[child.data.specialLink])
                        .attr('font-family', 'Hei')
                        .attr('font-size', '14')
                        .attr('text-anchor', 'middle');
                    var bbox = t.bbox();
                    t.move((midX + child.x) / 2, child.y + child.data.height / 2 - bbox.height / 2);
                    bbox = t.bbox();
                    canvas.rect(bbox.width, bbox.height).move(bbox.x - bbox.w/2, bbox.y).attr('fill', 'white');
                    canvas.add(t);
                }
            }
        } else {
            if (!child.data.specialLink) {
                canvas.line(node.x + node.data.width, child.y + child.data.height / 2,
                    child.x, child.y + child.data.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
            } else {
                canvas.line(node.x + node.data.width, child.y + child.data.height / 2 - 2,
                            child.x, child.y + child.data.height / 2 - 2)
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1');
                canvas.line(node.x + node.data.width, child.y + child.data.height / 2 + 2,
                            child.x, child.y + child.data.height / 2 + 2)
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1')
                    .attr('stroke-dasharray', '5, 2');
                if (wordOnLink[child.data.specialLink]) {
                    var t = canvas.text(wordOnLink[child.data.specialLink])
                        .attr('font-family', 'Hei')
                        .attr('font-size', '14')
                        .attr('text-anchor', 'middle');
                    var bbox = t.bbox();
                    t.move((node.x + node.data.width + child.x) / 2, child.y + child.data.height / 2 - bbox.height / 2);
                    bbox = t.bbox();
                    canvas.rect(bbox.width, bbox.height).move(bbox.x - bbox.w/2, bbox.y).attr('fill', 'white');
                    canvas.add(t);
                }
            }
        }
    }
};

var numberToChinese = function(number) {
    var base = "零一二三四五六七八九";
    var exp10 = "十百千";
    var exp1000 = "万亿";
    if (number < 10) {
        return base[number];
    } else if (number < 20) {
        return exp10[0] + (number % 10 ? base[number % 10] : "");
    } else if (number < 100) {
        return base[Math.floor(number / 10)] + numberToChinese(10 + number % 10);
    } else return "ERR";
};

var drawGeneration = function(canvas, layoutInfo) {
    var offset = layoutInfo.genOffset;
    for (var i = 0; i < offset.length - 1; i++) {
        var firstNode = layoutInfo.nodePerLevel[i][0];
        var x = 0.5 * (offset[i] + offset[i + 1]);
        var y = firstNode.y - 15;
        var gen = i + layoutInfo.tree.getRoot().depth;
        var text = canvas.text((gen==0 ? "始祖" : numberToChinese(gen+1) + "世")).attr('font-family', 'Hei').attr('font-size', '10').attr('text-anchor', 'middle').move(x, -50);
        var yEnd = text.bbox().height - 50;
        canvas.line(x, y, x, yEnd).attr('stroke', 'black').attr('stroke-width', '1').attr('stroke-dasharray', '2, 8');
    }
}

var drawTitle = function(canvas, layoutInfo, opts) {
    var title = layoutInfo.tree.data.Family.Title;
    var subtitle = layoutInfo.tree.data.Family.Subtitle;

    var repeat = function(str, n) {
        var ret = "";
        for (var i = 0; i < n; i++)
            ret = ret + str;
        return ret;
    };

    var curY = 0;
    if (title && (!opts || opts.drawTitle === undefined || opts.drawTitle)) {
        var text = canvas
            .text(title)
            .attr('font-family', 'Song')
            .attr('font-size', '72')
            .attr('text-anchor', 'middle')
            .move(layoutInfo.size.width / 2, 0)
            .attr('dx', '0' + repeat(' 24', title.length - 1))
            .transform({ scaleX: 1.4 });
        curY += text.bbox().height;
    }
    if (subtitle && (!opts || opts.drawSubtitle === undefined || opts.drawSubtitle)) {
        var subtitle = canvas
            .text(subtitle)
            .attr('font-family', 'Hei')
            .attr('font-size', '24')
            .attr('text-anchor', 'middle')
            .move(layoutInfo.size.width / 2, curY);
    }
};

var drawLayout = function(canvas, layoutInfo, opts) {
    var titleBar = canvas.group();
    drawTitle(titleBar, layoutInfo, opts);

    var content = canvas.group();
    var titleBBox = titleBar.rbox();
    content.move(0, titleBBox.height + 50);
    layoutInfo.forEach(node => {
        drawNode(content, node);
        drawChildrenLink(content, node, layoutInfo);
    });

    drawGeneration(content, layoutInfo);

    canvas.attr("width", layoutInfo.size.width);
    canvas.attr("height", layoutInfo.size.height + titleBBox.height + 50);
};

module.exports = {
    createCanvas,
    deleteCanvas,
    drawLayout
};
