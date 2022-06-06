import yaml from 'js-yaml';
import { readFileSync } from 'fs';

var nodesToTree = function(arr, id_, parentId_, name_, adopted_, note_) {
    if (id_ === undefined)
        id_ = function(d) { return d.Id; }
    if (parentId_ === undefined)
        parentId_ = function(d) { return d.Parent; }
    if (name_ === undefined)
        name_ = function(d) { return d.Name; }
    if (adopted_ === undefined)
        adopted_ = function(d) { return d.Adopted; }
    if (note_ === undefined) {
        note_ = function(d) {
            var ret = [];
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
            if (d.Note) {
                ret.push(d.Note);
            }
            return ret;
        }
    }

    var members = {};
    var root = null;
    for (var i = 0; i < arr.length; i++) {
        var d = arr[i];
        var id = id_(d);
        var parentId = parentId_(d);
        if (parentId === null) {
            root = id;
        }
        members[id] = {
            id: id,
            parentId: parentId,
            name: name_(d),
            specialLink: adopted_(d),
            terminated: d.Terminated,
            note: note_(d),
            children: []
        };
    }
    for (let id in members) {
        var member = members[id];
        var parentId = member.parentId;
        if (parentId !== null)
            members[parentId].children.push(id);
    }

    var maxDepth = 0;
    var calculateDepth = function(node, depth) {
        node.depth = depth;
        maxDepth = Math.max(maxDepth, depth);
        for (var i = 0; i < node.children.length; i++) {
            calculateDepth(members[node.children[i]], depth + 1);
        }
    };
    calculateDepth(members[root], 0);
    return {
        depth: maxDepth,
        getRoot: () => members[root],
        getNodeById: id => members[id],
        forEach: cb => {
            for (let id in members) {
                cb(members[id], id, members);
            }
        }
    };
};

export function parseDataFile(fileName) {
    var data;
    try {
        data = yaml.load(readFileSync(fileName, 'utf8'));
    } catch(e) {
        console.log(e);
        process.exit(-1);
    }

    var treeInfo = nodesToTree(data.Family.Members);

    treeInfo.data = data;
    return treeInfo;
}

export function subtree(tree, rootId, maxDepth) {
    var root;
    if (rootId === undefined) {
        root = tree.getRoot();
    } else {
        root = tree.getNodeById(rootId);
    }
    if (!root) return null;

    if (maxDepth === undefined)
        maxDepth = tree.depth - root.depth;


    var members = {};
    var addToMember = node => {
        members[node.id] = node;
        if (node.depth - root.depth < maxDepth) {
            for (var i = 0;  i < node.children.length; ++i)
                addToMember(tree.getNodeById(node.children[i]));
        }
    };
    addToMember(root);

    maxDepth = 0;
    for (let id in members) {
        maxDepth = Math.max(maxDepth, members[id].depth);
    }

    return {
        data: tree.data,
        depth: maxDepth - root.depth,
        getRoot: () => members[rootId],
        getNodeById: id => members[id],
        forEach: cb => {
            for (let id in members) {
                cb(members[id], id, members);
            }
        }
    };
}
