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
    export default class extends Dummy {
    }
  `;

  expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
    `"Unsupported component type."`
  );
});

describe('classic components', function() {
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

test('handles `ariaRole` correctly', () => {
  let source = `
    export default Component.extend({
      ariaRole: 'button',
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
    `"Unsupported component type. Only classic components (\`Component.extend({ ... }\`) are supported currently."`
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

describe('native components', function() {
  test('basic', () => {
    let source = `
      export default class FooComponent extends Component {
      }
  `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('replaces existing `tagName`', () => {
    let source = `
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
      export default class FooComponent extends Component {
        elementId = 'qux';
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `@attributeBindings` correctly', () => {
    let source = `
      import { attributeBindings } from '@ember-decorators/component';

      @attributeBindings('foo', 'bar:baz')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `classNames` correctly', () => {
    let source = `
      import { classNames } from '@ember-decorators/component';

      @classNames('foo', 'bar:baz')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles single `classNames` item correctly', () => {
    let source = `
      import { classNames } from '@ember-decorators/component';

      @classNames('foo')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });

  test('handles `classNameBindings` correctly', () => {
    let source = `
      import { classNameBindings } from '@ember-decorators/component';

      @classNameBindings('a:b', 'x:y:z', 'foo::bar')
      export default class FooComponent extends Component {
      }
    `;

    let template = `foo`;

    expect(generateSnapshot(source, template)).toMatchSnapshot();
  });
  //
  //
  //   test('skips tagless components', () => {
  //     let source = `
  //     export default Component.extend({
  //       tagName: '',
  //     });
  //   `;
  //
  //     let template = 'foo';
  //
  //     let result = transform(source, template);
  //     expect(result.tagName).toEqual(undefined);
  //     expect(result.source).toEqual(source);
  //     expect(result.template).toEqual(template);
  //   });
  //
  //   test('throws if component is using `this.element`', () => {
  //     let source = `
  //     export default Component.extend({
  //       didInsertElement() {
  //         console.log(this.element);
  //       },
  //     });
  //   `;
  //
  //     expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
  //       `"Using \`this.element\` is not supported in tagless components"`
  //     );
  //   });
  //
  //   test('throws if component is using `this.elementId`', () => {
  //     let source = `
  //     export default Component.extend({
  //       didInsertElement() {
  //         console.log(this.elementId);
  //       },
  //     });
  //   `;
  //
  //     expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
  //       `"Using \`this.elementId\` is not supported in tagless components"`
  //     );
  //   });
  //
  //   test('throws if component is using `keyDown()`', () => {
  //     let source = `
  //     export default Component.extend({
  //       keyDown() {
  //         console.log('Hello World!');
  //       },
  //     });
  //   `;
  //
  //     expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
  //       `"Using \`keyDown()\` is not supported in tagless components"`
  //     );
  //   });
  //
  //   test('throws if component is using `click()`', () => {
  //     let source = `
  //     export default Component.extend({
  //       click() {
  //         console.log('Hello World!');
  //       },
  //     });
  //   `;
  //
  //     expect(() => transform(source, '')).toThrowErrorMatchingInlineSnapshot(
  //       `"Using \`click()\` is not supported in tagless components"`
  //     );
  //   });
  //
  //   test('multi-line template', () => {
  //     let source = `export default Component.extend({});`;
  //
  //     let template = `
  // {{#if this.foo}}
  //   FOO
  // {{else}}
  //   BAR
  // {{/if}}
  // `.trim();
  //
  //     expect(generateSnapshot(source, template)).toMatchSnapshot();
  //   });
  //
  //   test('handles `hasComponentCSS` option correctly', () => {
  //     let source = `
  //     export default Component.extend({
  //       classNames: ['foo', 'bar:baz'],
  //     });
  //   `;
  //
  //     let template = `foo`;
  //
  //     expect(generateSnapshot(source, template, { hasComponentCSS: true })).toMatchSnapshot();
  //   });
});
