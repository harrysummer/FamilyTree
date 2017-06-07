const gulp = require('gulp');
const webpack = require('gulp-webpack');
const watch = require('gulp-watch');
const babel = require('gulp-babel');

gulp.task('babel', () =>
    gulp.src('src/*.js')
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(gulp.dest('dist'))
);

gulp.task('serve', () =>
    exec('node app'))

gulp.task('default', () =>
        gulp.watch('src/*.js', ['babel']));

