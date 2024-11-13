import "./App.css";
import React, { useEffect } from 'react'
// import { useMonaco } from "@monaco-editor/react";
import Editor, { loader } from "@monaco-editor/react";
import { StrictMode } from 'react';

import EditorState from './vars';
import Workspace from "./ui/workspace/workspace";
import Toolbar from "./ui/toolbar";
import Banner from "./ui/banner";
// import Char from "./ui/char";
import pslTokensProvider from './lang/pslTokensProvider';
import pslCompProvider from './lang/pslCompProvider';


function lang() {
    if(EditorState.loaderInited) return;
    loader.init().then((monaco) => {
        EditorState.loaderInited = true;
        monaco.languages.register({ id: "pslang" });
    
        monaco.languages.setMonarchTokensProvider('pslang', pslTokensProvider);

        monaco.languages.registerCompletionItemProvider('pslang', {
            provideCompletionItems: () => {
                return { suggestions: pslCompProvider(monaco) }    
            }      
        });

        monaco.editor.addEditorAction({
            id: "my.delete.line",
            label: "Delete line",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.5,
            run: function (ed) {
                let action = ed._actions.get("editor.action.deleteLines");
                action._run();
            },
        });

        monaco.editor.addEditorAction({
            id: "my.delete.save",
            label: "Save",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.5,
            run: function (ed) {
                EditorState.onEditorUpdate(ed);
            },
        });
        if(monaco != undefined) EditorState.monaco = monaco;
    });
}

function App() {
    useEffect(() => {
        lang();
    });
    return (
        <div className="overflow-hidden">
            {/*<Char/>*/}
            <main className="">
                <Toolbar/>
                <Workspace/>
                <Banner/>
            </main>
        </div>
    );
}

export default App;
