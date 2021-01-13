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

test('throws if supported component type is not found', () => {
  let source = `
    export const FOO = 'foo';
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Unsupported component type."`
  );
});

describe('classic components', () => {
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
      classNameBindings: ['a:b', 'x:y:z', 'foo::bar', ':static'],
    });
  `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `ariaRole` correctly', () => {
    let source = `
    export default Component.extend({
      ariaRole: 'button',
    });
  `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
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

  test('throws if component is using a computed property for `ariaRole`', () => {
    let source = `
    export default Component.extend({
      ariaRole: computed(function() {
        return 'button';
      }),
    });
  `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Codemod does not support computed properties for \`ariaRole\`."`
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

  test('empty lines are not intended', () => {
    let source = `export default Component.extend({});`;

    let template = `foo

bar`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('leading and trailing empty lines are stripped', () => {
    let source = `export default Component.extend({});`;

    let template = `
foo
`;

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
});

describe('native components', () => {
  test('throws if not extending from Ember.Component', () => {
    let source = `
      import Component from '@glimmer/component';

      export default class FooComponent extends Component {
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported parent class, can only extend from Ember.Component"`
    );
  });

  test('renamed import', () => {
    let source = `
      import Base from '@ember/component';

      export default class FooComponent extends Base {
      }
  `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('basic', () => {
    let source = `
      import Component from '@ember/component';

      export default class FooComponent extends Component {
      }
  `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('replaces existing `tagName`', () => {
    let source = `
      import Component from '@ember/component';
      import { tagName } from '@ember-decorators/component';

      @tagName('span')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `elementId` correctly', () => {
    let source = `
      import Component from '@ember/component';

      export default class FooComponent extends Component {
        elementId = 'qux';
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `@attributeBindings` correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { attributeBindings } from '@ember-decorators/component';

      @attributeBindings('foo', 'bar:baz')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `@attribute` correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { attribute } from '@ember-decorators/component';

      export default class FooComponent extends Component {
        @attribute foo;
        @attribute('baz') bar;
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `@attribute` and `@attributeBindings` correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { attribute, attributeBindings } from '@ember-decorators/component';

      @attributeBindings('foo')
      export default class FooComponent extends Component {
        @attribute('baz') bar;
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `@className` correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { className } from '@ember-decorators/component';

      export default class FooComponent extends Component {
        @className('b') a;
        @className('y', 'z') x;
        @className(undefined, 'bar') foo;
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `ariaRole` correctly', () => {
    let source = `
    export default class FooComponent extends Component {
      ariaRole = 'button';
    }
  `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('throws if component is a non-string value for `ariaRole`', () => {
    let source = `
      export default class FooComponent extends Component {
        ariaRole = true;
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Codemod only supports static strings for \`ariaRole\`."`
    );
  });

  test('throws if component is using a native getter for `ariaRole`', () => {
    let source = `
      export default class FooComponent extends Component {
        get ariaRole() {
          return 'button';
        }
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Codemod does not support dynamic values for \`ariaRole\` (e.g. getter or computed properties)."`
    );
  });

  test('throws if component is using a computed property for `ariaRole`', () => {
    let source = `
      import { computed } from '@ember/object';

      export default class FooComponent extends Component {
        @computed()
        get ariaRole() {
          return 'button';
        }
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Codemod does not support dynamic values for \`ariaRole\` (e.g. getter or computed properties)."`
    );
  });

  test('throws for non-boolean @className', () => {
    let source = `
      import Component from '@ember/component';
      import { className } from '@ember-decorators/component';

      export default class FooComponent extends Component {
        @className activeClass = 'active';
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported non-boolean \`@className\` for property: activeClass"`
    );
  });

  test('handles `@classNames` correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { classNames } from '@ember-decorators/component';

      @classNames('foo', 'bar:baz')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles single `@classNames` item correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { classNames } from '@ember-decorators/component';

      @classNames('foo')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `@classNameBindings` correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { classNameBindings } from '@ember-decorators/component';

      @classNameBindings('a:b', 'x:y:z', 'foo::bar', ':static')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('throws for non-boolean @classNameBindings', () => {
    let source = `
      import Component from '@ember/component';
      import { classNameBindings } from '@ember-decorators/component';

      @classNameBindings('a:b', 'foo')
      export default class FooComponent extends Component {
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported non-boolean \`@classNameBindings\` value: foo"`
    );
  });

  test('keeps unrelated decorators in place', () => {
    let source = `
      import Component from '@ember/component';
      import { classNames, layout } from '@ember-decorators/component';

      @layout(template)
      @classNames('foo')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test("skips @tagName('') components", () => {
    let source = `
      import Component from '@ember/component';
      import { tagName } from '@ember-decorators/component';

      @tagName('')
      export default class FooComponent extends Component {
      }
    `;

    let template = 'foo';

    let result = transform(source, template);
    expect(result.tagName).toEqual(undefined);
    expect(result.source).toEqual(source);
    expect(result.template).toEqual(template);
  });

  test("skips tagName='' components", () => {
    let source = `
      import Component from '@ember/component';

      export default class FooComponent extends Component {
        tagName = '';
      }
    `;

    let template = 'foo';

    let result = transform(source, template);
    expect(result.tagName).toEqual(undefined);
    expect(result.source).toEqual(source);
    expect(result.template).toEqual(template);
  });

  test('throws if component is using `this.element`', () => {
    let source = `
      import Component from '@ember/component';

      export default class FooComponent extends Component {
        didInsertElement() {
          console.log(this.element);
        }
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Using \`this.element\` is not supported in tagless components"`
    );
  });

  test('throws if component is using `this.elementId`', () => {
    let source = `
      import Component from '@ember/component';

      export default class FooComponent extends Component {
        didInsertElement() {
          console.log(this.elementId);
        }
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Using \`this.elementId\` is not supported in tagless components"`
    );
  });

  test('throws if component is using `keyDown()`', () => {
    let source = `
      import Component from '@ember/component';

      export default class FooComponent extends Component {
        keyDown() {
          console.log('Hello World!');
        }
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Using \`keyDown()\` is not supported in tagless components"`
    );
  });

  test('throws if component is using `click()`', () => {
    let source = `
      import Component from '@ember/component';

      export default class FooComponent extends Component {
        click() {
          console.log('Hello World!');
        }
      }
    `;

    expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
      `"Using \`click()\` is not supported in tagless components"`
    );
  });

  test('multi-line template', () => {
    let source = `
      import Component from '@ember/component';

      export default class extends Component {};
    `;

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
      import Component from '@ember/component';
      import { classNames } from '@ember-decorators/component';

      @classNames('foo', 'bar:baz')
      export default class extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template, { hasComponentCSS: true })).toMatchSnapshot();
  });

  test('handles TypeScript components correctly', () => {
    let source = `
      import Component from '@ember/component';
      import { classNames } from '@ember-decorators/component';

      @classNameBindings('foo:bar')
      export default class extends Component {
        foo: boolean = true;
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });
});
