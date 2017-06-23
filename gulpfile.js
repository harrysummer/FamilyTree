const gulp = require('gulp');
const webpack = require('gulp-webpack');
const watch = require('gulp-watch');
const babel = require('gulp-babel');
const exec = require('gulp-exec');

gulp.task('babel', () =>
    gulp.src('src/*.js')
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(gulp.dest('dist'))
);

gulp.task('fontmin', () =>
    exec('node fontmin'));

gulp.task('serve', () =>
    exec('node app'));

gulp.task('watch', () => [
        gulp.watch('src/*.js', ['babel']),
        gulp.watch('src/hong.yaml', ['fontmin'])
]);

gulp.task('default', ['babel', 'fontmin']);
