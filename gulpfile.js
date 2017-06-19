const gulp = require('gulp');
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

gulp.task('pages', function () {
    const options = {
      batch : ['./src/templates/partials']
    }

		return gulp.src('src/templates/pages/*.@(html|hbs)')
			.pipe(handlebars(null, options))
			.pipe(production(htmlmin({collapseWhitespace: true})))
			.pipe(gulp.dest('./dist/'));
});
gulp.task('pages:watch', function () {
  gulp.watch('./src/templates/**/*', ['pages']);
});

gulp.task('styles', function () {
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
});
gulp.task('styles:watch', function () {
  gulp.watch('./src/styles/**/*.scss', ['styles']);
});

gulp.task('images', () =>
    gulp.src('src/asstes/img/*')
			.pipe(imagemin())
			.pipe(gulp.dest('dist/static/img'))
);
gulp.task('images:watch', function () {
  gulp.watch('./src/assets/img/*', ['images']);
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

gulp.task('default', ['styles:watch', 'pages:watch', 'images:watch'], function() {
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

gulp.task('build', ['pages', 'styles', 'images', 'webpack:build'], function(callback) {
	callback();
});
