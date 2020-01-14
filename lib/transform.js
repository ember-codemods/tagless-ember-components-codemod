const fs = require('fs');
const path = require('path');
const j = require('jscodeshift').withParser('ts');
const _debug = require('debug')('tagless-ember-components-codemod');

const SilentError = require('./silent-error');
const transformClassicComponent = require('./transform/classic');
const transformNativeComponent = require('./transform/native');
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
  if (
    root.find(j.ExportDefaultDeclaration, {
      declaration: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'Component' },
          property: { name: 'extend' },
        },
      },
    }).length === 1
  ) {
    return 'classic';
  }

  // find `export default class FooComponent extends Component {}` AST node
  if (
    root.find(j.ExportDefaultDeclaration, {
      declaration: {
        type: 'ClassDeclaration',
        superClass: {
          type: 'Identifier',
          name: 'Component',
        },
      },
    }).length === 1
  ) {
    return 'native';
  }
}

function transform(source, template, options = {}) {
  let root = j(source);
  let type = checkComponentType(root);
  let result;

  if (type === 'classic') {
    result = transformClassicComponent(root, options);
  } else if (type === 'native') {
    result = transformNativeComponent(root, options);
  } else {
    throw new SilentError(`Unsupported component type.`);
  }

  if (result) {
    let { newSource, tagName } = result;
    let newTemplate = transformTemplate(template, result, options);

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
