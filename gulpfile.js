"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var sass = require("gulp-sass");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var csso = require("gulp-csso");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');
var pipeline = require('readable-stream').pipeline;
var rename = require("gulp-rename");
var del = require("del");
var server = require("browser-sync").create();

gulp.task("css", function () {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

gulp.task("jsminify", function () {
  return gulp.src("source/js/*.js")
    .pipe(rename("script.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("build/js"))
    .pipe(server.stream());
});

gulp.task("images", function () {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({quality: 80, progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
});

gulp.task("webp", function () {
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img"));
});

gulp.task("sprite", function () {
  return gulp.src("source/img/sprite/*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img/"));
});

gulp.task("clean", function () {
  return del("build");
});

gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
/*    "source/js/!**",*/
    "source/*.ico"
  ], {
    base: "source"
  })
    .pipe(gulp.dest("build"));
});

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest("build"));
});

gulp.task("htmlminify", function () {
  return gulp.src("build/*.html")
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest('build'));
});

gulp.task("server", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css"));
  gulp.watch("source/js/*.js", gulp.series("jsminify"));
  gulp.watch("source/img/sprite/*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/img/*.{png,jpg}", gulp.series("images", "webp", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "htmlminify", "refresh"))
});

gulp.task("refresh", function (done) {
  server.reload();
  done();
});

gulp.task("build", gulp.series("clean", "copy", "css", "jsminify",  "images", "webp", "sprite", "html", "htmlminify"));
gulp.task("start", gulp.series("build", "server"));
