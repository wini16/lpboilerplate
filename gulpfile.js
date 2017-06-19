const gulp = require('gulp');
const watch = require('gulp-watch');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const handlebars = require('gulp-compile-handlebars');
const gutil = require("gulp-util");
const webpack = require("webpack");
const browserSync = require('browser-sync').create();
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('./webpack.config');
const stripAnsi = require('strip-ansi');
const htmlmin = require('gulp-htmlmin');
const environments = require('gulp-environments');
const imagemin = require('gulp-imagemin');

const development = environments.development;
const production = environments.production;

function pages() {
	const options = {
		batch : ['./src/templates/partials']
	}
	return gulp.src('src/templates/pages/*.@(html|hbs)')
		.pipe(handlebars(null, options))
		.pipe(production(htmlmin({collapseWhitespace: true})))
		.pipe(gulp.dest('./dist/'));
}
gulp.task('pages', pages);
gulp.task('pages:watch', function () {
	watch('./src/templates/**/*', pages);
});

function styles() {
	return gulp.src('./src/styles/main.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: production ? 'compressed' : 'expanded'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./dist/static'));
}
gulp.task('styles', styles);
gulp.task('styles:watch', function () {
  watch('./src/styles/**/*.scss', styles);
});

function images() {
  return gulp.src('src/assets/img/*')
		.pipe(imagemin())
		.pipe(gulp.dest('dist/static/img'))
}
gulp.task('images', images);
gulp.task('images:watch', function () {
  watch('./src/assets/img/*', images);
});

gulp.task("webpack:build", function(callback) {
	// modify some webpack config options
	var myConfig = Object.create(webpackConfig);
	myConfig.plugins = myConfig.plugins.concat(
		new webpack.DefinePlugin({
			"process.env": {
				// This has effect on the react lib size
				"NODE_ENV": JSON.stringify("production")
			}
		}),
		new webpack.optimize.UglifyJsPlugin({
			sourceMap: true
		})
	);

	// run webpack
	webpack(myConfig, function(err, stats) {
		if(err) throw new gutil.PluginError("webpack:build", err);
		gutil.log("[webpack:build]", stats.toString({
			colors: true
		}));
		callback();
	});
});

gulp.task('default', ['styles', 'styles:watch', 'pages', 'pages:watch', 'images', 'images:watch'], function() {
	const bundler = webpack(webpackConfig);
	bundler.plugin('done', function (stats) {
    if (stats.hasErrors() || stats.hasWarnings()) {
			return browserSync.sockets.emit('fullscreen:message', {
				title: "Webpack Error:",
				body:  stripAnsi(stats.toString()),
				timeout: 100000
			});
    }
    browserSync.reload();
	});

	browserSync.init({
    server: 'dist',
    logFileChanges: false,
    middleware: [
			webpackDevMiddleware(bundler, {
				publicPath: webpackConfig.output.publicPath,
				stats: {colors: true}
			})
    ],
    plugins: ['bs-fullscreen-message'],
    files: [
			'./dist/static/*.css',
			'./dist/*.html'
    ]
	});
});

gulp.task('build', ['pages', 'styles', 'images', 'webpack:build']);
