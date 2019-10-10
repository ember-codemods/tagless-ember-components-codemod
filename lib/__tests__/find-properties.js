const j = require('jscodeshift').withParser('ts');

const { findTagName, findElementId } = require('../transform');

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
