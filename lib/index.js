const pkgDir = require('pkg-dir');
const globby = require('globby');
const debug = require('debug')('tagless-ember-components-codemod');
const chalk = require('chalk');

const SilentError = require('./silent-error');
const { transform } = require('./transform');

async function run() {
  let path = await pkgDir();
  await runForPath(path);
}

async function runForPath(path, options = {}) {
  debug('runForPath(%o, %o)', path, options);

  let log = options.log || console.log;

  // TODO check for ember-component-css dependency

  log(` 🔍  Searching for component files...`);
  let paths = await globby('app/components/**/*.js', { cwd: path });
  debug('componentPaths = %O', paths);

  for (let path of paths) {
    try {
      transform(path);
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
