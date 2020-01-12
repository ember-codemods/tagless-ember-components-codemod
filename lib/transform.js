const fs = require('fs');
const path = require('path');
const j = require('jscodeshift').withParser('ts');
const _debug = require('debug')('tagless-ember-components-codemod');

const SilentError = require('./silent-error');
const transformClassicComponent = require('./transform/classic');
const transformTemplate = require('./transform/template');

function transformPath(componentPath, options) {
  let debug = (fmt, ...args) => _debug(`${componentPath}: ${fmt}`, ...args);

  let templatePath = guessTemplatePath(componentPath);
  if (!fs.existsSync(templatePath)) {
    throw new SilentError(`Could not find template at ${templatePath}`);
  }
  debug('templatePath: %o', templatePath);

  let source = fs.readFileSync(componentPath, 'utf8');
  let template = fs.readFileSync(templatePath, 'utf8');

  let result = transform(source, template, Object.assign({}, { debug }, options));

  if (result.tagName) {
    fs.writeFileSync(componentPath, result.source, 'utf8');
    fs.writeFileSync(templatePath, result.template, 'utf8');
  }

  return result.tagName;
}

function checkComponentType(root) {
  // find `export default Component.extend({ ... });` AST node
  let exportDefaultDeclarations = root.find(j.ExportDefaultDeclaration, {
    declaration: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { name: 'Component' },
        property: { name: 'extend' },
      },
    },
  });

  if (exportDefaultDeclarations.length === 1) {
    return 'classic';
  }
}

function transform(source, template, options = {}) {
  let root = j(source);
  let type = checkComponentType(root);
  let result;

  switch (type) {
    case 'classic':
      result = transformClassicComponent(root, options);
      break;
    default:
      throw new Error(
        `Unsupported component type. Only classic components (\`Component.extend({ ... }\`) are supported currently.`
      );
  }

  if (result) {
    let { newSource, attrs, tagName } = result;
    let newTemplate = transformTemplate(template, tagName, attrs);

    return { source: newSource, template: newTemplate, tagName };
  }

  return { source, template };
}

function guessTemplatePath(componentPath) {
  let isPods = path.basename(componentPath) === 'component.js';
  if (isPods) {
    return path.dirname(componentPath) + '/template.hbs';
  }

  return componentPath.replace('/components/', '/templates/components/').replace(/\.js$/, '.hbs');
}

module.exports = {
  transform,
  transformPath,
  guessTemplatePath,
};
