'use strict';

import gulp from 'gulp';
const { src, dest, series, parallel, watch } = require('gulp');
import livereload from 'gulp-livereload';
import webpack from 'gulp-webpack';
import babel from 'gulp-babel';
import child_process from 'child_process';

function babel_task() {
    return src('src/*.js')
        .pipe(babel({ presets: ['@babel/env'] }))
        .pipe(dest('dist/'))
        .pipe(livereload());
}

function fontmin_task(done) {
    child_process.exec('node fontmin', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        done();
    });
}

function watch_task(cb) {
    watch('data/hong.yaml', fontmin_task);
}

function serve_task() {
    child_process.exec('node app');
}

export {
    babel_task as babel,
    fontmin_task as fontmin,
    watch_task as watch,
    serve_task as serve,
};

export let dev = parallel(watch_task, serve_task);
export default series(babel_task, fontmin_task);
