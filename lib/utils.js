const j = require('jscodeshift').withParser('ts');

const SilentError = require('./silent-error');

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

function findAriaRole(properties) {
  return findStringProperty(properties, 'ariaRole');
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
    let [value, attr] = binding.split(':');
    attrBindings.set(attr || value, value);
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

function indentLines(content) {
  return content
    .split('\n')
    .map(it => `  ${it}`)
    .join('\n');
}

module.exports = {
  isProperty,
  isMethod,
  findStringProperty,
  findStringArrayProperties,
  findAriaRole,
  findAttributeBindings,
  findClassNames,
  findClassNameBindings,
  findElementId,
  findTagName,
  indentLines,
};
