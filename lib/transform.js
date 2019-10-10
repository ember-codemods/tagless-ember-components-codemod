const fs = require('fs');
const stringUtils = require('ember-cli-string-utils');
const j = require('jscodeshift').withParser('ts');
const debug = require('debug')('tagless-ember-components-codemod');

const SilentError = require('./silent-error');

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

function transform(componentPath) {
  let source = fs.readFileSync(componentPath, 'utf8');

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
    debug(`${componentPath}: tagName: %o -> skip`, tagName);
    return;
  }

  debug(`${componentPath}: tagName: %o`, tagName);

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
  debug(`${componentPath}: elementId: %o`, elementId);

  let attributeBindings = findAttributeBindings(properties);
  debug(`${componentPath}: attributeBindings: %o`, attributeBindings);

  let classNames = findClassNames(properties);
  debug(`${componentPath}: classNames: %o`, classNames);

  let classNameBindings = findClassNameBindings(properties);
  debug(`${componentPath}: classNameBindings: %o`, classNameBindings);

  // TODO find corresponding template files
  // TODO skip if not found (warn)

  // TODO set `tagName: ''` and remove `attributeBindings`, `classNames`, ...
  // TODO wrap existing template with root element
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
      classNameBindings.set(parts[0], [stringUtils.dasherize(parts[0]), null]);
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

module.exports = {
  transform,
  findTagName,
  findElementId,
  findAttributeBindings,
  findClassNames,
  findClassNameBindings,
};
