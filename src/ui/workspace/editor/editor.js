// import styles from '@/app/ui/home.module.css';
"use client";
import './editor.css';
import Editor, { loader }  from "@monaco-editor/react";
import { useEffect, useState, useRef } from 'react'
import themeStrongDark from "./themes/strong-dark.json";
// import themeDarkPaper from "./themes/dark-paper.json";
import EditorState from "../../../vars";

// import { useEditorLanguageConfig } from "./use-editor-lang-config";
//import LangProvider from "@app/lang/pslang";
// import PSLTokensProvider from './lang/pslTokensProvider';

export default function MyEditor() {

    // useEditorLanguageConfig({
        // languageId: "pslang",
        // tokensProvider: PSLTokensProvider(),
    // });

    const ref = useRef();

    useEffect(() => {
        EditorState.editorElement = ref.current;
    });

    return (
        <div className="editorbody" ref={ref}>
            <Editor 
                defaultValue={
// `
  

//   readln(line);
//   readln(m);
//   sum:=0;
  
//   for i:=0 to m-1 do begin
//     mo := line mod 10;
//     sum := sum + mo;
//     line := line div 10;
//     if (line = 0) then break;
//   end;
  
//     writeln(sum);
  
// `
`
scanf(meows); // reading amount of meows
scanf(frogs); // reading amount of frogs
wehs = 10;

if(meows > frogs) {
    printf("Meow!");
} else {
    printf("Frog...");
}

for (i = 0; i < wehs; i=i+1) {
    printf("Weh!");
}

@data("Cutom block of data :D");
`
}
                editorDidMount={(editor) => {
                    console.log("editorDidMountEDITOR", editor);
                }}
                beforeMount={(monaco) => {
                    EditorState.editor = () => monaco.editor.getEditors()[0];
                    console.log("EDITOR", EditorState.editor());
                    monaco.editor.defineTheme("strong-dark", themeStrongDark);
                    // monaco.editor.defineTheme("dark-paper", themeDarkPaper);
                    // monaco.editor.getModel().updateOptions({ tabSize: 4 });
                    // monaco.addAction();
                }}
                theme="strong-dark" 
                // theme="dark-paper"
        // theme="vs-dark"
                defaultLanguage={"pslang"}
                // language="mySpecialLanguage"
            />
            {/*<div className={styles.linesnums}>
                {eNums}
            </div>
            <span className={styles.codebody} ref={createRef} contentEditable suppressContentEditableWarning={true} tabIndex="-1">
                {eLines}
            </span>*/}
        </div>
    );
}


// function CodeEditor() {
//     return (
//             <CodeLine/>
//     );
// }

function CodeLine({lineId=0, keyDownHandler=(e,k)=>{}}, needFocus = false) {
    // useEffect(() => {
    //     const keyDownHandler = (e) => {
    //         if(e.code == 'Tab') {
    //             console.log(e);
    //             e.preventDefault();
    //         }
    //     };
    //     document.addEventListener("keydown", keyDownHandler);
    //     return () => {
    //         document.removeEventListener("keydown", keyDownHandler);
    //     };
    // }, []);
    let ref = null;

    function createRef(r) {
        ref = r;
    }

    // const preKeyDownHandler = (e) => {
        // console.log('preKeyDownHandler', e);
        // keyDownHandler(e, lineId);
    // };

    useEffect(() => {
        // console.log('ref', ref);
            // ref.setAttribute('tabindex', '0');
        // if(needFocus) {
        //     ref.focus();
        // }
        // ref.addEventListener("keydown", preKeyDownHandler);
        // // ref.addEventListener("click", preKeyDownHandler);
        // console.log('addEventListener', ref);
        // return () => {
        //     console.log('removeEventListener', ref);
        //     ref.removeEventListener("keydown", preKeyDownHandler);
        // };


        // var tag = document.getElementById("editable"); 
          
        // Creates range object 
        let setpos = document.createRange(); 
          
        // Creates object for selection 
        let set = window.getSelection(); 
          
        // Set start position of range 
        setpos.setStart(ref, 0); 
          
        // Collapse range within its boundary points 
        // Returns boolean 
        setpos.collapse(true); 
          
        // Remove all ranges set 
        set.removeAllRanges(); 
          
        // Add range with respect to range object. 
        set.addRange(setpos); 
    }, []);

    return (
        <span className="codeline" ref={createRef} tabIndex="-1" id={`line${lineId}`}>
            Line {lineId}
        </span>
    );
}

// const useFocus = () => {
//     const htmlElRef = useRef(null)
//     const setFocus = () => {htmlElRef.current &&  htmlElRef.current.focus()}
//     return [ htmlElRef, setFocus ] 
// }