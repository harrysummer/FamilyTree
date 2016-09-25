require('babel-polyfill');
var fs = require('fs');
var express = require('express');
var yaml = require('js-yaml');
var vis = require('./dist/tree');

var data;
try {
    data = yaml.safeLoad(fs.readFileSync(__dirname + '/data/hong.yaml', 'utf8'));
} catch(e) {
    console.log(e);
    process.exit(-1);
}

vis.renderTreeFromConfig(data.Family.Members).then((html) => {
    data.Family.Members = undefined;
    data.Family.HTML = html;

    var app = express();
    app.set('views', __dirname + '/src/views');
    app.set('view engine', 'pug');

    app.get('/', function(req, res) {
        res.render('index', data.Family);
    });

    app.listen(3333, "127.0.0.1", function() {
        console.log('Website listening on port 3333');
    });
});
