const fs = require('fs');
const pkgDir = require('pkg-dir');
const globby = require('globby');
const debug = require('debug')('tagless-ember-components-codemod');
const chalk = require('chalk');

const SilentError = require('./silent-error');
const { transformPath } = require('./transform');

async function run() {
  let path = await pkgDir();
  await runForPath(path);
}

async function runForPath(path, options = {}) {
  debug('runForPath(%o, %o)', path, options);

  let log = options.log || console.log;

  log(` 🔍  Searching for component files...`);
  let paths = await globby(['app/components/**/*.js', 'addon/components/**/*.js'], { cwd: path });
  debug('componentPaths = %O', paths);

  let pkgContent = fs.readFileSync(`${path}/package.json`);
  let pkg = JSON.parse(pkgContent);
  let hasComponentCSS =
    pkg.dependencies['ember-component-css'] || pkg.devDependencies['ember-component-css'];

  for (let path of paths) {
    try {
      let tagName = transformPath(path, { hasComponentCSS });
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
