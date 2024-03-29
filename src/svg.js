import { SVG, registerWindow } from '@svgdotjs/svg.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config, createSVGWindow } from 'svgdom';
import { nodePaddingTop, siblingGap } from './variables.js';
import { zhGeneration } from './util.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

config.setFontDir(__dirname + '/../dist/fonts')
    .setFontFamilyMappings({
        'Song': 'SourceHanSerifCN-Bold.ttf',
        'Hei': 'SourceHanSansSC-Regular.ttf',
        'Kai': 'FZKTK.ttf',
        'sans-serif': 'SourceHanSerifCN-Bold.ttf'
    })
    .preloadFonts();

export function createCanvas() {
    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    return SVG(document.documentElement);
}

var drawNode = function(canvas, node, layoutInfo) {
    var dx = node.x;
    var dy = node.y;

    var url = '/tree/' + node.data.id + (layoutInfo.depthLimit ? '/depth/' + layoutInfo.depthLimit : '');
    var link = canvas.link(url);
    link.attr('xlink:href', url);
    var g = link.group();
    g.transform({
        translateX: dx,
        translateY: dy
    });

    var curY = nodePaddingTop;
    if (node.data.name) {
        var text = g.text(node.data.name).font({ family: 'Kai', size: 24 }).cx(node.data.width / 2).y(curY);
        curY += text.bbox().height;
    }
    if (node.data.note) {
        for (var i = 0; i < node.data.note.length; i++) {
            var text = g.text(node.data.note[i]).font({ family: 'Hei', size: 10 }).cx(node.data.width / 2).y(curY);
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
                    var t = canvas.text(wordOnLink[child.data.specialLink]).font({ family: 'Hei', size: 14 });
                    var bbox = t.bbox();
                    t.cx((midX + child.x) / 2).y(child.y + child.data.height / 2 - bbox.height / 2);
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
                    var t = canvas.text(wordOnLink[child.data.specialLink]).font({ family: 'Hei', size: 14 });
                    var bbox = t.bbox();
                    t.cx((node.x + node.data.width + child.x) / 2).y(child.y + child.data.height / 2 - bbox.height / 2);
                    bbox = t.bbox();
                    canvas.rect(bbox.width, bbox.height).move(bbox.x, bbox.y).attr('fill', 'white');
                    canvas.add(t);
                }
            }
        }
    }
};

var drawGeneration = function(canvas, layoutInfo) {
    var offset = layoutInfo.genOffset;
    for (var i = 0; i < offset.length - 1; i++) {
        var firstNode = layoutInfo.nodePerLevel[i][0];
        var x = 0.5 * (offset[i] + offset[i + 1]);
        var y = firstNode.y - 15;
        var gen = i + layoutInfo.tree.getRoot().depth;
        var text = canvas.text(zhGeneration(gen)).font({ family: 'Hei', size: 14 }).cx(x).y(-50);
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
            .font({ family: 'Song', size: 72, anchor: 'middle' })
            .cx(layoutInfo.size.width / 2).y(0)
            .attr('dx', '0' + repeat(' 24', title.length - 1))
            .transform({ scaleX: 1.4 });
        curY += text.bbox().height;
    }
    if (subtitle && (!opts || opts.drawSubtitle === undefined || opts.drawSubtitle)) {
        var subtitle = canvas
            .text(subtitle)
            .font({ family: 'Hei', size: 24, anchor: 'middle' })
            .cx(layoutInfo.size.width / 2)
            .y(curY);
    }
};

var drawToolbar = function(canvas, layoutInfo, opts) {
    if (opts && opts.drawToolbar) {
        var links = [
            { text: '回首页',       url: '/' },
            { text: '上溯一代',     url: '/tree/' + layoutInfo.tree.getRoot().parentId + (layoutInfo.depthLimit ? '/depth/' + layoutInfo.depthLimit : '') },
            { text: '显示到五世孙', url: '/tree/' + layoutInfo.tree.getRoot().id + '/depth/5' },
            { text: '显示到七世孙', url: '/tree/' + layoutInfo.tree.getRoot().id + '/depth/7' },
            { text: '显示所有后代', url: '/tree/' + layoutInfo.tree.getRoot().id }
        ];
        if (layoutInfo.tree.getRoot().depth === 0) {
            links.splice(1, 1);
        }
        var curX = 0;
        for (var id in links) {
            var text = links[id].text;
            var url = links[id].url;
            var link = canvas.link(url).attr('xlink:href', url);
            var g = link.group();
            g.transform({ translateX: curX, translateY: 0 });
            var text = canvas.text(text).font({ family: 'Hei', size: 20 });
            var bbox = text.bbox();
            text.cx(bbox.width / 2 + 5).y(5);
            var rect = g.rect(bbox.width + 10, bbox.height + 10).attr('stroke', 'black').attr('stroke-width', '3').attr('fill', 'white');
            g.add(text);
            curX += bbox.width + 20;
        }
    }
}

var drawAncestors = function(canvas, layoutInfo, opts, fulltree) {
    var g = canvas.group();
    if (opts && opts.drawAncestors) {
        var curNode = layoutInfo.tree.getRoot();
        if (curNode.depth > 0) {
            var maxWidth = 0;
            while (true) {
                curNode = fulltree.getNodeById(curNode.parentId);
                maxWidth = Math.max(maxWidth, curNode.width);
                if (curNode.parentId === null) break;
            }

            var curNode = layoutInfo.tree.getRoot();
            var parentNode = fulltree.getNodeById(curNode.parentId);
            var curY = layoutInfo.getNodeById(curNode.id).y + curNode.height / 2 - parentNode.height / 2;
            canvas.line(parentNode.width / 2 - maxWidth / 2, curY + parentNode.height / 2, layoutInfo.getNodeById(curNode.id).x, curY + parentNode.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
            while (true) {
                curNode = fulltree.getNodeById(curNode.parentId);
                var parentNode = fulltree.getNodeById(curNode.parentId);
                var node = drawNode(canvas, {
                    x: -maxWidth / 2 - curNode.width / 2,
                    y: curY,
                    data: curNode
                }, layoutInfo);
                var gen = canvas.text(zhGeneration(curNode.depth)).font({ family: 'Hei', size: 14, anchor: 'right' });
                gen.move(-maxWidth / 2 - curNode.width / 2 - gen.bbox().width - 10, curY + curNode.height / 2 - gen.bbox().height / 2);
                if (curNode.parentId === null) break;
                curY -= siblingGap + parentNode.height;
            }
        }
    }
}

export function drawLayout(canvas, layoutInfo, opts, fulltree) {
    var titleBar = canvas.group();
    drawTitle(titleBar, layoutInfo, opts);
    var titleBBox = titleBar.rbox();

    var toolbar = canvas.group();
    toolbar.move(0, titleBBox.height);
    drawToolbar(toolbar, layoutInfo, opts);
    var toolBBox = toolbar.rbox();

    var content = canvas.group();
    var ancestors = content.group();
    drawAncestors(ancestors, layoutInfo, opts, fulltree); 
    var ancestorsBBox = ancestors.rbox();
    content.transform({
        translateX: ancestorsBBox.width,
        translateY: titleBBox.height + toolBBox.height + 50 + Math.max(50, -ancestorsBBox.y)
    });
    layoutInfo.forEach(node => {
        drawNode(content, node, layoutInfo);
        drawChildrenLink(content, node, layoutInfo);
    });

    drawGeneration(content, layoutInfo);

    canvas.attr("width", Math.max(layoutInfo.size.width + ancestorsBBox.width, titleBBox.width, toolBBox.width));
    canvas.attr("height", layoutInfo.size.height + titleBBox.height + toolBBox.height + 50 + Math.max(50, -ancestorsBBox.y));
};
