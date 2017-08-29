const vars = require('./variables');

var measureNode = function(canvas, node) {
    var ret = { width: 0, height: 0 };
    var g = canvas.group();

    let width = 0;
    let height = 0;
    if (node.name) {
        var text = g.text(node.name).attr('font-family', 'Kai').attr('font-size', '24');
        var bbox = text.bbox();
        width = Math.max(width, bbox.width);
        height += bbox.height;
    }
    if (node.note) {
        for (var i = 0; i < node.note.length; i++) {
            var text = g.text(node.note[i]).attr('font-family', 'Hei').attr('font-size', '10');
            var bbox = text.bbox();
            width = Math.max(width, bbox.width);
            height += bbox.height;
        }
    }

    g.remove();
    return {
        width: width + vars.nodePaddingLeft + vars.nodePaddingRight,
        height: height + vars.nodePaddingTop + vars.nodePaddingBottom
    }
};

var prepareTree = function(canvas, tree) {
    tree.forEach(node => {
        var size = measureNode(canvas, node);
        node.width = size.width;
        node.height = size.height;
    });
};

var layoutTree = function(canvas, tree) {
    var genWidth = [];
    for (var i = 0; i <= tree.depth; ++i) {
        genWidth.push(0);
    }

    var genOffset = [ 0 ];
    for (var i = 0; i < genWidth.length; i++) {
        genOffset.push(genOffset[genOffset.length - 1] + genWidth[i] + vars.generationGap * 2);
    }

    var layout = {};

    var root = tree.getRoot();
    var rootDepth = root.depth;
    tree.forEach(node =>
        layout[node.id] = {
            data: node,
            depth: node.depth - rootDepth
        }
    );

    var translateTree = function(node, dy) {
        node.y += dy;
        for (var i = 0; i < node.descendantRange.length; i++) {
            node.descendantRange[i].top += dy;
            node.descendantRange[i].bottom += dy;
        }
        for (var i = 0; i < node.data.children.length; i++) {
            var child = layout[node.data.children[i]];
            if (child) {
                translateTree(child, dy);
            }
        }
    };

    var curHeight = 0;
    var nodePerLevel = {};
    var traversePostfix = function(node) {
        node.x = (genOffset[node.depth] + genOffset[node.depth + 1] - node.data.width) / 2;

        if (node.data.children.length == 0 || node.depth >= tree.depth) {
            if (nodePerLevel[node.depth]) {
                var lastNode = nodePerLevel[node.depth][nodePerLevel[node.depth].length - 1];
                node.y = lastNode.descendantRange[0].bottom;
            } else {
                node.y = 0;
            }
            curHeight += node.data.height;
            node.descendantRange = [{
                top: node.y,
                bottom: node.y + node.data.height
            }];
        } else {
            var maxDescendantDepth = 0;
            for (var i = 0; i < node.data.children.length; i++) {
                var child = layout[node.data.children[i]];
                traversePostfix(child);
                maxDescendantDepth = Math.max(maxDescendantDepth, child.descendantRange.length);
            }

            var firstChild = layout[node.data.children[0]];
            var lastChild = layout[node.data.children[node.data.children.length - 1]];
            node.y = 0.5 * (firstChild.y + lastChild.y + lastChild.data.height - node.data.height);

            node.descendantRange = [{
                top: node.y,
                bottom: node.y + node.data.height
            }];

            for (var i = 0; i < maxDescendantDepth; i++) {
                var range = {
                    top: node.y,
                    bottom: node.y + node.data.height
                };
                for (var j = 0; j < node.data.children.length; j++) {
                    var child = layout[node.data.children[j]];
                    if (child.descendantRange.length > i) {
                        range.top = child.descendantRange[i].top;
                        break;
                    }
                }
                for (var j = node.data.children.length - 1; j >= 0; j--) {
                    var child = layout[node.data.children[j]];
                    if (child.descendantRange.length > i) {
                        range.bottom = child.descendantRange[i].bottom;
                        break;
                    }
                }
                node.descendantRange.push(range);
            }
	    }

        var dy = -node.y;
        if (nodePerLevel[node.depth]) {
            var lastNode = nodePerLevel[node.depth][nodePerLevel[node.depth].length - 1];
            var lastRange = lastNode.descendantRange;
            var thisRange = node.descendantRange;
            var minLength = Math.min(lastRange.length, thisRange.length);
            for (var i = 0; i < minLength; i++) {
                var minTop = lastRange[i].bottom;
                if (node.data.parentId == lastNode.data.parentId)
                    minTop += vars.siblingGap;
                else
                    minTop += vars.cousinGap;
                dy = Math.max(dy, minTop - thisRange[i].top);
            }
        } else {
            nodePerLevel[node.depth] = [];
        }
        if (dy > 0) {
            translateTree(node, dy);
        }
        nodePerLevel[node.depth].push(node);
    };
    traversePostfix(layout[root.id]);

    var totalHeight = 0;
    for (var id in layout) {
        var node = layout[id];
        totalHeight = Math.max(totalHeight, node.y + node.data.height);
    }

    return {
        genOffset,
        nodePerLevel,
        size: {
            width: genOffset[genOffset.length - 1],
            height: totalHeight
        },
        getNodeById: id => layout[id],
        forEach: cb => {
            for (var id in layout) {
                cb(layout[id], id, layout);
            }
        },
        tree: tree
    };
}

module.exports = {
    prepareTree,
    layoutTree
};
