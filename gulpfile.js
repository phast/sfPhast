var gulp = require('gulp'),
    stylus = require('gulp-stylus'),
    spritesmith = require('gulp.spritesmith'),
    csso = require('gulp-csso'),
    imagemin = require('gulp-imagemin'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    runSequence = require('run-sequence').use(gulp),
    bower = require('main-bower-files'),
    twig = require('gulp-twig'),
    browserSync,
    nib = require('nib'),
    phast = require('stylus-phast'),
    merge = require('gulp-merge'),
    path = require('path'),
    fs = require('fs');

gulp.task('templates', function() {
    var stream = gulp.src('./source/twig/*.twig')
        .pipe(twig({
            data: JSON.parse(fs.readFileSync('./source/etc/twig.json'))
        }))
        .on('error', console.log)
        .pipe(gulp.dest('./web'));

    if(browserSync)
        stream.pipe(browserSync.reload({stream: true}));
		
	return stream;
});

gulp.task('bower-scripts', function(){
    return gulp.src(bower({
            includeDev: true,
            filter: function (path) {
                var ext = path.split('\\').pop().split('.').pop();
                if (ext == 'js') return true;
            }
        }))
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('./web/js'));
});

gulp.task('stylus', function() {
    var stream = gulp.src('./source/stylus/*.styl')
        .pipe(stylus({use: phast()}))
        .on('error', console.log)
        .pipe(gulp.dest('./web/css'));

    if(browserSync)
        stream.pipe(browserSync.reload({stream: true}));
		
	return stream;
});

gulp.task('stylus-sprite', function() {
    var data;
    data = gulp.src('./source/sprite/**/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.styl',
        cssFormat: 'stylus',
        algorithm: 'binary-tree',
        cssTemplate: function(data) {
            var item, template, timestamp, _i, _len, _ref;
            timestamp = (new Date).getTime();
            template = '$sprite-timestamp = ' + timestamp + '\n';
            template += '$sprites = {}\n';
            _ref = data.items;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                item = _ref[_i];
                template += '$sprite-' + item.name + ' = ' + item.px.offset_x + ' ' + item.px.offset_y + ' ' + item.px.width + ' ' + item.px.height + '\n';
                template += '$sprites[\''+item.name+'\'] = $sprite-' + item.name + '\n';
            }
            return template;
        }
    }));
    data.img.pipe(gulp.dest('./web/images'));
    return data.css.pipe(gulp.dest('./source/etc'));
});

gulp.task('stylus-sprite-build', function() {
    runSequence('stylus-sprite', 'stylus');

});

gulp.task('js', function() {
    var dir = './source/js',
        dest = './web/js';

    var stream = fs
        .readdirSync(dir)
        .filter(function(file){return fs.statSync(path.join(dir, file)).isDirectory();})
        .map(function(folder) {
            return gulp.src(path.join(dir, folder, '/*.js'))
                .pipe(concat(folder + '.js'))
                .pipe(gulp.dest(dest))
    });

    stream = merge(stream, gulp.src(dir + '/*.js').pipe(concat('common.js')).pipe(gulp.dest(dest)));

    if(browserSync)
        stream.pipe(browserSync.reload({stream: true}));

    return stream;
});

gulp.task('css', function() {
    var merged = merge(gulp.src('./source/css/**/*.css'), gulp.src(
        bower({
            includeDev: true,
            filter: function (path) {
                var ext = path.split('\\').pop().split('.').pop();
                if (ext == 'css') return true;
            }
        })
    ));
    merged.pipe(concat('vendor.css')).pipe(gulp.dest('./web/css'));

    return merged;
});

gulp.task('fonts', function() {
    return gulp.src('./source/fonts/**/*').pipe(gulp.dest('./web/fonts'));
});

gulp.task('images', function() {
    return gulp.src('./source/images/**/*').pipe(gulp.dest('./web/images'));
});


gulp.task('watch', function(){
    gulp.watch('./source/sprite/*', ['stylus-sprite-build']);
    gulp.watch('./source/stylus/**/*.styl', ['stylus']);
    gulp.watch('./source/twig/**/*.twig', ['templates']);
    gulp.watch('./source/etc/twig.json', ['templates']);
    gulp.watch('./source/js/**/*', ['js']);
    gulp.watch('./source/fonts/**/*', ['fonts']);
    gulp.watch('./source/images/**/*', ['images']);
    gulp.watch('./source/css/**/*.css', ['css']);
});

gulp.task('sync', function(){
    browserSync({proxy: 'localhost', open: false});
});


gulp.task('default', function() {
    browserSync = require('browser-sync');

    runSequence(
        ['bower-scripts', 'sync', 'css', 'js', 'fonts', 'images', 'templates', 'stylus-sprite-build'],
        'watch'
    );

});

gulp.task('build', ['bower-scripts', 'css', 'js', 'fonts', 'images', 'templates', 'stylus-sprite-build']);
