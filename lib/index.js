const fs = require('fs');
const pkgDir = require('pkg-dir');
const globby = require('globby');
const debug = require('debug')('tagless-ember-components-codemod');
const chalk = require('chalk');

const SilentError = require('./silent-error');
const { transformPath } = require('./transform');

async function run(argv) {
  let patterns = argv.slice(2);
  if (patterns.length !== 0) {
    await runForGlobs(patterns, process.cwd());
  } else {
    let baseDir = await pkgDir();
    await runForPath(baseDir);
  }
}

async function runForPath(path, options = {}) {
  debug('runForPath(%o, %o)', path, options);

  let patterns = ['app/components/**/*.js', 'addon/components/**/*.js'];
  await runForGlobs(patterns, path, options);
}

async function runForGlobs(patterns, cwd, options = {}) {
  debug('runForGlobs(%o, %o, %o)', patterns, cwd, options);

  let log = options.log || console.log;

  log(` 🔍  Searching for component files...`);
  let paths = await globby(patterns, {
    cwd,
    expandDirectories: {
      extensions: ['js'],
    },
  });
  debug('componentPaths = %O', paths);

  let packageRoot = await pkgDir(cwd);
  let pkgContent = fs.readFileSync(`${packageRoot}/package.json`);
  let pkg = JSON.parse(pkgContent);
  let hasComponentCSS =
    (pkg.dependencies && pkg.dependencies['ember-component-css']) ||
    (pkg.devDependencies && pkg.devDependencies['ember-component-css']);
  let hasTestSelectors =
    (pkg.dependencies && pkg.dependencies['ember-test-selectors']) ||
    (pkg.devDependencies && pkg.devDependencies['ember-test-selectors']);

  for (let path of paths) {
    try {
      let tagName = transformPath(path, { hasComponentCSS, hasTestSelectors });
      if (tagName) {
        log(chalk.green(`${chalk.dim(path)}: <${tagName}>...</${tagName}>`));
      } else {
        log(`${chalk.dim(path)}: skipping tagless component`);
      }
    } catch (error) {
      if (error instanceof SilentError) {
        log(chalk.yellow(`${chalk.dim(path)}: ${error.message}`));
      } else {
        log(chalk.red(`${chalk.dim(path)}: ${error.stack}`));
      }
    }
  }

  debug('runForPath() finished');
}

module.exports = { run };
