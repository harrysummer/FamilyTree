var generationGap = 80;
var siblingGap = 10;
var cousinGap = 20;
var nodePaddingLeft = 12;
var nodePaddingRight = 12;
var nodePaddingTop = 2;
var nodePaddingBottom = 2;

var nodesToTree = function(arr, id_, parentId_, name_, spouse_, note_, adopted_) {
    if (id_ === undefined)
        id_ = function(d) { return d.Id; }
    if (parentId_ === undefined)
        parentId_ = function(d) { return d.Parent; }
    if (name_ === undefined)
        name_ = function(d) { return d.Name; }
    if (spouse_ === undefined)
        spouse_ = function(d) { return d.Spouse; }
    if (note_ === undefined)
        note_ = function(d) { return d.Note; }
    if (adopted_ === undefined)
        adopted_ = function(d) { return d.Adopted; }

    var id2Index = {};
    var members = [];
    var root = null;
    for (var i = 0; i < arr.length; i++) {
        var d = arr[i];
        var id = id_(d);
        var parentId = parentId_(d);
        if (parentId === null) {
            root = id;
        }
        id2Index[id] = members.length;
        members.push({
            id: id,
            parentId: parentId,
            name: name_(d),
            spouse: spouse_(d),
            note: note_(d),
            specialLink: adopted_(d),
            terminated: d.Terminated,
            children: []
        });
    }
    for (var i = 0; i < members.length; i++) {
        var member = members[i];
        var id = member.id;
        var parentId = member.parentId;
        if (parentId !== null)
            members[id2Index[parentId]].children.push(id);
    }

    var calculateDepth = function(node, depth) {
        node.depth = depth;
        for (var i = 0; i < node.children.length; i++) {
            calculateDepth(members[id2Index[node.children[i]]], depth + 1);
        }
    };
    calculateDepth(members[id2Index[root]], 0);
    return {
        root: root,
        id2Index: id2Index,
        members: members
    };
};

var measureNode = function(paper, node) {
    var result = { width: 0, height: 0 };
    if (node.name) {
        var text = paper.text(node.name).attr('font-family', 'Kai').attr('font-size', '20');
        var bbox = text.bbox();
        text.remove();
        result.width = Math.max(result.width, bbox.width);
        result.height += bbox.height;
    }
    if (node.spouse) {
        if (node.spouse instanceof Array) {
            for (var i = 0; i < node.spouse.length; i++) {
                var text = paper.text(node.spouse[i]).attr('font-family', 'Hei').attr('font-size', '10');
                var bbox = text.bbox();
                text.remove();
                result.width = Math.max(result.width, bbox.width);
                result.height += bbox.height;
            }
        } else {
            var text = paper.text(node.spouse).attr('font-family', 'Hei').attr('font-size', '10');
            var bbox = text.bbox();
            text.remove();
            result.width = Math.max(result.width, bbox.width);
            result.height += bbox.height;
        }
    }
    if (node.note) {
        var text = paper.text(node.note).attr('font-family', 'Hei').attr('font-size', '10');
        var bbox = text.bbox();
        text.remove();
        result.width = Math.max(result.width, bbox.width);
        result.height += bbox.height;
    }
    result.width += nodePaddingLeft + nodePaddingRight;
    result.height += nodePaddingTop + nodePaddingBottom;
    return result;
};

var layoutTree = function(paper, members, id2Index) {
    var root = null;
    var generationWidth = [];

    for (var i = 0; i < members.length; i++) {
        var node = members[i];
        var depth = node.depth;
        node.size = measureNode(paper, node);
        if (node.parentId === null)
            root = node;
        if (generationWidth.length <= depth) {
            for (var j = 0; j < depth - generationWidth.length + 1; j++)
                generationWidth.push(0);
        }
        generationWidth[depth] = Math.max(generationWidth[depth], node.size.width);
    }

    var generationOffset = [ 0 ];
    for (var i = 0; i < generationWidth.length; i++) {
        generationWidth[i] += generationGap;
        generationOffset.push(generationOffset[generationOffset.length - 1] + generationWidth[i]);
    }

    var curHeight = 0;
    var translateTree = function(node, dy) {
        node.y += dy;
        for (var i = 0; i < node.descendantRange.length; i++) {
            node.descendantRange[i].top += dy;
            node.descendantRange[i].bottom += dy;
        }
        for (var i = 0; i < node.children.length; i++) {
            translateTree(members[id2Index[node.children[i]]], dy);
        }
    };


    var nodePerLevel = {};
    var traversePostfix = function(node) {
        node.x = (generationOffset[node.depth] + generationOffset[node.depth + 1] - node.size.width) / 2;

        if (node.children.length == 0) {
            if (nodePerLevel[node.depth]) {
                var lastNode = nodePerLevel[node.depth][nodePerLevel[node.depth].length - 1];
                node.y = lastNode.descendantRange[0].bottom;
            } else {
                node.y = 0;
            }
            curHeight += node.size.height;
            node.descendantRange = [{
                top: node.y,
                bottom: node.y + node.size.height
            }];
        } else {
            var maxDescendantDepth = 0;
            for (var i = 0; i < node.children.length; i++) {
                var child = members[id2Index[node.children[i]]];
                traversePostfix(child);
                maxDescendantDepth = Math.max(maxDescendantDepth, child.descendantRange.length);
            }

            var firstChild = members[id2Index[node.children[0]]];
            var lastChild = members[id2Index[node.children[node.children.length - 1]]];
            node.y = 0.5 * (firstChild.y + lastChild.y + lastChild.size.height - node.size.height);

            node.descendantRange = [{
                top: node.y,
                bottom: node.y + node.size.height
            }];

            for (var i = 0; i < maxDescendantDepth; i++) {
                var range = {
                    top: node.y,
                    bottom: node.y + node.size.height
                };
                for (var j = 0; j < node.children.length; j++) {
                    var child = members[id2Index[node.children[j]]];
                    if (child.descendantRange.length > i) {
                        range.top = child.descendantRange[i].top;
                        break;
                    }
                }
                for (var j = node.children.length - 1; j >= 0; j--) {
                    var child = members[id2Index[node.children[j]]];
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
                if (node.parentId == lastNode.parentId)
                    minTop += siblingGap;
                else
                    minTop += cousinGap;
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
    traversePostfix(root);

    var totalHeight = 0;
    for (var i = 0; i < members.length; i++) {
        var node = members[i];
        totalHeight = Math.max(totalHeight, node.y + node.size.height);
    }

    return {
        generationOffset: generationOffset,
        size: {
            width: generationOffset[generationOffset.length - 1],
            height: totalHeight
        },
        nodePerLevel: nodePerLevel
    };
};

var drawNode = function(paper, content, node) {
    var dx = node.x;
    var dy = node.y;

    var g = paper.group();
    g.transform({
        x: dx,
        y: dy
    });

    var curY = nodePaddingTop;
    if (node.name) {
        var text = g.text(node.name).attr('font-family', 'Kai').attr('font-size', '20').attr('text-anchor', 'middle').move(node.size.width / 2, curY);
        curY += text.bbox().height;
    }
    if (node.spouse) {
        if (node.spouse instanceof Array) {
            for (var i = 0; i < node.spouse.length; i++) {
                var text = g.text(node.spouse[i]).attr('font-family', 'Hei').attr('font-size', '10').attr('text-anchor', 'middle').move(node.size.width / 2, curY);
                curY += text.bbox().height;
            }
        } else {
            var text = g.text(node.spouse).attr('font-family', 'Hei').attr('font-size', '10').attr('text-anchor', 'middle').move(node.size.width / 2, curY);
            curY += text.bbox().height;
        }
    }
    if (node.note) {
        var text = g.text(node.note).attr('font-family', 'Hei').attr('font-size', '10').attr('text-anchor', 'middle').move(node.size.width / 2, curY);
        curY += text.bbox().height;
    }
    g.line(0, 0, 0, node.size.height).attr('stroke', 'black').attr('stroke-width', '2');
    g.line(node.size.width, 0, node.size.width, node.size.height).attr('stroke', 'black').attr('stroke-width', '2');
    if (node.terminated) {
        g.line(node.size.width + 5, 0, node.size.width + 5, node.size.height).attr('stroke', 'black').attr('stroke-width', '4');
    }

    content.add(g);
};

var drawChildrenLink = function(paper, content, node, treeInfo, layoutInfo) {
    if (node.children.length == 0)
        return;

    var midX = layoutInfo.generationOffset[node.depth + 1];
    var id2Index = treeInfo.id2Index;
    var firstChild = treeInfo.members[id2Index[node.children[0]]];
    var lastChild = treeInfo.members[id2Index[node.children[node.children.length - 1]]];

    var wordOnLink = { 'J': '继', 'T': '祧', 'S': '嗣', 'Y': '养' };

    if (node.children.length > 1) {
        content.line(midX, firstChild.y + firstChild.size.height / 2,
            midX, lastChild.y + lastChild.size.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
        content.line(node.x + node.size.width, node.y + node.size.height / 2,
            midX, node.y + node.size.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
    }
    for (var i = 0; i < node.children.length; i++) {
        var child = treeInfo.members[id2Index[node.children[i]]];
        if (node.children.length > 1) {
            if (!child.specialLink) {
                content.line(midX, child.y + child.size.height / 2,
                    child.x, child.y + child.size.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
            } else {
                content.line(midX, child.y + child.size.height / 2 - 2,
                    child.x, child.y + child.size.height / 2 - 2).attr('stroke', 'black').attr('stroke-width', '1');
                content.line(midX, child.y + child.size.height / 2 + 2,
                    child.x, child.y + child.size.height / 2 + 2).attr('stroke', 'black').attr('stroke-width', '1').attr('stroke-dasharray', '5, 2');
                if (wordOnLink[child.specialLink]) {
                    var t = paper.text(wordOnLink[child.specialLink]).attr('font-family', 'Hei').attr('font-size', '14').attr('text-anchor', 'middle').move((midX + child.x) / 2, 0);
                    var bbox = t.bbox();
                    t.attr('y', child.y + child.size.height / 2);
                    bbox = t.bbox();
                    content.rect(bbox.width, bbox.height).move(bbox.x - bbox.w/2, bbox.y).attr('fill', 'white');
                    content.add(t);
                }
            }
        } else {
            if (!child.specialLink) {
                content.line(node.x + node.size.width, child.y + child.size.height / 2,
                    child.x, child.y + child.size.height / 2).attr('stroke', 'black').attr('stroke-width', '1');
            } else {
                content.line(node.x + node.size.width, child.y + child.size.height / 2 - 2,
                    child.x, child.y + child.size.height / 2 - 2).attr('stroke', 'black').attr('stroke-width', '1');
                content.line(node.x + node.size.width, child.y + child.size.height / 2 + 2,
                    child.x, child.y + child.size.height / 2 + 2).attr('stroke', 'black').attr('stroke-width', '1').attr('stroke-dasharray', '5, 2');
                if (wordOnLink[child.specialLink]) {
                    var t = paper.text(wordOnLink[child.specialLink]).attr('font-family', 'Hei').attr('font-size', '14').attr('text-anchor', 'middle');
                    var bbox = t.bbox();
                    t.move((node.x + node.size.width + child.x) / 2, child.y + child.size.height / 2 - bbox.height / 2);
                    bbox = t.bbox();
                    content.rect(bbox.width, bbox.height).move(bbox.x - bbox.w/2, bbox.y).attr('fill', 'white');
                    content.add(t);
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

var drawGeneration = function(paper, content, layoutInfo) {
    var offset = layoutInfo.generationOffset;
    for (var i = 0; i < offset.length - 1; i++) {
        var firstNode = layoutInfo.nodePerLevel[i][0];
        var x = 0.5 * (offset[i] + offset[i + 1]);
        var y = firstNode.y - 15;
        var text = content.text((i==0 ? "始祖" : numberToChinese(i+1) + "世")).attr('font-family', 'Hei').attr('font-size', '10').attr('text-anchor', 'middle').move(x, -50);
        var yEnd = text.bbox().height * 1.2 - 50;
        content.line(x, y, x, yEnd).attr('stroke', 'black').attr('stroke-width', '1').attr('stroke-dasharray', '2, 8');
    }
}

var setupDetailButton = function(paper, content, detail, treeInfo) {
    for (var i = 0; i < detail.length; i++) {
        (function(i) {
            var id = detail[i].Id;
            var desc = detail[i].Desc;
            var node = treeInfo.members[treeInfo.id2Index[id]];
            content.add(paper
                .rect(node.x, node.y, node.size.width, node.size.height)
                .attr('fill-opacity', '0.15')
                .click(function() {
                    vex.dialog.buttons.YES.text = "关闭";
                    vex.dialog.alert({
                        unsafeMessage: desc.replace(/\n/g, '<br/>'),
                        showCloseButton: false
                    });
                })
            );
        })(i);
    }
}

module.exports = {
    nodesToTree,
    measureNode,
    layoutTree,
    drawNode,
    drawChildrenLink,
    drawGeneration,
    setupDetailButton
};
