
export default {
  // Set defaultToken to invalid to see what you do not tokenize yet
  // defaultToken: 'invalid',
    keywords: [    
        "if", "else", "for", "while", "return", "break", "continue", 
        "to", "do",
        "function", "procedure"
    ],
    blocks: [    
        "@data", 
        "@process",
        "@terminator",
        "@loop",
        "@method",
    ],
    functions: [
        "printf", "scanf", "println", 
        "readln", "writeln", "read", "write", "print",
        "system",
    ],
    typeKeywords: [
        "unsigned",
        "void", "int", "double", "long", "float", "char", "boolean",
        'begin', 'end', 'then'
    ],
    wrong: [
       
    ],
    operator: [
    ],
    operators: ['=', '>', '<', '==', '<=', '>=', '!=', '<>', '+', '-', '*', '/', '->'],
    digits: /\d+(_+\d+)*/,
    octaldigits: /[0-7]+(_+[0-7]+)*/,  binarydigits: /[0-1]+(_+[0-1]+)*/,
    hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
    // The main tokenizer for our languages
    tokenizer: {
        root: [
          // identifiers and keywords
          [/[a-z_$][\w$]*/, {
            cases: {
              '@operator': 'operator',
              '@wrong': 'invalid',
              '@typeKeywords': 'keyword.type',
              '@keywords': 'keyword',
              '@functions': 'function',
              '@default': 'identifier',
            }
          }],
          [/[A-Z][\w\$]*/, 'type.identifier'],  // to show class names nicely
          // whitespace
          { include: '@whitespace' },
          // delimiters and operators
          [/[{}()\[\]]/, '@brackets'],
          // @ annotations.
          // As an example, we emit a debugging log message on these tokens.
          // Note: message are supressed during the first load -- change some lines to see them.
          // eslint-disable-next-line no-useless-escape
          [/@\s*[a-zA-Z_\$][\w\$]*/, {
            cases: {
              '@blocks': 'blocks',
            }
          // token: 'annotation', log: 'annotation token: $0' }
          }],
          // numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          // delimiter: after number because of .\d floats
          [/[;,.]/, 'delimiter'],
          // strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          // non-teminated string
          [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
          [/'/, { token: 'char.quote', bracket: '@open', next: '@char' }],
          // characters
          [/'[^\\']'/, 'string'],
          [/'/, 'string.invalid']    ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'],
        // nested comment
          ['\\*/', 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape.invalid'],
          [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
          [/'/, { token: 'char.quote', bracket: '@close', next: '@pop' }]
        ],
        char: [
          [/[^\\']+/, 'char'],
          [/\\./, 'string.escape.invalid'],
          [/'/, { token: 'char.quote', bracket: '@close', next: '@pop' }]
        ],
        whitespace: [
          [/[ \t\r\n]+/, 'white'],
          [/\/\*/, 'comment', '@comment'],
          [/\/\/.*$/, 'comment'],
        ],
  }
}
