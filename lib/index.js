const pkgDir = require('pkg-dir');
const globby = require('globby');
const debug = require('debug')('tagless-ember-components-codemod');

async function run() {
  let path = await pkgDir();
  await runForPath(path)
}

async function runForPath(path, options = {}) {
  debug('runForPath(%o, %o)', path, options);

  let log = options.log || console.log;

  // TODO check for ember-component-css dependency

  log(` 🔍  Searching for component files...`);
  let componentPaths = await globby('app/components/*.js', { cwd: path });
  debug('componentPaths = %O', componentPaths);

  for (let componentPath of componentPaths) {
    // TODO skip tagless components (silent)
    // TODO skip components that use `this.element` (warn)
    // TODO skip components that use `click()` etc. (warn)

    // TODO analyze `tagName`, `attributeBindings`, `classNames`, ...
    // TODO skip on error (warn incl. please report)

    // TODO find corresponding template files
    // TODO skip if not found (warn)

    // TODO set `tagName: ''` and remove `attributeBindings`, `classNames`, ...
    // TODO wrap existing template with root element
  }
}

module.exports = { run };
