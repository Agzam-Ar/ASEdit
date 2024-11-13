// custom-completion.js
/* eslint-disable no-template-curly-in-string */
export default function pslCompProvider(monaco) {
    return [    
 /** * Built-in function */    
    {        
        label: 'printf (вывод)',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'printf(${1:pattern});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'C подобный вывод'
    }, 
    {        
        label: 'scanf (ввод)',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'scanf(${1:pattern});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'C подобный ввод'
    },
    {
        label: 'if (...)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [            
            'if (${1:condition}) {',
            '\t$0',
            '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'C подобное условие'
    }, 
    {
        label: 'if (...) else (...)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [            
            'if (${1:condition}) {',
            '\t$2',
            '} else {',
            '\t$0',
            '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'C подобное условие'
    }, 
    {
        label: 'for (i = 0; i < ...; i=i+1) (...)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [            
            'for (${1:i} = 0; ${1:i} < ${2:n}; ${1:i}=${1:i}+1) {',
            '\t$3',
            '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'C подобное условие'
    }, 
    {
        label: '@data (Кастомный блок "Данные")',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '@data("${1:Текст}");',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'кастомный блок'
    }, 
    {
        label: '@process (Кастомный блок "Процесс")',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '@process("${1:Текст}");',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'кастомный блок'
    }, 
    {
        label: '@terminator (Кастомный блок "Терминатор")',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '@terminator("${1:Текст}");',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'кастомный блок'
    }, 
    {
        label: '@method (Кастомный блок "Предопределенный процесс")',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '@method("${1:Текст}");',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'кастомный блок'
    }, 
    {
        label: '@loop (Кастомный блок "Цикл")',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '@loop("${1:Имя}", "${2:Текст начала}", "${3:Текст конеца}") {\n$4\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'кастомный блок'
    }, 


   
    
    // {        
    //     label: 'getIniString',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'getIniString(${1:sec}, ${2: key})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'From the ini type data, according to the section and key, get the value corresponding to the key, return as a string'
    // },    {
    //     label: 'getIniInt',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'getIniInt(${1:sec}, ${2: key})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'From the ini type data, according to the section and key, get the value corresponding to the key, return as an integer'
    // },    {
    //     label: 'getIniDouble',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'getIniDouble(${1:sec}, ${2: key})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'From the ini type data, according to the section and key, get the value corresponding to the key, return as a floating point number'
    // },    {
    //     label: 'isEmpty',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'isEmpty(${1:str})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'Judge if str is empty'
    // },    {
    //     label: 'isEqual',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'isEqual(${1:str1}, ${2: str2})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'Judge if str is empty'
    // },    {
    //     label: 'isContain',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'isContain(${1:str})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'Judge whether the data item contains str'
    // }, {
    //     label: 'getJsonInt',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'getJsonInt(${1:path})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'Get the value returned as an integer in JSON data according to path'
    // },    {
    //     label: 'getJsonDouble',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'getJsonDouble(${1:path})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'Get the value returned as an integer in JSON data according to path'
    // },    {
    //     label: 'getJsonSize',
    //     kind: monaco.languages.CompletionItemKind.Function,
    //     insertText: 'getJsonSize(${1:path})',
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'Get the length of the data as an array type in JSON data according to path'
    // },
    //      /** * statement */    
    // {
    //     label: 'IF-ELSE',
    //     kind: monaco.languages.CompletionItemKind.Snippet,
    //     insertText: [            
    //         'if (${1:condition}) then',
    //         '\t$0',
    //         'else',
    //         '\t$0',
    //         'end'
    //     ].join('\n'),
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'If-Else Statement'
    // },    {
    //     label: 'WHILE-DO',
    //     kind: monaco.languages.CompletionItemKind.Snippet,
    //     insertText: [
    //         'WHILE ${1:condition} DO',
    //         '\t$0',
    //         'END'
    //     ].join('\n'),
    //     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //     documentation: 'WHILE-DO Statement'
    // }
    ];
}
 