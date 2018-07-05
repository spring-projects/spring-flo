"use strict";

const shell = require('shelljs');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const PACKAGE = `spring-flo`;
const NPM_DIR = `dist`;
const TS_COMPILED_DIR = `${NPM_DIR}/out-tsc`;
const ESM2015_DIR = `${NPM_DIR}/esm2015`;
const ESM5_DIR = `${NPM_DIR}/esm5`;
const FESM2015_DIR = `${NPM_DIR}/fesm2015`;
const FESM5_DIR = `${NPM_DIR}/fesm5`;
const BUNDLES_DIR = `${NPM_DIR}/bundles`;
const OUT_DIR = `${NPM_DIR}/package`;
const OUT_DIR_ESM5 = `${NPM_DIR}/package/esm5`;

const gulp = require('gulp');
const inlineTemplates = require('gulp-inline-ng2-template');

/**
 * Inline templates configuration.
 * @see  https://github.com/ludohenin/gulp-inline-ng2-template
 */
const INLINE_TEMPLATES = {
  SRC: './src/lib/**/*.ts',
  DIST: './dist/package/lib',
  CONFIG: {
    base: './src/lib',
    target: 'es6',
    useRelativePaths: true
  }
};

shell.echo(`Start building...`);

shell.rm(`-Rf`, `${NPM_DIR}/*`);
shell.mkdir(`-p`, `./${ESM2015_DIR}`);
shell.mkdir(`-p`, `./${ESM5_DIR}`);
shell.mkdir(`-p`, `./${FESM2015_DIR}`);
shell.mkdir(`-p`, `./${FESM5_DIR}`);
shell.mkdir(`-p`, `./${BUNDLES_DIR}`);
shell.mkdir(`-p`, `./${OUT_DIR}`);

/* TSLint with Codelyzer */
// https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts
// https://github.com/mgechev/codelyzer
shell.echo(`Start TSLint`);
shell.exec(`tslint -p tsconfig.json -t stylish src/lib/**/*.ts`);
shell.echo(chalk.green(`TSLint completed`));


/**
 * Inline external HTML and SCSS templates into Angular component files.
 * @see: https://github.com/ludohenin/gulp-inline-ng2-template
 */
gulp.src(INLINE_TEMPLATES.SRC)
    .pipe(inlineTemplates(INLINE_TEMPLATES.CONFIG))
    .pipe(gulp.dest(INLINE_TEMPLATES.DIST)).on('end', compile);


function compile() {
    /* Try to process scss files  */
  // shell.echo(`Try to process scss files`);
  // if (shell.exec(`node-sass -r ${OUT_DIR} -o ${OUT_DIR}`).code === 0) {
  //   shell.rm(`-Rf`, `${OUT_DIR}/**/*.scss`);
  //   shell.ls(`${OUT_DIR}/**/*.css`).forEach(function (file) {
  //     shell.mv(file, file.replace('.css', '.scss'));
  //   });
  // }

  shell.cp('-Rf', ['*.json'], OUT_DIR);

  /* AoT compilation */
  shell.echo(`Start AoT compilation`);
  if (shell.exec(`ngc -p ${OUT_DIR}/tsconfig-build.json`).code !== 0) {
    shell.echo(chalk.red(`Error: AoT compilation failed`));
    shell.exit(1);
  }
  shell.echo(chalk.green(`AoT compilation completed`));

  shell.echo(`Copy ES2015 for package`);
  shell.cp(`-Rf`, [ `${TS_COMPILED_DIR}/*` ], `${ESM2015_DIR}`);

  /* BUNDLING PACKAGE */
  shell.echo(`Start bundling`);
  shell.echo(`Rollup package`);
  if (shell.exec(`rollup -c rollup.es.config.js -i ${TS_COMPILED_DIR}/${PACKAGE}.js -o ${FESM2015_DIR}/${PACKAGE}.js`).code !== 0) {
    shell.echo(chalk.red(`Error: Rollup package failed`));
    shell.exit(1);
  }

  shell.echo(`Produce ESM5/FESM5 versions`);
  shell.exec(`ngc -p ${OUT_DIR}/tsconfig-build.json --target es5 -d false --outDir ${OUT_DIR_ESM5} --sourceMap`);
  shell.cp(`-Rf`, [ `${OUT_DIR_ESM5}/*` ], `${ESM5_DIR}`);
  if (shell.exec(`rollup -c rollup.es.config.js -i ${OUT_DIR_ESM5}/${PACKAGE}.js -o ${FESM5_DIR}/${PACKAGE}.js`).code !== 0) {
    shell.echo(chalk.red(`Error: FESM5 version failed`));
    shell.exit(1);
  }

  shell.echo(`Run Rollup conversion on package`);
  if (shell.exec(`rollup -c rollup.config.js -i ${FESM5_DIR}/${PACKAGE}.js -o ${BUNDLES_DIR}/${PACKAGE}.umd.js`).code !== 0) {
    shell.echo(chalk.red(`Error: Rollup conversion failed`));
    shell.exit(1);
  }

  shell.echo(`Minifying`);
  shell.cd(`${BUNDLES_DIR}`);
  if (shell.exec(`uglifyjs ${PACKAGE}.umd.js -c --comments -o ${PACKAGE}.umd.min.js --source-map "includeSources=true,filename='${PACKAGE}.umd.min.js.map'"`).code !== 0) {
    shell.echo(chalk.red(`Error: Minifying failed`));
    shell.exit(1);
  }
  shell.cd(`..`);
  shell.cd(`..`);

  shell.echo(chalk.green(`Bundling completed`));

  shell.rm(`-Rf`, `${NPM_DIR}/package`);
  shell.rm(`-Rf`, `${TS_COMPILED_DIR}/**/*.js`);
  shell.rm(`-Rf`, `${TS_COMPILED_DIR}/**/*.js.map`);
  shell.rm(`-Rf`, `${ESM2015_DIR}/**/*.d.ts`);

  shell.cp(`-Rf`, [`package.json`, `LICENSE`, `README.md`], `${NPM_DIR}`);

  shell.sed('-i', `"private": true,`, `"private": false,`, `./${NPM_DIR}/package.json`);

  shell.echo(chalk.green(`End building`));

  const packagejson = path.join(NPM_DIR, 'package.json');
  const json = JSON.parse(fs.readFileSync(packagejson));
  if (json['scripts']) {
    delete json['scripts']['postinstall'];
  }
  const searchValue = './' + NPM_DIR + '/';
  const replaceValue = './';
  replacePropertyValue(json, 'main', searchValue, replaceValue);
  replacePropertyValue(json, 'module', searchValue, replaceValue);
  replacePropertyValue(json, 'es2015', searchValue, replaceValue);
  replacePropertyValue(json, 'typings', searchValue, replaceValue);
  replacePropertyValue(json, 'esm5', searchValue, replaceValue);
  replacePropertyValue(json, 'esm2015', searchValue, replaceValue);
  replacePropertyValue(json, 'fesm5', searchValue, replaceValue);
  replacePropertyValue(json, 'fesm2015', searchValue, replaceValue);
  fs.writeFileSync(packagejson, JSON.stringify(json, null, 2));

}

function replacePropertyValue(json, property, searchValue, newValue) {
  if (typeof json[property] === 'string') {
    json[property] = json[property].replace(searchValue, newValue);
  }
}
