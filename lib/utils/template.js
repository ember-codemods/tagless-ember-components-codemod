function indentLines(content) {
  return content
    .split('\n')
    .map(it => `  ${it}`)
    .join('\n');
}

module.exports = {
  indentLines,
};
