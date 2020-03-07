const { guessTemplatePath } = require('../transform');

describe('guessTemplatePath()', () => {
  const TESTS = [
    ['app/components/checkbox.js', 'app/templates/components/checkbox.hbs'],
    ['app/components/checkbox/component.js', 'app/components/checkbox/template.hbs'],
    [
      'app/components/nested/sub/component/component.js',
      'app/components/nested/sub/component/template.hbs',
    ],
    ['app/components/checkbox.ts', 'app/templates/components/checkbox.hbs'],
    ['app/components/checkbox/component.ts', 'app/components/checkbox/template.hbs'],
    [
      'app/components/nested/sub/component/component.ts',
      'app/components/nested/sub/component/template.hbs',
    ],
  ];

  for (let [input, expected] of TESTS) {
    test(input, () => {
      expect(guessTemplatePath(input)).toEqual(expected);
    });
  }
});
