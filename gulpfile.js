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
    src: 'src/images/**/*.{jpg,jpeg,png,gif,svg,webp,avif}',
    sprites: 'src/images/sprites/*.svg',
    dest: 'build/images/',
  },
  fonts: { src: 'src/fonts/**/*.{ttf,woff,woff2,eot,otf}', dest: 'build/fonts/' },
  scripts: { src: 'src/scripts/**/*.js', dest: 'build/scripts/' },
};

const clean = async () => {
  await fs.rm('build', { recursive: true, force: true });
};

// === HTML ===
const html = () => {
  const version = Date.now();
  return src(paths.html.src)
    .pipe(plumber())
    .pipe(fileinclude({ prefix: '@@', basepath: '@file' }))
    .pipe(replace(/\?v=\d+/g, ''))
    .pipe(replace(/style\.min\.css/g, `style.min.css?v=${version}`))
    .pipe(replace(/main\.min\.js/g, `main.min.js?v=${version}`))
    .pipe(dest(paths.html.dest));
};

// === Изображения (через through2) ===
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
        const effort = options.isProduction ? 6 : 1; // Увеличили effort для лучшего сжатия
        const pngCompression = options.isProduction ? 9 : 6;
        const imageQuality = options.isProduction ? 60 : 70; // Снижено для production

        if (extname === '.jpg' || extname === '.jpeg') {
          const buffer = await sharp(file.contents).jpeg({ quality: imageQuality, progressive: true }).toBuffer();
          file.contents = buffer;
          file.path = path.join(outputDir, `${basename}.jpg`);

          const webpBuffer = await sharp(buffer).webp({ quality: imageQuality, effort }).toBuffer();
          const webpFile = file.clone();
          webpFile.contents = webpBuffer;
          webpFile.path = path.join(outputDir, `${basename}.webp`);

          const avifBuffer = await sharp(buffer).avif({ quality: imageQuality, effort }).toBuffer();
          const avifFile = file.clone();
          avifFile.contents = avifBuffer;
          avifFile.path = path.join(outputDir, `${basename}.avif`);

          this.push(file);
          this.push(webpFile);
          this.push(avifFile);
          cb();
        } else if (extname === '.png') {
          const buffer = await sharp(file.contents).png({ compressionLevel: pngCompression, quality: imageQuality }).toBuffer();
          file.contents = buffer;
          file.path = path.join(outputDir, `${basename}.png`);

          const webpBuffer = await sharp(buffer).webp({ quality: imageQuality, effort }).toBuffer();
          const webpFile = file.clone();
          webpFile.contents = webpBuffer;
          webpFile.path = path.join(outputDir, `${basename}.webp`);

          const avifBuffer = await sharp(buffer).avif({ quality: imageQuality, effort }).toBuffer();
          const avifFile = file.clone();
          avifFile.contents = avifBuffer;
          avifFile.path = path.join(outputDir, `${basename}.avif`);

          this.push(file);
          this.push(webpFile);
          this.push(avifFile);
          cb();
        } else if (extname === '.webp' || extname === '.avif') {
          const format = extname === '.webp' ? 'webp' : 'avif';
          const buffer = await sharp(file.contents)[format]({ quality: imageQuality, effort }).toBuffer();
          file.contents = buffer;
          file.path = path.join(outputDir, `${basename}${extname}`);
          this.push(file);
          cb();
        } else if (extname === '.gif' || extname === '.svg') {
          file.path = path.join(outputDir, path.basename(file.path));
          this.push(file);
          cb();
        } else {
          cb();
        }
      } catch (err) {
        console.error(`Ошибка обработки ${file.path}: ${err.message}`);
        cb(new Error(`Error processing ${file.path}`));
      }
    })();
  });
};

const imagesDev = () => {
  return src([paths.images.src, '!src/images/sprites/**/*'], { encoding: false, since: lastRun(imagesDev) })
    .pipe(plumber())
    .pipe(cached('images'))
    .pipe(processImages({ isProduction: false }))
    .pipe(dest(paths.images.dest, { overwrite: false })); // ← НЕ УДАЛЯЕТ sprites/
};

const optimizeImages = () => {
  return src([paths.images.src, '!src/images/sprites/**/*'], { encoding: false })
    .pipe(plumber())
    .pipe(processImages({ isProduction: true }))
    .pipe(dest(paths.images.dest, { overwrite: false })); // ← НЕ УДАЛЯЕТ sprites/
};

// === Шрифты ===
const fonts = () => {
  return src(paths.fonts.src, { since: lastRun(fonts), encoding: false })
    .pipe(plumber())
    .pipe(dest(paths.fonts.dest));
};

// === SVG Sprite ===
const svgSpriteTask = () => {
  return src(paths.images.sprites, { nocache: true }) // ← Отключаем кэш!
    .pipe(plumber())
    .pipe(svgo({
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              cleanupIDs: false,
              removeUselessStrokeAndFill: false,
            },
          },
        },
        {
          name: 'convertColors',
          params: { currentColor: true }, // ← Конвертируем в currentColor
        },
        {
          name: 'removeAttrs',
          params: { attrs: '(fill|stroke)' }, // ← Удаляем fill/stroke
        },
        {
          name: 'addAttributesToSVGElement',
          params: { attributes: [{ fill: 'none' }] }, // ← Добавляем fill="none"
        },
      ],
    }))
    .pipe(svgSprite({
      mode: {
        symbol: {
          dest: 'sprites',
          sprite: 'sprites.svg',
          inline: false,
          spriteAttrs: { fill: 'none', style: null }, // ← Атрибуты спрайта
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
                  params: { attrs: '(fill|stroke)' }, // ← Двойная очистка
                },
              ],
            },
          },
        ],
      },
    }))
    .pipe(dest(paths.images.dest));
};

// === Webpack Dev Server ===
const server = (done) => {
  const config = webpackConfig({ mode: 'development' });
  const compiler = webpack(config);
  const server = new webpackDevServer(config.devServer, compiler);
  server.startCallback(() => {
    console.log('Dev Server: http://localhost:8080');
    done();
  });
};

const buildWebpack = (done) => {
  webpack(webpackConfig({ mode: 'production' }), (err, stats) => {
    if (err || stats.hasErrors()) {
      console.error(err || stats.toString({ colors: true }));
    } else {
      console.log(stats.toString({ colors: true }));
    }
    done();
  });
};

// === Watch ===
const watchFiles = () => {
  watch([paths.html.src, paths.partials.src], html);
  watch([paths.images.src, '!src/images/sprites/**/*'], imagesDev);
  watch(paths.images.sprites, svgSpriteTask);
  watch(paths.fonts.src, fonts);
  watch(paths.scripts.src, buildWebpack);
};

// === Задачи ===
const dev = series(
  clean,
  parallel(html, fonts, svgSpriteTask, imagesDev), // ← svgSpriteTask ДО imagesDev
  parallel(server, watchFiles)
);

const build = series(
  clean,
  parallel(html, fonts, svgSpriteTask), // ← svgSpriteTask ДО optimizeImages
  optimizeImages,                       // ← потом
  buildWebpack
);

exports.dev = dev;
exports.build = build;
exports.default = dev;