const { possibleTemplatePaths } = require('../transform');

describe('possibleTemplatePaths()', () => {
  const TESTS = [
    [
      'app/components/checkbox.js',
      ['app/components/checkbox.hbs', 'app/templates/components/checkbox.hbs'],
    ],
    [
      'app/components/nested/sub/checkbox.js',
      [
        'app/components/nested/sub/checkbox.hbs',
        'app/templates/components/nested/sub/checkbox.hbs',
      ],
    ],
    [
      'app/components/checkbox/component.js',
      [
        'app/components/checkbox/template.hbs',
        'app/components/checkbox/component.hbs',
        'app/templates/components/checkbox/component.hbs',
      ],
    ],
    [
      'app/components/nested/sub/component/component.js',
      [
        'app/components/nested/sub/component/template.hbs',
        'app/components/nested/sub/component/component.hbs',
        'app/templates/components/nested/sub/component/component.hbs',
      ],
    ],
    [
      'app/components/checkbox.ts',
      ['app/components/checkbox.hbs', 'app/templates/components/checkbox.hbs'],
    ],
    [
      'app/components/checkbox/component.ts',
      [
        'app/components/checkbox/template.hbs',
        'app/components/checkbox/component.hbs',
        'app/templates/components/checkbox/component.hbs',
      ],
    ],
    [
      'app/components/nested/sub/component/component.ts',
      [
        'app/components/nested/sub/component/template.hbs',
        'app/components/nested/sub/component/component.hbs',
        'app/templates/components/nested/sub/component/component.hbs',
      ],
    ],
  ];

  for (let [input, expected] of TESTS) {
    test(input, () => {
      expect(possibleTemplatePaths(input)).toEqual(expected);
    });
  }
});
