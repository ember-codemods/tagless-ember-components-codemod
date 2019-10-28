const { transform } = require('../transform');

function generateSnapshot(source, template, options = {}) {
  let result = transform(source, template, options);

  return `==========
${source}
~~~~~~~~~~
${template}
~~~~~~~~~~
 => tagName: ${result.tagName}
~~~~~~~~~~
${result.source}
~~~~~~~~~~
${result.template}
==========`;
}

test('basic', () => {
  let source = `
    export default Component.extend({
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('replaces existing `tagName`', () => {
  let source = `
    export default Component.extend({
      tagName: 'span',
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('handles `elementId` correctly', () => {
  let source = `
    export default Component.extend({
      elementId: 'qux',
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('handles `attributeBindings` correctly', () => {
  let source = `
    export default Component.extend({
      attributeBindings: ['foo', 'bar:baz'],
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('handles `classNames` correctly', () => {
  let source = `
    export default Component.extend({
      classNames: ['foo', 'bar:baz'],
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('handles single `classNames` item correctly', () => {
  let source = `
    export default Component.extend({
      classNames: ['foo'],
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('handles `classNameBindings` correctly', () => {
  let source = `
    export default Component.extend({
      classNameBindings: ['a:b', 'x:y:z', 'foo::bar'],
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('throws if `Component.extend({ ... })` is not found', () => {
  let source = `
    export default class extends Component {
    }
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Could not find \`export default Component.extend({ ... });\`"`
  );
});

test('throws if `Component.extend({ ... })` argument is not found', () => {
  let source = `
    export default Component.extend();
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Could not find object argument in \`export default Component.extend({ ... });\`"`
  );
});

test('skips tagless components', () => {
  let source = `
    export default Component.extend({
      tagName: '',
    });
  `;

  let template = 'foo';

  let result = transform(source, template);
  expect(result.tagName).toEqual(undefined);
  expect(result.source).toEqual(source);
  expect(result.template).toEqual(template);
});

test('throws if component is using `this.element`', () => {
  let source = `
    export default Component.extend({
      didInsertElement() {
        console.log(this.element);
      },
    });
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Using \`this.element\` is not supported in tagless components"`
  );
});

test('throws if component is using `this.elementId`', () => {
  let source = `
    export default Component.extend({
      didInsertElement() {
        console.log(this.elementId);
      },
    });
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Using \`this.elementId\` is not supported in tagless components"`
  );
});

test('throws if component is using `keyDown()`', () => {
  let source = `
    export default Component.extend({
      keyDown() {
        console.log('Hello World!');
      },
    });
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Using \`keyDown()\` is not supported in tagless components"`
  );
});

test('throws if component is using `click()`', () => {
  let source = `
    export default Component.extend({
      click() {
        console.log('Hello World!');
      },
    });
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Using \`click()\` is not supported in tagless components"`
  );
});

test('multi-line template', () => {
  let source = `export default Component.extend({});`;

  let template = `
{{#if this.foo}}
  FOO
{{else}}
  BAR
{{/if}}
`.trim();

  expect(generateSnapshot(source, template)).toMatchSnapshot();
});

test('handles `hasComponentCSS` option correctly', () => {
  let source = `
    export default Component.extend({
      classNames: ['foo', 'bar:baz'],
    });
  `;

  let template = `foo`;

  expect(generateSnapshot(source, template, { hasComponentCSS: true })).toMatchSnapshot();
});
