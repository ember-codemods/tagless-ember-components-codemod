const { indentLines } = require('../utils');

const templateRecast = require('ember-template-recast');

const b = templateRecast.builders;

const PLACEHOLDER = '@@@PLACEHOLDER@@@';

module.exports = function transformTemplate(template, tagName, attrs) {
  let templateAST = templateRecast.parse(template);

  templateAST.body = [
    b.element(tagName, {
      attrs,
      children: [b.text(`\n${PLACEHOLDER}\n`)],
    }),
  ];

  return templateRecast.print(templateAST).replace(PLACEHOLDER, indentLines(template));
};
