const pkgDir = require('pkg-dir');
const globby = require('globby');
const debug = require('debug')('tagless-ember-components-codemod');

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
  let componentPaths = await globby('app/components/**/*.js', { cwd: path });
  debug('componentPaths = %O', componentPaths);

  for (let componentPath of componentPaths) {
    transform(componentPath);
  }

  debug('runForPath() finished');
}

module.exports = { run };
