const j = require('jscodeshift').withParser('ts');
const _debug = require('debug')('tagless-ember-components-codemod');
const templateRecast = require('ember-template-recast');

const SilentError = require('../silent-error');
const {
  addClassDecorator,
  findTagName,
  findElementId,
  findDecorator,
  findClassNames,
  findClassNameBindings,
  findAttributeBindings,
  isMethod,
  ensureImport,
  removeImport,
  isProperty,
} = require('../utils/native');

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

module.exports = function transformNativeComponent(root, options) {
  let debug = options.debug || _debug;

  let exportDefaultDeclarations = root.find(j.ExportDefaultDeclaration);

  if (exportDefaultDeclarations.length !== 1) {
    throw new SilentError(
      `Could not find \`export default class SomeComponent extends Component { ... }\``
    );
  }

  let exportDefaultDeclaration = exportDefaultDeclarations.get();
  let classDeclaration = exportDefaultDeclaration.get('declaration');
  // find class body
  let classBody = classDeclaration.get('body', 'body');

  // find `tagName` property if it exists
  let tagName = findTagName(classDeclaration);

  // skip tagless components (silent)
  if (tagName === '') {
    debug('tagName: %o -> skip', tagName);
    return;
  }

  debug('tagName: %o', tagName);

  /*
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
*/
  // analyze `elementId`, `attributeBindings`, `classNames` and `classNameBindings`
  let elementId = findElementId(classBody);
  debug('elementId: %o', elementId);

  let attributeBindings = findAttributeBindings(classDeclaration);
  debug('attributeBindings: %o', attributeBindings);

  /*
  let classNames = findClassNames(properties);
  debug('classNames: %o', classNames);

  let classNameBindings = findClassNameBindings(properties);
  debug('classNameBindings: %o', classNameBindings);
  */

  // set `@tagName('')`
  addClassDecorator(exportDefaultDeclaration, 'tagName', [j.stringLiteral('')]);
  ensureImport(root, 'tagName', '@ember-decorators/component');
  // let tagNamePath = j(classBody)
  //   .find(j.ClassProperty)
  //   // .filter(path => path.parentPath === properties)
  //   .filter(path => isProperty(path, 'tagName'));
  //
  // if (tagNamePath.length === 1) {
  //   j(tagNamePath.get('value')).replaceWith(j.stringLiteral(''));
  // } else {
  //   classBody.unshift(j.classProperty(j.identifier('tagName'), j.stringLiteral('')));
  // }

  // remove `elementId`, `attributeBindings`, `classNames` and `classNameBindings`
  j(classBody)
    .find(j.ClassProperty)
    // .filter(path => path.parentPath === properties)
    .filter(
      path => isProperty(path, 'elementId')
      // isProperty(path, 'attributeBindings') ||
      // isProperty(path, 'classNames') ||
      // isProperty(path, 'classNameBindings')
    )
    .remove();

  let attributeBindingsDecorator = findDecorator(classDeclaration, 'attributeBindings');
  if (attributeBindingsDecorator) {
    j(attributeBindingsDecorator).remove();
    removeImport(root, 'attributeBindings', '@ember-decorators/component');
  }

  let newSource = root.toSource();

  // wrap existing template with root element
  let classNodes = [];
  if (options.hasComponentCSS) {
    classNodes.push(b.mustache('styleNamespace'));
  }
  /*
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
  */

  let attrs = [];

  if (elementId) {
    attrs.push(b.attr('id', b.text(elementId)));
  }

  attributeBindings.forEach((value, key) => {
    attrs.push(b.attr(key, b.mustache(`this.${value}`)));
  });
  /*
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

   */
  attrs.push(b.attr('...attributes', b.text('')));

  return { newSource, attrs, tagName };
};
