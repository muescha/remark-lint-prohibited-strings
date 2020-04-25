'use strict';

const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');
const position = require('unist-util-position')
const vfileLocation = require('vfile-location')


module.exports = rule('remark-lint:prohibited-strings', prohibitedStrings);

function testProhibited(val, content) {
  let regexpString = '(\\.|@[a-zA-Z0-9/-]*)?';

  // If it starts with a letter, make sure it is a word break.
  if (/^\b/.test(val.no)) {
    regexpString += '\\b';
  }
  regexpString += `(${val.no})`;

  // If it ends with a letter, make sure it is a word break.
  if (/\b$/.test(val.no)) {
    regexpString += '\\b';
  }
  regexpString += '(\\.\\w)?';
  const re = new RegExp(regexpString, 'g');

  let result = null;
  let results = []
  while (result = re.exec(content)) {
    if (!result[1] && !result[3] && result[2] !== val.yes) {
      results.push({
        match: result[2],
        startIndex: re.lastIndex - result[2].length,
        endIndex: re.lastIndex,
        debug: { s: regexpString, c: content }
      });
    }
  }

  return results;
}

function prohibitedStrings(ast, file, strings) {

  const location = vfileLocation(file)


  if(!strings){
    return
  }

  visit(ast, 'text', checkText);

  function checkText(node) {

    const content = node.value;
    const offset = location.toOffset(position.start(node))


    strings.forEach((val) => {

      const results = testProhibited(val, content);
      if (results.length) {
        console.log(node)
        results.forEach(result => {
          const position = {
            start: location.toPosition(offset + result.startIndex),
            end: location.toPosition(offset + result.endIndex)
          }

          const debugInfo = true ? ` \n\n${JSON.stringify(result.debug,null,'  ')}` : ``

          const message = file.message(`Use "${val.yes}" instead of "${result.match}"${debugInfo}`, position);
          message.id = id(val);
        })
      }
    });
  }
  function id(val){
    return val.id?val.id:val.yes
  }
}
