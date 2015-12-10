var gulp = require('gulp'),
    gulpif = require('gulp-if'),
    stylus = require('gulp-stylus'),
    stylusUtils = require('gulp-stylus/node_modules/stylus').utils,
    spritesmith = require('gulp.spritesmith'),
    csso = require('gulp-csso'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    runSequence = require('run-sequence').use(gulp),
    streamqueue = require('streamqueue'),
    bower = require('main-bower-files'),
    twig = require('gulp-twig'),
    browserSync,
    nib = require('nib'),
    phast = require('stylus-phast'),
    merge = require('merge-stream'),
    path = require('path'),
    ts = require('gulp-typescript'),
    fs = require('fs'),
    through = require('through');

var optimize = false,
    spritesStorage;

/**
 * @task css
 * Run tasks [css:sprite, css:main] sequentially
 */
gulp.task('css', function(callback){
    runSequence('css:sprites', 'css:main', callback);
});

/**
 * @task css:main
 * Generate /web/*.css
 */
gulp.task('css:main', function(callback){
    var stream = gulp.src('./assets/css/*.styl')
        .pipe(stylus({use: [phast(), function(stylus){
            stylus.define('$sprites-timestamp', (new Date).getTime());
            stylus.define('$sprites', stylusUtils.coerceObject(spritesStorage, true));
        }]}))
        .on('error', function(error){
            console.log(error.message);
            callback();
        })
        .pipe(gulpif(optimize, csso()))
        .pipe(gulp.dest('./web/css'));

    if(browserSync){
        stream.pipe(browserSync.reload({stream: true}));
    }

    return stream;
});


/**
 * @task css:sprites
 * Generate /web/sprites/*.png
 */
gulp.task('css:sprites', function(callback){
    var dir = './assets/sprites',
        stream;

    spritesStorage = {};

    if(!fs.existsSync(dir)){
        return callback();
    }

    stream = fs.readdirSync(dir)
        .filter(function(file){
            return fs.statSync(path.join(dir, file)).isDirectory();
        })
        .map(function(folder, i){
            var data = gulp.src(path.join(dir, folder, '/*.png')).pipe(spritesmith({
                imgName: folder + '.png',
                cssName: folder,
                cssFormat: 'json',
                algorithm: 'binary-tree'
            }));

            data.img.pipe(gulp.dest('./web/sprites'));
            return data.css;
        });


    if(!stream.length){
        return callback();
    }

    stream = merge(stream);
    stream.pipe(through(
        function(file){
            spritesStorage[file.path] = JSON.parse(file.contents.toString());
        }
    ));

    return stream;
});


/**
 * @task css:vendor
 * Generate /web/vendor.css
 */
gulp.task('css:vendor', function(){
    var stream = gulp.src('./assets/css/vendor/*.css');

    if(fs.existsSync('./bower.json')){
        stream = streamqueue(
            {objectMode: true},
            gulp.src(
                bower({
                    includeDev: true,
                    filter: '**/*.css'
                })
            ),
            stream
        );
    }

    stream.pipe(concat('vendor.css')).pipe(gulp.dest('./web/css'));

    return stream;
});


/**
 * @task js
 * Generate /web/js/*.js
 */
gulp.task('js', function(callback){
    var dir = './assets/js',
        dest = './web/js',
        stream;

    if(!fs.existsSync(dir)){
        return callback();
    }

    stream = fs
        .readdirSync(dir)
        .filter(function(file){
            return fs.statSync(path.join(dir, file)).isDirectory() && file != 'vendor';
        })
        .map(function(folder){
            return merge(gulp.src(path.join(dir, folder, '/*.js')), gulp.src(path.join(dir, folder, '/*.ts')).pipe(ts({noImplicitAny: true})).js)
                .pipe(concat(folder + '.js'))
                .pipe(gulpif(optimize, uglify()))
                .pipe(gulp.dest(dest));
        });

    stream = merge(
        stream,
        merge(gulp.src(dir + '/*.js'), gulp.src(dir + '/*.ts').pipe(ts({noImplicitAny: true})).js)
            .pipe(concat('common.js'))
            .pipe(gulpif(optimize, uglify()))
            .pipe(gulp.dest(dest))
    );

    if(browserSync){
        stream.pipe(browserSync.reload({stream: true}));
    }

    return stream;
});


/**
 * @task js:vendor
 * Generate /web/js/vendor.js
 */
gulp.task('js:vendor', function(){
    var stream = gulp.src('./assets/js/vendor/**/*.js');

    if(fs.existsSync('./bower.json')){
        stream = streamqueue(
            {objectMode: true},
            gulp.src(bower({includeDev: true, filter: '**/*.js'})),
            stream
        );
    }

    stream
        .pipe(concat('vendor.js'))
        .pipe(gulpif(optimize, uglify()))
        .pipe(gulp.dest('./web/js'));

    if(browserSync){
        stream.pipe(browserSync.reload({stream: true}));
    }

    return stream;
});


/**
 * @task fonts
 * Copy font files to /web/fonts/*
 */
gulp.task('fonts', function(){
    return gulp.src('./assets/fonts/**/*').pipe(gulp.dest('./web/fonts'));
});


/**
 * @task images
 * Copy image files to /web/images/*
 */
gulp.task('images', function(){
    return gulp.src('./assets/images/**/*').pipe(gulp.dest('./web/images'));
});


/**
 * @task html
 * Generate /web/*.html
 */
gulp.task('html', function(callback){
    if(!fs.existsSync('./assets/html')){
        return callback();
    }

    var stream = gulp.src('./assets/html/*.twig')
        .pipe(twig({data: JSON.parse(fs.readFileSync('./assets/html/data.json'))}))
        .on('error', console.log)
        .pipe(gulp.dest('./web'));

    if(browserSync){
        stream.pipe(browserSync.reload({stream: true}));
    }

    return stream;
});

/**
 * @task sync
 */
gulp.task('sync', function(){
    browserSync = require('browser-sync');
    browserSync({proxy: path.basename(__dirname), open: false, notify: false, ghostMode: false});
});

/**
 * @task watch
 */
gulp.task('watch', ['sync'], function(){
    gulp.watch('./assets/css/**/*.styl', ['css:main']);
    gulp.watch('./assets/html/**/*.twig', ['html']);
    gulp.watch('./assets/css/vendor/*.css', ['css:vendor']);
    gulp.watch(['./assets/js/**/*.js', './assets/js/**/*.ts', '!./assets/js/vendor/**/*.js'], ['js']);
    gulp.watch('./assets/js/vendor/**/*.js', ['js:vendor']);
    gulp.watch('./assets/fonts/**/*', ['fonts']);
    gulp.watch('./assets/images/**/*', ['images']);
});


gulp.task('default', function(){
    runSequence(
        ['html', 'css', 'css:vendor', 'js', 'js:vendor', 'fonts', 'images'],
        'watch'
    );
});

gulp.task('build', function(){
    optimize = true;
    runSequence(
        ['css', 'css:vendor', 'js', 'js:vendor', 'fonts', 'images']
    );
});

