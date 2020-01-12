const j = require('jscodeshift').withParser('ts');
const _debug = require('debug')('tagless-ember-components-codemod');
const templateRecast = require('ember-template-recast');

const SilentError = require('../silent-error');
const {
  findTagName,
  findElementId,
  findClassNames,
  findClassNameBindings,
  findAttributeBindings,
  isMethod,
  isProperty,
} = require('../utils');

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

module.exports = function transformClassicComponent(root, options) {
  let debug = options.debug || _debug;

  let exportDefaultDeclarations = root.find(j.ExportDefaultDeclaration);

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
    return;
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

  // skip components that use `this.elementId`
  let thisElementIdPaths = j(objectArg).find(j.MemberExpression, {
    object: { type: 'ThisExpression' },
    property: { name: 'elementId' },
  });
  if (thisElementIdPaths.length !== 0) {
    throw new SilentError(`Using \`this.elementId\` is not supported in tagless components`);
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

  return { newSource, attrs, tagName };
};
