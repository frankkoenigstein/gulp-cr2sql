# gulp-cr2sql
Analyses json files and creates sql insert statements

## Installation
    $ npm install https://github.com/frankkoenigstein/gulp-cr2sql

## Usage

```js
const cr2sql = require('gulp-cr2sql');

var filePattern = "*.txt";

gulp.task('default', function () {
    return gulp
        .src(filePattern)
        .pipe(cr2sql())
        .pipe(gulp.dest('.'));
});

```
