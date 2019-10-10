const j = require('jscodeshift').withParser('ts');

const {
  findTagName,
  findElementId,
  findAttributeBindings,
  findClassNames,
  findClassNameBindings,
} = require('../transform');

describe('findTagName()', () => {
  const TESTS = [
    ['', 'div'],
    ["tagName: ''", ''],
    ["tagName: 'div'", 'div'],
    ["tagName: 'span'", 'span'],
    ["tagName: 'svg'", 'svg'],
    ['tagName: 5', /Unexpected `tagName` value: 5/],
    ['tagName: foo', /Unexpected `tagName` value: foo/],
  ];

  for (let [input, expected] of TESTS) {
    test(input || 'empty', () => {
      let props = j(`export default {${input}};`)
        .find(j.ExportDefaultDeclaration)
        .get('declaration', 'properties');

      if (expected instanceof RegExp) {
        expect(() => findTagName(props)).toThrow(expected);
      } else {
        expect(findTagName(props)).toEqual(expected);
      }
    });
  }
});

describe('findElementId()', () => {
  const TESTS = [
    ['', null],
    ["elementId: ''", ''],
    ["elementId: 'foo'", 'foo'],
    ['elementId: 5', /Unexpected `elementId` value: 5/],
    ['elementId: foo', /Unexpected `elementId` value: foo/],
  ];

  for (let [input, expected] of TESTS) {
    test(input || 'empty', () => {
      let props = j(`export default {${input}};`)
        .find(j.ExportDefaultDeclaration)
        .get('declaration', 'properties');

      if (expected instanceof RegExp) {
        expect(() => findElementId(props)).toThrow(expected);
      } else {
        expect(findElementId(props)).toEqual(expected);
      }
    });
  }
});

describe('findAttributeBindings()', () => {
  const TESTS = [
    ['', new Map()],
    ["attributeBindings: ['foo']", new Map([['foo', 'foo']])],
    ["attributeBindings: ['foo:bar', 'BAZ']", new Map([['foo', 'bar'], ['BAZ', 'BAZ']])],
    ["attributeBindings: ''", /Unexpected `attributeBindings` value: ''/],
    ['attributeBindings: 5', /Unexpected `attributeBindings` value: 5/],
    ['attributeBindings: foo', /Unexpected `attributeBindings` value: foo/],
    ['attributeBindings: [42]', /Unexpected `attributeBindings` value: \[42]/],
  ];

  for (let [input, expected] of TESTS) {
    test(input || 'empty', () => {
      let props = j(`export default {${input}};`)
        .find(j.ExportDefaultDeclaration)
        .get('declaration', 'properties');

      if (expected instanceof RegExp) {
        expect(() => findAttributeBindings(props)).toThrow(expected);
      } else {
        expect(findAttributeBindings(props)).toEqual(expected);
      }
    });
  }
});

describe('findClassNames()', () => {
  const TESTS = [
    ['', []],
    ["classNames: ['foo']", ['foo']],
    ["classNames: ['foo', 'bar']", ['foo', 'bar']],
    ["classNames: ['foo', 'bar', 'BAZ']", ['foo', 'bar', 'BAZ']],
    ["classNames: ''", /Unexpected `classNames` value: ''/],
    ['classNames: 5', /Unexpected `classNames` value: 5/],
    ['classNames: foo', /Unexpected `classNames` value: foo/],
    ['classNames: [42]', /Unexpected `classNames` value: \[42]/],
  ];

  for (let [input, expected] of TESTS) {
    test(input || 'empty', () => {
      let props = j(`export default {${input}};`)
        .find(j.ExportDefaultDeclaration)
        .get('declaration', 'properties');

      if (expected instanceof RegExp) {
        expect(() => findClassNames(props)).toThrow(expected);
      } else {
        expect(findClassNames(props)).toEqual(expected);
      }
    });
  }
});

describe('findClassNameBindings()', () => {
  const TESTS = [
    ['', new Map()],
    ["classNameBindings: ['foo']", new Map([['foo', ['foo', null]]])],
    ["classNameBindings: ['fooBar']", new Map([['fooBar', ['foo-bar', null]]])],
    ["classNameBindings: ['FOO']", new Map([['FOO', ['foo', null]]])],
    ["classNameBindings: ['foo:bar']", new Map([['foo', ['bar', null]]])],
    ["classNameBindings: ['foo:bar:baz']", new Map([['foo', ['bar', 'baz']]])],
    ["classNameBindings: ['foo::baz']", new Map([['foo', [null, 'baz']]])],
    [
      "classNameBindings: ['foo', 'bar']",
      new Map([['foo', ['foo', null]], ['bar', ['bar', null]]]),
    ],
    ["classNameBindings: ''", /Unexpected `classNameBindings` value: ''/],
    ['classNameBindings: 5', /Unexpected `classNameBindings` value: 5/],
    ['classNameBindings: foo', /Unexpected `classNameBindings` value: foo/],
    ['classNameBindings: [42]', /Unexpected `classNameBindings` value: \[42]/],
    ["classNameBindings: ['a:b:c:d']", /Unexpected `classNameBindings` value: a:b:c:d/],
  ];

  for (let [input, expected] of TESTS) {
    test(input || 'empty', () => {
      let props = j(`export default {${input}};`)
        .find(j.ExportDefaultDeclaration)
        .get('declaration', 'properties');

      if (expected instanceof RegExp) {
        expect(() => findClassNameBindings(props)).toThrow(expected);
      } else {
        expect(findClassNameBindings(props)).toEqual(expected);
      }
    });
  }
});
