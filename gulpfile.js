const gulp = require("gulp");
const minify = require("gulp-minify");
const rename = require("gulp-rename");

const DEST_DIR = './';
const tasks = [];

const INDEX_FILE = 'index.js';
const MINIFY_INDEX = 'minifyindex';

const BROWSER_FILE = 'serialize-any.js';
const MINIFY_BROWSER = 'minifybrowser';

// minify INDEX_FILE
gulp.task(MINIFY_INDEX, () => {
  console.log(`Minifying ${INDEX_FILE}...`);
  return gulp.src(INDEX_FILE, { allowEmpty: true })
    .pipe(minify({noSource: true}))
    .pipe(rename(path => {
      path.basename = path.basename.replace(/-min/,'.min');
      return path;
    }))
    .pipe(gulp.dest(DEST_DIR))
});
tasks.push(MINIFY_INDEX);

// minify MINIFY_BROWSER
gulp.task(MINIFY_BROWSER, () => {
  console.log(`Minifying ${BROWSER_FILE}...`);
  return gulp.src(BROWSER_FILE, { allowEmpty: true })
    .pipe(minify({noSource: true}))
    .pipe(rename(path => {
      path.basename = path.basename.replace(/-min/,'.min');
      return path;
    }))
    .pipe(gulp.dest(DEST_DIR))
});
tasks.push(MINIFY_BROWSER);

gulp.task('default', gulp.series(tasks));