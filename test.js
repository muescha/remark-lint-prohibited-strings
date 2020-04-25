'use strict';

const test = require('tape');
const remark = require('remark');
const lint = require('remark-lint');
const vfile = require('vfile');
const noProhibitedStrings = require('./');

const processorWithOptions =
  (options) => remark().use(lint).use(noProhibitedStrings, options);

test('remark-lint-prohibited-strings', (t) => {
  const path = 'fhqwhgads.md';

  {
    const contents = 'the v8 javascript engine';
    t.deepEqual(
      processorWithOptions([])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should not flag anything if no options set'
    );
  }

  {
    const contents = 'the v8 javascript engine';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [ 'fhqwhgads.md:1:5-1:7: Use "V8" instead of "v8"' ],
      'should flag string if option set'
    );
  }

  {
    const contents = 'the V8 JavaScript engine';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should not flag string if it is not prohibited'
    );
  }

  {
    const contents = '# fhqwhgads.v8';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should ignore prohibited string if it is in code (preceded by .)'
    );
  }

  {
    const contents = '# v8.fhqwhgads';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should ignore prohibited string if it is in code (followed by .word)'
    );
  }

  {
    const contents = 'The name of this band is v8.';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [ 'fhqwhgads.md:1:26-1:28: Use "V8" instead of "v8"' ],
      'should flag prohibited string if it is followed by . alone'
    );
  }

  {
    const contents = 'The gatsby-specific way to do this is as follows:';
    t.deepEqual(
      processorWithOptions([{ yes: 'Gatsby', no: 'gatsby(?!-)' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [ ],
      'should allow negative lookaheads with custom regular expression config'
    );
  }

  {
    const contents = 'word-gatsby gatsby-word word-gatsby-word';
    t.deepEqual(
      processorWithOptions([{ yes: 'Gatsby', no: '(?<!-)gatsby(?!-)' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [ ],
      'should allow negative lookaheads and lookbehinds'
    );
  }

  {
    const contents = 'word-gatsby gatsby-word word-gatsby-word gatsby';
    t.deepEqual(
      processorWithOptions([{ yes: 'Gatsby', no: '(?<!-)gatsby(?!-)' }])
          .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [ 'fhqwhgads.md:1:42-1:48: Use "Gatsby" instead of "gatsby"' ],
      'should still find things that do not match lookahead/lookbehind'
    );
  }

  {
    const contents = 'The fhqwhgads.v8 page for the band v8 rocks.';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [ 'fhqwhgads.md:1:36-1:38: Use "V8" instead of "v8"' ],
      'should flag prohibited string even if an allowed usage precedes it'
    );
  }

  {
    const contents = '@nodejs/v8-inspector';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should ignore prohibited string if it is part of an @-mention'
    );
  }

  {
    const contents = '@Nodejs/v8-inspector';
    t.deepEqual(
      processorWithOptions([{ yes: 'V8', no: 'v8' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should ignore prohibited string if it is part of an @-Mention'
    );
  }

  {
    const contents = 'RfC123';
    t.deepEqual(
      processorWithOptions([{ yes: 'RFC <number>', no: '[Rr][Ff][Cc]\\d+' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [ 'fhqwhgads.md:1:1-1:7: Use "RFC <number>" instead of "RfC123"' ],
      'should provide reasonable output from regexp-y things'
    );
  }

  {
    const contents = 'denote that';
    t.deepEqual(
      processorWithOptions([{ no: 'note that', yes: '<nothing>' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should assume word breaks'
    );
  }

  {
    const contents = '`the-gatsby-kebab-in-code`';
    t.deepEqual(
      processorWithOptions([{ no: 'gatsby', yes: 'Gatsby' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should ignore strings in backticks'
    );
  }

  {
    const contents = '```\nthe-gatsby-kebab-in-code\n```';
    t.deepEqual(
      processorWithOptions([{ no: 'gatsby', yes: 'Gatsby' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [],
      'should ignore strings in code fences'
    );
  }

  {
    const contents = "for Node.js' stuff\n\nand Node.js's stuff too";
    t.deepEqual(
      processorWithOptions([{ no: "Node\\.js's?", yes: 'the Node.js' }])
        .processSync(vfile({ path: path, contents: contents }))
        .messages.map(String),
      [
        'fhqwhgads.md:1:5-1:13: Use "the Node.js" instead of "Node.js\'"',
        'fhqwhgads.md:3:5-3:14: Use "the Node.js" instead of "Node.js\'s"'
      ],
      'should allow flagging of apostrophes as final characters in "no" string'
    );
  }
  t.end();
});
