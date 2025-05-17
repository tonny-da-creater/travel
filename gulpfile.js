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
  images: { src: 'src/images/**/*.{jpg,jpeg,png,gif,svg}', sprites: 'src/images/sprites/*.svg', dest: 'build/images/' },
  fonts: { src: 'src/fonts/**/*.{ttf,woff,woff2}', dest: 'build/fonts/' },
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

const imagesDev = () => {
  return src([paths.images.src, '!src/images/sprites/**/*'], { since: lastRun(imagesDev) })
    .pipe(plumber())
    .pipe(cached('images'))
    .pipe(dest(paths.images.dest));
};

const optimizeImages = () => {
  return src([paths.images.src, '!src/images/sprites/**/*'], { encoding: false })
    .pipe(plumber())
    .pipe(cached('images'))
    .pipe(
      through2.obj(function (file, enc, cb) {
        if (file.isNull()) {
          this.push(file);
          return cb();
        }

        const extname = path.extname(file.path).toLowerCase();
        const basename = path.basename(file.path, extname);
        const outputDir = path.dirname(file.path);

        (async () => {
          try {
            if (extname === '.jpg' || extname === '.jpeg') {
              // Оптимизация JPEG
              const buffer = await sharp(file.contents)
                .jpeg({ quality: 80, progressive: true })
                .toBuffer();
              file.contents = buffer;

              // Создание WebP-версии
              const webpBuffer = await sharp(file.contents)
                .webp({ quality: 80 })
                .toBuffer();
              const webpFile = file.clone();
              webpFile.contents = webpBuffer;
              webpFile.path = path.join(outputDir, `${basename}.webp`);

              // Создание AVIF-версии
              const avifBuffer = await sharp(file.contents)
                .avif({ quality: 50, effort: 4 }) // effort: 0-9, меньшее = быстрее
                .toBuffer();
              const avifFile = file.clone();
              avifFile.contents = avifBuffer;
              avifFile.path = path.join(outputDir, `${basename}.avif`);

              this.push(file);
              this.push(webpFile);
              this.push(avifFile);
              cb();
            } else if (extname === '.png') {
              // Оптимизация PNG
              const buffer = await sharp(file.contents)
                .png({ compressionLevel: 9, quality: 80 })
                .toBuffer();
              file.contents = buffer;

              // Создание WebP-версии
              const webpBuffer = await sharp(file.contents)
                .webp({ quality: 80 })
                .toBuffer();
              const webpFile = file.clone();
              webpFile.contents = webpBuffer;
              webpFile.path = path.join(outputDir, `${basename}.webp`);

              // Создание AVIF-версии
              const avifBuffer = await sharp(file.contents)
                .avif({ quality: 50, effort: 4 })
                .toBuffer();
              const avifFile = file.clone();
              avifFile.contents = avifBuffer;
              avifFile.path = path.join(outputDir, `${basename}.avif`);

              this.push(file);
              this.push(webpFile);
              this.push(avifFile);
              cb();
            } else if (extname === '.webp') {
              // Оптимизация WebP
              const buffer = await sharp(file.contents)
                .webp({ quality: 80 })
                .toBuffer();
              file.contents = buffer;
              this.push(file);
              cb();
            } else if (extname === '.avif') {
              // Оптимизация AVIF
              const buffer = await sharp(file.contents)
                .avif({ quality: 50, effort: 4 })
                .toBuffer();
              file.contents = buffer;
              this.push(file);
              cb();
            } else {
              this.push(file);
              cb();
            }
          } catch (err) {
            cb(new Error(`Error processing ${file.path}: ${err.message}`));
          }
        })();
      })
    )
    .pipe(dest(paths.images.dest));
};

const fonts = () => {
  return src(paths.fonts.src)
    .pipe(dest(paths.fonts.dest));
};

const svgSpriteTask = () => {
  return src(paths.images.sprites, { nocache: true })
    .pipe(plumber())
    .pipe(svgo({
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
              removeUselessStrokeAndFill: false
            }
          }
        },
        {
          name: 'convertColors',
          params: {
            currentColor: true
          }
        },
        { name: 'removeRasterImages', active: true },
        { name: 'removeAttrs', params: { attrs: '(fill-rule|clip-rule|fill)' } } // Удаляем fill из <symbol>
      ]
    }))
    .pipe(svgSprite({
      mode: {
        symbol: {
          dest: 'sprites',
          sprite: 'sprite.svg',
          id: '%f',
          inline: false,
          spriteAttrs: {
            fill: null,
            style: null // Дополнительно убираем лишние стили
          }
        }
      },
      shape: {
        transform: [
          {
            svgo: {
              plugins: [
                { name: 'removeUselessStrokeAndFill', active: false },
                { name: 'removeAttrs', params: { attrs: '(fill-rule|clip-rule|fill)' } }
              ]
            }
          }
        ]
      }
    }))
    .pipe(dest(paths.images.dest));
};

const server = (done) => {
  const compiler = webpack(webpackConfig({ mode: 'development' }));
  const server = new webpackDevServer(webpackConfig({ mode: 'development' }).devServer, compiler);
  server.startCallback(() => {
    console.log('Webpack Dev Server running at http://localhost:8080');
    done();
  });
};

const buildWebpack = (done) => {
  webpack(webpackConfig({ mode: 'production' }), (err, stats) => {
    if (err) { console.error(err); return; }
    console.log(stats.toString({ colors: true }));
    done();
  });
};

const watchFiles = () => {
  watch([paths.html.src, paths.partials.src], series(html));
};

const dev = series(clean, parallel(html, imagesDev, fonts, svgSpriteTask), parallel(server, watchFiles));
const build = series(clean, parallel(html, series(svgSpriteTask, optimizeImages), fonts), buildWebpack);

exports.dev = dev;
exports.build = build;
exports.default = dev;

