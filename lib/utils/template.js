function indentLines(content) {
  return (
    content
      // strip leading and trailing new lines
      .trim()
      .split('\n')
      .map(it => {
        // intend non-empty lines with two spaces
        return it.trim().length > 0 ? `  ${it}` : '';
      })
      .join('\n')
  );
}

module.exports = {
  indentLines,
};
