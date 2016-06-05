var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var ngDocs = require('gulp-ngdocs');
var connect = require('gulp-connect');
var wrapper = require('gulp-wrapper');
var inject = require('gulp-inject');

var source = {};
source.original = './source/www'

source.js = [
    './source/www/lib/angular/angular.js',
    './source/www/lib/angular-animate/angular-animate.js',
    './source/www/lib/angular-aria/angular-aria.js',
    './source/www/lib/angular-messages/angular-messages.js',
    './source/www/lib/angular-material/angular-material.js',
    './source/www/home.js',
    './source/www/components/**/*.js'
];

source.all = [
    './source/www/lib/angular-material/angular-material.css',
    './source/www/lib/angular/angular.js',
    './source/www/lib/angular-animate/angular-animate.js',
    './source/www/lib/angular-aria/angular-aria.js',
    './source/www/lib/angular-messages/angular-messages.js',
    './source/www/lib/angular-material/angular-material.js',
    './source/www/home.js',
    './source/www/home.css',
    './source/www/components/**/*.js',
    './source/www/components/**/*.css'
];

source.css = [
    './source/www/lib/angular-material/angular-material.css',
    './source/www/home.css',
    './source/www/components/**/*.css'
];


source.allConcat = ['./build/concat/script.js', './build/concat/style.css'];
source.allMin = ['./build/dist/www/script.min.js', './build/dist/www/style.min.css'];
source.jsBuild = ['./build/concat/**/*.js'];
source.cssBuild = ['./build/concat/**/*.js'];
source.concat = ['./build/concat/**/*.*'];
source.concatOutput = './build/concat/';
source.concatJs = ['./build/concat/script.js'];
source.concatCss = ['./build/concat/style.css'];
source.concatIndex = ['./build/concat/index.html'];
source.concatTpl = ['./source/www/index.html', './build/concat/tpl/templates.html'];
source.minIndex = ['./build/dist/www/index.html'];
source.dist = './build/dist/www/';
source.templates = ['./source/www/**/*.html', '!./source/www/index.html'];
source.index = ['./source/www/index.html'];

var current = source.original;

gulp.task('concat', function () {
    return gulp.src(source.js)
        .pipe(concat({ path: 'script.js', newLine: ';' }))
        .pipe(gulp.dest(source.concatOutput));
});

gulp.task('concatCss', function () {
    return gulp.src(source.css)
        .pipe(concat({ path: 'style.css' }))
        .pipe(gulp.dest(source.concatOutput));
});

gulp.task('minify', ['concat'], function () {
     return gulp.src(source.concatJs)
        .pipe(minify({ ext: { min: '.min.js' }, noSource: true }))
        .pipe(gulp.dest(source.dist));
});

gulp.task('minifyCss', ['concatCss'], function () {
    return gulp.src(source.concatCss)
        .pipe(cleanCSS())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(source.dist));
});

gulp.task('compileTemplates', function () {
    return gulp.src(source.templates)
        .pipe(wrapper({
           header: '\n<script type="text/ng-template" id="${filename}">\n',
           footer: '\n</script>'
        }))
        .pipe(concat({ path: 'templates.html' }))
        .pipe(gulp.dest(source.concatOutput + 'tpl/'));
});

gulp.task('inliner', ['compileTemplates'], function () {
    return gulp.src(source.concatTpl)
        .pipe(concat({ path: 'index.html' }))
        .pipe(gulp.dest(source.concatOutput));
});

gulp.task('inject', function () {
    return gulp.src(source.index)
        .pipe(inject(gulp.src(source.all, { read: false }), { relative: true }))
        .pipe(gulp.dest(source.original));
});

gulp.task('injectConcat', ['concat', 'concatCss', 'inliner'], function () {
    return gulp.src(source.concatIndex)
        .pipe(inject(gulp.src(source.allConcat, { read: false }), { relative: true }))
        .pipe(gulp.dest(source.concatOutput));
});

gulp.task('injectMin', ['minify', 'minifyCss', 'inliner'], function () {
    return gulp.src(source.minIndex)
        .pipe(inject(gulp.src(source.allMin, { read: false }), { relative: true }))
        .pipe(gulp.dest(source.dist));
});

gulp.task('serve', ['inject'], function () {
    connect.server({
        root: 'source/www',
        port: process.env.PORT,
        host: process.env.IP
    });
});

gulp.task('serve-build', ['injectMin'], function () {
    connect.server({
        root: 'build/dist/www',
        port: process.env.PORT,
        host: process.env.IP
    });
});

gulp.task('reload-build', ['injectMin'], function () {
    return gulp.src(source.dist)
        .pipe(connect.reload());
});

gulp.task('serve-test', ['injectConcat'], function () {
    connect.server({
        root: 'build/concat',
        port: process.env.PORT,
        host: process.env.IP
    });
});

gulp.task('reload-test', ['injectConcat'], function () {
    return gulp.src(source.concatOutput)
        .pipe(connect.reload());
});

gulp.task('re-serve', ['inject'], function () {
    return gulp.src(source.original)
        .pipe(connect.reload());
});

gulp.task('watch', function () {
    gulp.watch(source.templates, ['re-serve']);
    gulp.watch(source.all, ['re-serve']);
});

gulp.task('default', ['serve', 'watch']);
gulp.task('run-source', ['serve', 'watch'])
gulp.task('run-test', ['serve-test'], function () {
    gulp.watch(source.all, ['reload-test']);
    gulp.watch(source.templates, ['reload-test']);
});
gulp.task('run-build', ['serve-build'], function () {
    gulp.watch(source.all, ['reload-build']);
    gulp.watch(source.templates, ['reload-build']);
});