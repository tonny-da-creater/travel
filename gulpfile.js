const { src, dest, series, parallel, lastRun, watch } = require('gulp');
const fs = require('fs').promises;
const plumber = require('gulp-plumber');
const fileinclude = require('gulp-file-include');
const replace = require('gulp-replace');
const cached = require('gulp-cached');
const svgSprite = require('gulp-svg-sprite');
const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server');
const webpackConfig = require('./webpack.config.js');
const sharp = require('sharp');
const path = require('path');
const svgo = require('gulp-svgo');
const through2 = require('through2');

const paths = {
  html: { src: 'src/*.html', dest: 'build/' },
  partials: { src: 'src/partials/*.html' },
  images: {
    src: 'src/images/**/*.{jpg,jpeg,png,gif,svg}',
    sprites: 'src/images/sprites/*.svg',
    dest: 'build/images/',
  },
  fonts: { src: 'src/fonts/**/*.{ttf,woff,woff2}', dest: 'build/fonts/' },
  scripts: { src: 'src/scripts/**/*.js', dest: 'build/scripts/' },
};

const clean = async () => {
  await fs.rm('build', { recursive: true, force: true });
};

const html = () => {
  const version = Date.now();
  return src(paths.html.src)
    .pipe(plumber())
    .pipe(fileinclude({ prefix: '@@', basepath: '@file' }))
    .pipe(replace(/style\.min\.css/g, `style.min.css?v=${version}`))
    .pipe(replace(/main\.min\.js/g, `main.min.js?v=${version}`))
    .pipe(dest(paths.html.dest));
};

const processImages = (options = { isProduction: false }) => {
  return through2.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    const extname = path.extname(file.path).toLowerCase();
    const basename = path.basename(file.path, extname);
    const outputDir = path.dirname(file.path).replace('src', 'build');
    (async () => {
      try {
        const effort = options.isProduction ? 4 : 1;
        const pngCompression = options.isProduction ? 9 : 6;
        if (extname === '.jpg' || extname === '.jpeg') {
          const buffer = await sharp(file.contents)
            .jpeg({ quality: 70, progressive: true })
            .toBuffer();
          file.contents = buffer;
          file.path = path.join(outputDir, `${basename}.jpg`);
          const webpBuffer = await sharp(buffer)
            .webp({ quality: 70, effort })
            .toBuffer();
          const webpFile = file.clone();
          webpFile.contents = webpBuffer;
          webpFile.path = path.join(outputDir, `${basename}.webp`);
          const avifBuffer = await sharp(buffer)
            .avif({ quality: 70, effort })
            .toBuffer();
          const avifFile = file.clone();
          avifFile.contents = avifBuffer;
          avifFile.path = path.join(outputDir, `${basename}.avif`);
          this.push(file);
          this.push(webpFile);
          this.push(avifFile);
          cb();
        } else if (extname === '.png') {
          const buffer = await sharp(file.contents)
            .png({ compressionLevel: pngCompression, quality: 70 })
            .toBuffer();
          file.contents = buffer;
          file.path = path.join(outputDir, `${basename}.png`);
          const webpBuffer = await sharp(buffer)
            .webp({ quality: 70, effort })
            .toBuffer();
          const webpFile = file.clone();
          webpFile.contents = webpBuffer;
          webpFile.path = path.join(outputDir, `${basename}.webp`);
          const avifBuffer = await sharp(buffer)
            .avif({ quality: 70, effort })
            .toBuffer();
          const avifFile = file.clone();
          avifFile.contents = avifBuffer;
          avifFile.path = path.join(outputDir, `${basename}.avif`);
          this.push(file);
          this.push(webpFile);
          this.push(avifFile);
          cb();
        } else if (extname === '.webp') {
          const buffer = await sharp(file.contents)
            .webp({ quality: 70, effort })
            .toBuffer();
          file.contents = buffer;
          file.path = path.join(outputDir, `${basename}.webp`);
          this.push(file);
          cb();
        } else if (extname === '.avif') {
          const buffer = await sharp(file.contents)
            .avif({ quality: 70, effort })
            .toBuffer();
          file.contents = buffer;
          file.path = path.join(outputDir, `${basename}.avif`);
          this.push(file);
          cb();
        } else if (extname === '.gif') {
          this.push(file);
          cb();
        } else if (extname === '.svg') {
          file.path = path.join(outputDir, `${basename}.svg`);
          this.push(file);
          cb();
        } else {
          cb();
        }
      } catch (err) {
        console.error(`Ошибка обработки ${file.path}: ${err.message}`);
        cb(new Error(`Error processing ${file.path}: ${err.message}`));
      }
    })();
  });
};

const imagesDev = () => {
  return src([paths.images.src, '!src/images/sprites/**/*'], { encoding: false })
    .pipe(plumber())
    .pipe(cached('images'))
    .pipe(processImages({ isProduction: false }))
    .pipe(dest(paths.images.dest));
};

const optimizeImages = () => {
  return src([paths.images.src, '!src/images/sprites/**/*'], { encoding: false })
    .pipe(plumber())
    .pipe(cached('images'))
    .pipe(processImages({ isProduction: true }))
    .pipe(dest(paths.images.dest));
};

const fonts = () => {
  return src(paths.fonts.src).pipe(dest(paths.fonts.dest));
};

const svgSpriteTask = () => {
  return src(paths.images.sprites, { nocache: true })
    .pipe(plumber())
    .pipe(cached('svgSprite'))
    .pipe(
      svgo({
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
                cleanupIDs: false,
                removeHiddenElems: false,
                removeEmptyAttrs: false,
                removeUselessDefs: true,
                removeDoctype: true,
                removeComments: true,
                convertShapeToPath: false,
                inlineStyles: false,
                mergePaths: false,
                cleanupAttrs: false,
                removeUselessStrokeAndFill: false,
                removeDimensions: false,
              },
            },
          },
          {
            name: 'convertColors',
            params: { currentColor: true },
          },
          {
            name: 'removeRasterImages',
            active: true,
          },
          {
            name: 'removeAttrs',
            params: { attrs: '(fill|stroke)' },
          },
          {
            name: 'addAttributesToSVGElement',
            params: { attributes: [{ fill: 'none' }] },
          },
        ],
      })
    )
    .pipe(
      svgSprite({
        mode: {
          symbol: {
            dest: 'sprites',
            sprite: 'sprites.svg',
            id: '%f',
            inline: false,
            spriteAttrs: { fill: 'none', style: null },
          },
        },
        shape: {
          transform: [
            {
              svgo: {
                plugins: [
                  {
                    name: 'removeUselessStrokeAndFill',
                    active: false,
                  },
                  {
                    name: 'removeAttrs',
                    params: { attrs: '(fill|stroke)' },
                  },
                ],
              },
            },
          ],
        },
      })
    )
    .pipe(dest(paths.images.dest));
};

const server = (done) => {
  const compiler = webpack(webpackConfig({ mode: 'development' }));
  const server = new webpackDevServer(
    webpackConfig({ mode: 'development' }).devServer,
    compiler
  );
  server.startCallback(() => {
    console.log('Webpack Dev Server running at http://localhost:8080');
    done();
  });
};

const buildWebpack = (done) => {
  webpack(webpackConfig({ mode: 'production' }), (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stats.toString({ colors: true }));
    done();
  });
};

const watchFiles = () => {
  watch([paths.html.src, paths.partials.src], series(html));
  watch(paths.images.src, series(imagesDev));
  watch(paths.scripts.src, series(buildWebpack));
};

const dev = series(
  clean,
  parallel(html, imagesDev, fonts, svgSpriteTask),
  parallel(server, watchFiles)
);

const build = series(
  clean,
  parallel(html, series(svgSpriteTask, optimizeImages), fonts),
  buildWebpack
);

exports.dev = dev;
exports.build = build;
exports.default = dev;