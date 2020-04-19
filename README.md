# remark-lint-prohibited-strings
remark-lint plugin to prohibit specified strings in markdown files

Example configuration:

```javascript
  [
    require("remark-lint-prohibited-strings"),
    [
      { no: "end-of-life", yes: "End-of-Life" },
      { no: "github", yes: "GitHub" },
      { no: "javascript", yes: "JavaScript" },
      { no: "node\\.js", yes: "Node.js" },
      { no: "rfc", yes: "RFC" },
      { no: "RFC\\d+", yes: "RFC <number>" },
      { no: "unix", yes: "Unix" },
      { no: "v8", yes: "V8" }
    ]
  ]
  ```

  The `no` values are strings but regular expression special characters are
  respected (which may require special escaping as can be seen in the example
  above.

  The `no` values are treated as case-insensitive values. If a string
  case-insensitive matches the `no` value, it will be flagged as an error unless
  the string also case-sensitive matches the `yes` value.
  