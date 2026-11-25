'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var templateCache = require('gulp-angular-templatecache');
var del = require('del');

var vendor = {
  js: [
    'node_modules/jquery/dist/jquery.js',
    'node_modules/bootstrap/dist/js/bootstrap.js',
    'node_modules/lodash/lodash.js',
    'node_modules/moment/moment.js',
    'node_modules/angular/angular.js',
    'node_modules/angular-sanitize/angular-sanitize.js',
    'node_modules/angular-ui-router/release/angular-ui-router.js'
  ],
  css: [
    'node_modules/bootstrap/dist/css/bootstrap.css'
  ],
  fonts: 'node_modules/bootstrap/dist/fonts/*'
};

var app = {
  js: ['src/app/**/*.module.js', 'src/app/**/*.js', '.tmp/templates.js'],
  templates: 'src/app/**/*.html',
  css: 'src/styles/**/*.css',
  index: 'src/index.html'
};

function clean() {
  return del(['dist', '.tmp']);
}

function vendorJs() {
  return gulp.src(vendor.js).pipe(concat('vendor.js')).pipe(gulp.dest('dist/js'));
}

function vendorCss() {
  return gulp.src(vendor.css).pipe(concat('vendor.css')).pipe(gulp.dest('dist/css'));
}

function fonts() {
  return gulp.src(vendor.fonts).pipe(gulp.dest('dist/fonts'));
}

function templates() {
  return gulp.src(app.templates)
    .pipe(templateCache('templates.js', { module: 'boaTeller.templates', standalone: true, root: 'app/' }))
    .pipe(gulp.dest('.tmp'));
}

function appJs() {
  return gulp.src(app.js).pipe(concat('app.js')).pipe(gulp.dest('dist/js'));
}

function appCss() {
  return gulp.src(app.css).pipe(concat('app.css')).pipe(gulp.dest('dist/css'));
}

function index() {
  return gulp.src(app.index).pipe(gulp.dest('dist'));
}

var build = gulp.series(clean, gulp.parallel(vendorJs, vendorCss, fonts, appCss, index, gulp.series(templates, appJs)));

function watch() {
  gulp.watch(['src/app/**/*'], gulp.series(templates, appJs));
  gulp.watch(app.css, appCss);
  gulp.watch(app.index, index);
}

exports.clean = clean;
exports.build = build;
exports.watch = gulp.series(build, watch);
exports.default = build;
