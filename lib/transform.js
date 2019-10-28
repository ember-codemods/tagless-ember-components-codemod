const fs = require('fs');
const path = require('path');
const templateRecast = require('ember-template-recast');
const j = require('jscodeshift').withParser('ts');
const _debug = require('debug')('tagless-ember-components-codemod');

const SilentError = require('./silent-error');

const b = templateRecast.builders;

const EVENT_HANDLER_METHODS = [
  // Touch events
  'touchStart',
  'touchMove',
  'touchEnd',
  'touchCancel',

  // Keyboard events
  'keyDown',
  'keyUp',
  'keyPress',

  // Mouse events
  'mouseDown',
  'mouseUp',
  'contextMenu',
  'click',
  'doubleClick',
  'focusIn',
  'focusOut',

  // Form events
  'submit',
  'change',
  'focusIn',
  'focusOut',
  'input',

  // Drag and drop events
  'dragStart',
  'drag',
  'dragEnter',
  'dragLeave',
  'dragOver',
  'dragEnd',
  'drop',
];

const PLACEHOLDER = '@@@PLACEHOLDER@@@';

function transformPath(componentPath) {
  let debug = (fmt, ...args) => _debug(`${componentPath}: ${fmt}`, ...args);

  let templatePath = guessTemplatePath(componentPath);
  if (!fs.existsSync(templatePath)) {
    throw new SilentError(`Could not find template at ${templatePath}`);
  }
  debug('templatePath: %o', templatePath);

  let source = fs.readFileSync(componentPath, 'utf8');
  let template = fs.readFileSync(templatePath, 'utf8');

  let result = transform(source, template, { debug });

  if (result.tagName) {
    fs.writeFileSync(componentPath, result.source, 'utf8');
    fs.writeFileSync(templatePath, result.template, 'utf8');
  }

  return result.tagName;
}

function transform(source, template, options = {}) {
  let debug = options.debug || _debug;

  let root = j(source);

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

  if (exportDefaultDeclarations.length !== 1) {
    throw new SilentError(`Could not find \`export default Component.extend({ ... });\``);
  }

  let exportDefaultDeclaration = exportDefaultDeclarations.get();

  // find first `{ ... }` inside `Component.extend()` arguments
  let extendObjectArgs = exportDefaultDeclaration
    .get('declaration', 'arguments')
    .filter(path => path.value.type === 'ObjectExpression');

  let objectArg = extendObjectArgs[0];
  if (!objectArg) {
    throw new SilentError(
      `Could not find object argument in \`export default Component.extend({ ... });\``
    );
  }

  // find `tagName` property if it exists
  let properties = objectArg.get('properties');
  let tagName = findTagName(properties);

  // skip tagless components (silent)
  if (tagName === '') {
    debug('tagName: %o -> skip', tagName);
    return { source, template };
  }

  debug('tagName: %o', tagName);

  // skip components that use `this.element`
  let thisElementPaths = j(objectArg).find(j.MemberExpression, {
    object: { type: 'ThisExpression' },
    property: { name: 'element' },
  });
  if (thisElementPaths.length !== 0) {
    throw new SilentError(`Using \`this.element\` is not supported in tagless components`);
  }

  // skip components that use `click()` etc.
  for (let methodName of EVENT_HANDLER_METHODS) {
    let handlerMethod = properties.filter(path => isMethod(path, methodName))[0];
    if (handlerMethod) {
      throw new SilentError(`Using \`${methodName}()\` is not supported in tagless components`);
    }
  }

  // analyze `elementId`, `attributeBindings`, `classNames` and `classNameBindings`
  let elementId = findElementId(properties);
  debug('elementId: %o', elementId);

  let attributeBindings = findAttributeBindings(properties);
  debug('attributeBindings: %o', attributeBindings);

  let classNames = findClassNames(properties);
  debug('classNames: %o', classNames);

  let classNameBindings = findClassNameBindings(properties);
  debug('classNameBindings: %o', classNameBindings);

  let templateAST = templateRecast.parse(template);

  // set `tagName: ''`
  let tagNamePath = j(properties)
    .find(j.ObjectProperty)
    .filter(path => path.parentPath === properties)
    .filter(path => isProperty(path, 'tagName'));

  if (tagNamePath.length === 1) {
    j(tagNamePath.get('value')).replaceWith(j.stringLiteral(''));
  } else {
    properties.unshift(j.objectProperty(j.identifier('tagName'), j.stringLiteral('')));
  }

  // remove `elementId`, `attributeBindings`, `classNames` and `classNameBindings`
  j(properties)
    .find(j.ObjectProperty)
    .filter(path => path.parentPath === properties)
    .filter(
      path =>
        isProperty(path, 'elementId') ||
        isProperty(path, 'attributeBindings') ||
        isProperty(path, 'classNames') ||
        isProperty(path, 'classNameBindings')
    )
    .remove();

  let newSource = root.toSource();

  // wrap existing template with root element
  let classNodes = [];
  if (options.hasComponentCSS) {
    classNodes.push(b.mustache('styleNamespace'));
  }
  for (let className of classNames) {
    classNodes.push(b.text(className));
  }
  classNameBindings.forEach(([truthy, falsy], property) => {
    if (!truthy) {
      classNodes.push(b.mustache(`unless this.${property} "${falsy}"`));
    } else {
      classNodes.push(b.mustache(`if this.${property} "${truthy}"${falsy ? ` "${falsy}"` : ''}`));
    }
  });

  let attrs = [];
  if (elementId) {
    attrs.push(b.attr('id', b.text(elementId)));
  }
  attributeBindings.forEach((value, key) => {
    attrs.push(b.attr(key, b.mustache(`this.${value}`)));
  });
  if (classNodes.length === 1) {
    attrs.push(b.attr('class', classNodes[0]));
  } else if (classNodes.length !== 0) {
    let parts = [];
    classNodes.forEach((node, i) => {
      if (i !== 0) parts.push(b.text(' '));
      parts.push(node);
    });

    attrs.push(b.attr('class', b.concat(parts)));
  }
  attrs.push(b.attr('...attributes', b.text('')));

  templateAST.body = [
    b.element(tagName, {
      attrs,
      children: [b.text(`\n${PLACEHOLDER}\n`)],
    }),
  ];

  let newTemplate = templateRecast.print(templateAST).replace(PLACEHOLDER, indentLines(template));

  return { source: newSource, template: newTemplate, tagName };
}

function isProperty(path, name) {
  let node = path.value;
  return node.type === 'ObjectProperty' && node.key.type === 'Identifier' && node.key.name === name;
}

function isMethod(path, name) {
  let node = path.value;
  return node.type === 'ObjectMethod' && node.key.type === 'Identifier' && node.key.name === name;
}

function findStringProperty(properties, name, defaultValue = null) {
  let propertyPath = properties.filter(path => isProperty(path, name))[0];
  if (!propertyPath) {
    return defaultValue;
  }

  let valuePath = propertyPath.get('value');
  if (valuePath.value.type !== 'StringLiteral') {
    throw new SilentError(`Unexpected \`${name}\` value: ${j(valuePath).toSource()}`);
  }

  return valuePath.value.value;
}

function findTagName(properties) {
  return findStringProperty(properties, 'tagName', 'div');
}

function findElementId(properties) {
  return findStringProperty(properties, 'elementId');
}

function findStringArrayProperties(properties, name) {
  let propertyPath = properties.filter(path => isProperty(path, name))[0];
  if (!propertyPath) {
    return [];
  }

  let arrayPath = propertyPath.get('value');
  if (arrayPath.value.type !== 'ArrayExpression') {
    throw new SilentError(`Unexpected \`${name}\` value: ${j(arrayPath).toSource()}`);
  }

  return arrayPath.get('elements').value.map(element => {
    if (element.type !== 'StringLiteral') {
      throw new SilentError(`Unexpected \`${name}\` value: ${j(arrayPath).toSource()}`);
    }

    return element.value;
  });
}

function findAttributeBindings(properties) {
  let attrBindings = new Map();
  for (let binding of findStringArrayProperties(properties, 'attributeBindings')) {
    let [from, to] = binding.split(':');
    attrBindings.set(from, to || from);
  }

  return attrBindings;
}

function findClassNames(properties) {
  return findStringArrayProperties(properties, 'classNames');
}

function findClassNameBindings(properties) {
  let classNameBindings = new Map();
  for (let binding of findStringArrayProperties(properties, 'classNameBindings')) {
    let parts = binding.split(':');

    if (parts.length === 1) {
      throw new SilentError(`Unsupported non-boolean \`classNameBindings\` value: ${binding}`);
    } else if (parts.length === 2) {
      classNameBindings.set(parts[0], [parts[1], null]);
    } else if (parts.length === 3) {
      classNameBindings.set(parts[0], [parts[1] || null, parts[2]]);
    } else {
      throw new SilentError(`Unexpected \`classNameBindings\` value: ${binding}`);
    }
  }

  return classNameBindings;
}

function guessTemplatePath(componentPath) {
  let isPods = path.basename(componentPath) === 'component.js';
  if (isPods) {
    return path.dirname(componentPath) + '/template.hbs';
  }

  return componentPath.replace('/components/', '/templates/components/').replace(/\.js$/, '.hbs');
}

function indentLines(content) {
  return content
    .split('\n')
    .map(it => `  ${it}`)
    .join('\n');
}

module.exports = {
  transform,
  transformPath,
  findTagName,
  findElementId,
  findAttributeBindings,
  findClassNames,
  findClassNameBindings,
  guessTemplatePath,
};
