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

  let templatePaths = possibleTemplatePaths(componentPath);
  let templatePath = templatePaths.find(fs.existsSync);
  if (!templatePath) {
    throw new SilentError('Could not find corresponding template file');
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
  let classExport = root.find(j.ExportDefaultDeclaration, {
    declaration: {
      type: 'ClassDeclaration',
      superClass: {
        type: 'Identifier',
      },
    },
  });

  if (classExport.length === 0) {
    // find `export default class FooComponent extends Component.extends(SomeMixin) {}` AST node
    classExport = root.find(j.ExportDefaultDeclaration, {
      declaration: {
        type: 'ClassDeclaration',
        superClass: {
          type: 'CallExpression',
        },
      },
    });
  }

  if (classExport.length === 1) {
    const superClass = classExport.get().node.declaration.superClass;
    let className = superClass.name || superClass.callee.object.name;
    if (
      root.find(j.ImportDeclaration, node => {
        return (
          node.source.value === '@ember/component' &&
          node.specifiers.find(
            specifier =>
              specifier.type === 'ImportDefaultSpecifier' && specifier.local.name === className
          )
        );
      }).length === 1
    ) {
      return 'native';
    }

    throw new SilentError(`Unsupported parent class, can only extend from Ember.Component`);
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

function possibleTemplatePaths(componentPath) {
  let classicTemplatePath = componentPath
    .replace('/components/', '/templates/components/')
    .replace(/\.(js|ts)$/, '.hbs');

  let colocatedTemplatePath = componentPath.replace(/\.(js|ts)$/, '.hbs');

  let templatePaths = [colocatedTemplatePath, classicTemplatePath];

  let isPods = path.basename(componentPath, path.extname(componentPath)) === 'component';
  if (isPods) {
    let podsTemplatePath = path.dirname(componentPath) + '/template.hbs';
    templatePaths.unshift(podsTemplatePath);
  }

  return templatePaths;
}

module.exports = {
  transform,
  transformPath,
  possibleTemplatePaths,
};
