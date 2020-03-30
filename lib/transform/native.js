const j = require('jscodeshift').withParser('ts');
const _debug = require('debug')('tagless-ember-components-codemod');

const SilentError = require('../silent-error');
const {
  addClassDecorator,
  findTagName,
  findElementId,
  findClassNames,
  findClassNameBindings,
  findAttributeBindings,
  isMethod,
  removeDecorator,
  ensureImport,
  isProperty,
  renameEventHandler,
} = require('../utils/native');

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

  // skip components that use `this.element`
  let thisElementPaths = j(classBody).find(j.MemberExpression, {
    object: { type: 'ThisExpression' },
    property: { name: 'element' },
  });
  if (thisElementPaths.length !== 0) {
    throw new SilentError(`Using \`this.element\` is not supported in tagless components`);
  }

  // skip components that use `this.elementId`
  let thisElementIdPaths = j(classBody).find(j.MemberExpression, {
    object: { type: 'ThisExpression' },
    property: { name: 'elementId' },
  });
  if (thisElementIdPaths.length !== 0) {
    throw new SilentError(`Using \`this.elementId\` is not supported in tagless components`);
  }

  // analyze `elementId`, `attributeBindings`, `classNames` and `classNameBindings`
  let elementId = findElementId(classBody);
  debug('elementId: %o', elementId);

  let attributeBindings = findAttributeBindings(classDeclaration);
  debug('attributeBindings: %o', attributeBindings);

  let classNames = findClassNames(classDeclaration);
  debug('classNames: %o', classNames);

  let classNameBindings = findClassNameBindings(classDeclaration);
  debug('classNameBindings: %o', classNameBindings);

  let eventHandlers = new Map();
  // rename event handlers and add @action
  for (let eventName of EVENT_HANDLER_METHODS) {
    let handlerMethod = classBody.filter(path => isMethod(path, eventName))[0];

    if (handlerMethod) {
      let methodName = renameEventHandler(handlerMethod);
      addClassDecorator(handlerMethod, 'action');
      ensureImport(root, 'action', '@ember/object');
      eventHandlers.set(eventName.toLowerCase(), methodName);
    }
  }

  // set `@tagName('')`
  addClassDecorator(classDeclaration, 'tagName', [j.stringLiteral('')]);
  ensureImport(root, 'tagName', '@ember-decorators/component');

  // remove `elementId`, `attributeBindings`, `classNames` and `classNameBindings`
  j(classBody)
    .find(j.ClassProperty)
    // .filter(path => path.parentPath === properties)
    .filter(path => isProperty(path, 'elementId'))
    .remove();

  removeDecorator(root, classDeclaration, 'attributeBindings', '@ember-decorators/component');
  removeDecorator(root, classDeclaration, 'classNames', '@ember-decorators/component');
  removeDecorator(root, classDeclaration, 'classNameBindings', '@ember-decorators/component');
  j(classBody)
    .find(j.ClassProperty)
    .forEach(path => removeDecorator(root, path, 'attribute', '@ember-decorators/component'));
  j(classBody)
    .find(j.ClassProperty)
    .forEach(path => removeDecorator(root, path, 'className', '@ember-decorators/component'));

  let newSource = root.toSource();

  return {
    newSource,
    tagName,
    elementId,
    classNames,
    classNameBindings,
    attributeBindings,
    eventHandlers,
  };
};
