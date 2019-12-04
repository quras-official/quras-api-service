var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('serve', function() {
    nodemon({
        script: 'bin/www',
        ext: 'js json',
        env: {
            NODE_ENV: 'development',
            PORT: 9080
        }
    });
});

// Dev task
gulp.task('dev', ['serve']);