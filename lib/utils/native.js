const j = require('jscodeshift').withParser('ts');

const SilentError = require('../silent-error');

function addClassDecorator(classDeclaration, name, args) {
  let existing = findDecorator(classDeclaration, name);

  if (existing) {
    existing.value.expression.arguments = args;
  } else {
    if (classDeclaration.value.decorators === undefined) {
      classDeclaration.value.decorators = [];
    }
    classDeclaration.value.decorators.unshift(
      j.decorator(j.callExpression(j.identifier(name), args))
    );
  }
}

function isDecorator(path, name, withArgs) {
  let node = path.value;
  let isCall =
    node.expression.type === 'CallExpression' && node.expression.callee.type === 'Identifier';

  return (
    node.type === 'Decorator' &&
    ((isCall && node.expression.callee.name === name) ||
      (!isCall && node.expression.name === name)) &&
    (withArgs === undefined || (withArgs === true && isCall) || (withArgs === false && !isCall))
  );
}

function isProperty(path, name) {
  let node = path.value;
  return node.type === 'ClassProperty' && node.key.type === 'Identifier' && node.key.name === name;
}

function isMethod(path, name) {
  let node = path.value;
  return node.type === 'ClassMethod' && node.key.type === 'Identifier' && node.key.name === name;
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

function findDecorator(path, name, withArgs) {
  let decorators = path.get('decorators');
  if (decorators.value === undefined) {
    return;
  }

  let existing = decorators.filter(path => isDecorator(path, name, withArgs));

  if (existing.length > 0) {
    return existing[0];
  }
}

function findStringDecorator(path, name) {
  let decorator = findDecorator(path, name, true);

  if (!decorator) {
    return;
  }

  return decorator.value.expression.arguments[0].value;
}

function findTagName(classDeclaration) {
  let value = findStringDecorator(classDeclaration, 'tagName');
  if (value === undefined) {
    value = findStringProperty(classDeclaration.get('body', 'body'), 'tagName');
  }
  return value !== undefined && value !== null ? value : 'div';
}

function findElementId(path) {
  return findStringProperty(path, 'elementId');
}

function findStringArrayDecorator(path, name) {
  let decorator = findDecorator(path, name, true);
  if (!decorator) {
    return [];
  }

  let args = decorator.get('expression').value.arguments;

  return args.map(element => {
    if (element.type !== 'StringLiteral') {
      throw new SilentError(`Unexpected \`${name}\` value: ${j(args).toSource()}`);
    }

    return element.value;
  });
}

function findAttributeBindings(classDeclaration) {
  let attrBindings = new Map();
  for (let binding of findStringArrayDecorator(classDeclaration, 'attributeBindings')) {
    let [value, attr] = binding.split(':');
    attrBindings.set(attr || value, value);
  }

  j(classDeclaration)
    .find(j.ClassProperty)
    .forEach(path => {
      let value = path.node.key.name;
      let key = findStringDecorator(path, 'attribute');
      if (key === undefined) {
        let decorator = findDecorator(path, 'attribute', false);
        if (decorator) {
          key = value;
        }
      }
      if (key !== undefined) {
        attrBindings.set(key, value);
      }
    });

  return attrBindings;
}

function findClassNames(classDeclaration) {
  return findStringArrayDecorator(classDeclaration, 'classNames');
}

function findClassNameBindings(classDeclaration) {
  let classNameBindings = new Map();
  for (let binding of findStringArrayDecorator(classDeclaration, 'classNameBindings')) {
    let parts = binding.split(':');

    if (parts.length === 1) {
      throw new SilentError(`Unsupported non-boolean \`@classNameBindings\` value: ${binding}`);
    } else if (parts.length === 2) {
      classNameBindings.set(parts[0], [parts[1], null]);
    } else if (parts.length === 3) {
      classNameBindings.set(parts[0], [parts[1] || null, parts[2]]);
    } else {
      throw new SilentError(`Unexpected \`@classNameBindings\` value: ${binding}`);
    }
  }

  j(classDeclaration)
    .find(j.ClassProperty)
    .forEach(path => {
      let key = path.node.key.name;

      if (findDecorator(path, 'className', false)) {
        throw new SilentError(`Unsupported non-boolean \`@className\` for property: ${key}`);
      }
      let decorator = findDecorator(path, 'className', true);
      if (!decorator) {
        return;
      }

      let args = decorator.get('expression').value.arguments;
      let [truthy, falsy] = args.map(element => element.value);
      classNameBindings.set(key, [truthy || null, falsy || null]);
    });

  return classNameBindings;
}

function removeDecorator(root, classDeclaration, name, source) {
  let decorator = findDecorator(classDeclaration, name);
  if (decorator) {
    j(decorator).remove();
    removeImport(root, name, source);
  }
}

function ensureImport(root, name, source) {
  let body = root.get().value.program.body;

  let declaration = root.find(j.ImportDeclaration, {
    source: { value: source },
  });

  if (declaration.length) {
    if (
      declaration.find(j.ImportSpecifier, {
        imported: {
          name,
        },
      }).length === 0
    ) {
      declaration.get('specifiers').push(j.importSpecifier(j.identifier(name)));
    }
  } else {
    let importStatement = createImportStatement(source, null, [name]);
    body.unshift(importStatement);
    body[0].comments = body[1].comments;
    delete body[1].comments;
  }
}

function removeImport(root, name, source) {
  let declaration = root.find(j.ImportDeclaration, {
    source: { value: source },
  });

  if (declaration.length) {
    declaration
      .find(j.ImportSpecifier, {
        imported: {
          name,
        },
      })
      .remove();

    if (declaration.get().value.specifiers.length === 0) {
      declaration.remove();
    }
  }
}

// shamelessly taken from https://github.com/ember-codemods/ember-modules-codemod/blob/3afaab6b77fcb494873e2667f6e1bb14362f3845/transform.js#L607
function createImportStatement(source, imported, local) {
  let declaration, variable, idIdentifier, nameIdentifier;

  // if no variable name, return `import 'jquery'`
  if (!local) {
    declaration = j.importDeclaration([], j.literal(source));
    return declaration;
  }

  // multiple variable names indicates a destructured import
  if (Array.isArray(local)) {
    let variableIds = local.map(v => j.importSpecifier(j.identifier(v), j.identifier(v)));

    declaration = j.importDeclaration(variableIds, j.literal(source));
  } else {
    // else returns `import $ from 'jquery'`
    nameIdentifier = j.identifier(local); //import var name
    variable = j.importDefaultSpecifier(nameIdentifier);

    // if propName, use destructuring `import {pluck} from 'underscore'`
    if (imported && imported !== 'default') {
      idIdentifier = j.identifier(imported);
      variable = j.importSpecifier(idIdentifier, nameIdentifier); // if both are same, one is dropped...
    }

    declaration = j.importDeclaration([variable], j.literal(source));
  }

  return declaration;
}

module.exports = {
  addClassDecorator,
  isProperty,
  isMethod,
  findAttributeBindings,
  findClassNames,
  findClassNameBindings,
  findElementId,
  findTagName,
  findDecorator,
  removeDecorator,
  ensureImport,
  removeImport,
};
