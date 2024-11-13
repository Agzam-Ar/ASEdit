import './toolbar.css';

import React, {useState, useEffect, useRef } from 'react'

import { PiFileSvg } from "react-icons/pi";
import { PiFilePng } from "react-icons/pi";
import { PiQuestionMarkFill } from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";
import { MdContentCopy } from "react-icons/md";
import { PiFlaskDuotone } from "react-icons/pi";

import EditorState from "../vars";
import Slidebar from "../ui/laf/slidebar";

const GLOBAL_VERSION =      '2024.10.26-a';
const HELP_VERSION =        '2024.10.19-a';
const SETTINGS_VERSION =    '2024.10.19-a';

export default function Toolbar() {
    const [url, setUrl] = useState(EditorState.prefs.$url());
    const [helpVersion, setHelpVersion] = useState(localStorage.getItem('help-version'));
    const [settingsVersion, setSettingsVersion] = useState(localStorage.getItem('settings-version'));

    const [help, setHelp] = useState(2);
    const [settings, setSettings] = useState(2);
    

    useEffect(() => {
        const keydownListener = e => {
            if(e.code == 'Escape') {
                console.log(help, settings);
                setHelp(help => help != 2 ? true : help);
                setSettings(settings => settings != 2 ? true : settings);
            }
        };
        window.addEventListener('keydown', keydownListener);
        return () => {
            window.removeEventListener('keydown', keydownListener);
        };
    }, []);

    const [schemeFontValue, setSchemeFontValue] = useState(decodeURIComponent(EditorState.prefs.$get('font')));

    const setPref = (name, value) => {
        EditorState.prefs[name] = value;
        EditorState.prefs.$save();
        setUrl(EditorState.prefs.$url());
    };

    const prefBool = (label, config, val1, val2) => {
        return  <div className='settings-pref'>
                   <label>{label}</label> <Slidebar value={(EditorState.prefs.$get(config)==1?val1:val2)} values={[val1,val2]} onSelect={s => setPref(config, s == val1)?1:0}/>
                </div>;
    };

    return (
        <div>
            <main className="toolbar">
                ASEdit
                <div className="toolbar-separator"></div>
                <div className="icon" onClick={e => {EditorState.export("png")}}><PiFilePng /></div>
                <div className="icon" onClick={e => {EditorState.export("svg")}}><PiFileSvg /></div>
                <div className="icon" onClick={e => {EditorState.export("drawio")}}>
                    {/*Draw.IO*/}
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="
                        M216,88
                        v24a8,8,0,0,1-16,0V96H152a8,8,0,0,1-8-8V40H56v72a8,8,0,1,1-16,0V40A16,16,0,0,1,56,24h96a8,8,0,0,1,5.65,2.34l56,56A8,8,0,0,1,216,88Z
                        m-56-8 h28.69L160,51.31Z
                        "></path>
                        <text x="128" y="130" fontSize="20em" dominantBaseline="middle" textAnchor="middle" transform="scale(1, 1.5)" style={{fontSize: "4.2em", userSelect:"none !important", cursor:"default"}}>DrawIO</text>
                    </svg>
                </div>
                <div className={"icon settings" + (settingsVersion == SETTINGS_VERSION ? "" : " unread")} onClick={e => {setSettings(settings => {
                    if(settings && help != 2) setHelp(() => true);
                    if(settings) {
                        setSettingsVersion(SETTINGS_VERSION);
                        localStorage.setItem('settings-version', SETTINGS_VERSION);
                    }
                    return !settings;
                })}}><IoSettingsOutline/></div>
                <div className={"icon" + (helpVersion == HELP_VERSION ? "" : " unread")} onClick={e => {setHelp(help => {
                    if(help && settings != 2) setSettings(() => true);
                    if(help) {
                        setHelpVersion(HELP_VERSION);
                        localStorage.setItem('help-version', HELP_VERSION);
                    }
                    return !help;
                })}}><PiQuestionMarkFill /></div>
            </main>
            <div className={`site-help${help == 2 ? "" : (help ? " close" : " open")}`}>
                <h1>ASEdit синтаксис</h1>
                <p>Привет, я постарался приблизить синтаксис к <b>Java / C / C++</b>, местами добавив возможность использования синаксиса <b>Pascal</b> как альтернативы</p>
                <p>Обрати внимание, что <b>{"#"}include</b>, <b>main()</b>, <b>program MyPascal</b> и прочие привычные конструкции скорее всего выдадут ошибку, 
                поэтому вставляйте только тот код который идет после <b>main</b>:</p>
                <code>
                    <span className="cm">{"#include"}</span>{" <stdio.h>"}<span className="err">{"\t<= эту строку не надо\n"}</span>
                    {/*<span className="kw">int</span>{` main()`}<span className="err">{"\t\t\t\t<= эту тоже не надо\n"}</span>*/}
                    {/*{"{"}<span className="err">{"\t\t\t\t\t\t\t<= скобку после main() тоже не надо\n"}</span>*/}
                    {/*{"\t...\t\t\t\t\t"}<span className="correct">{"<= все че тут можно пихать\n"}</span>*/}
                    {/*{"}"}<span className="err">{"\t\t\t\t\t\t\t<= закрывающую скобку метода main() не надо\n"}</span>*/}
                </code>
                <p>Аналогично и для <b>Pascal</b>:</p>
                <code>
                    <span className="kw">{"program"}</span>{" Hello;"}<span className="err">{"\t\t\t\t\t\t\t\t\t\t<= эту строку не надо\n"}</span>
                    <span className="kw">var</span>{` line : `}<span className="kw">{"longint"}</span>;<span className="err">{"\t\t\t\t\t\t\t\t<= объявления переменных не нужны\n"}</span>
                    <span className="kw">{"function"}</span> weh(abacaba <span className='u-err'>:</span><span className='kw u-err'>longint</span>)<span className="u-err">:</span><span className="kw u-err">{"longint"}</span>;<span className="err">{"\t<= типы функций не нужны\n"}</span>
                    {/*<span className="kw">begin</span><span className="err">{"\t\t\t\t\t\t<= начало тела программы не надо, это аналогично скобке у main\n"}</span>*/}
                    {/*{"\t...\t\t\t\t\t"}<span className="correct">{"<= все че тут можно пихать\n"}</span>*/}
                    {/*<span className="kw">end.</span><span className="err">{"\t\t\t\t\t\t<= конец тела программы не надо, это аналогично закрывающей скобке у main\n"}</span>*/}
                </code>

                <h2>Особые конструкции</h2>
                <p>Ты можешь создавать кастомные блоки:</p>
                <code>
                    <span className="bl">{`@process`}</span>(<span className="str">"текст блока"</span>);<span className="cm">{`\t\t\t\t\t\t\t\t\t\t<= создаст блок типа "Процесс" (прямоугольник)\n`}</span>
                    <span className="bl">{`@data`}</span>(<span className="str">"текст блока"</span>);<span className="cm">{`\t\t\t\t\t\t\t\t\t\t\t<= создаст блок типа "Данные" (наклонные края)\n`}</span>
                    <span className="bl">{`@terminator`}</span>(<span className="str">"текст блока"</span>);<span className="cm">{`\t\t\t\t\t\t\t\t\t<= создаст блок типа "Терминатор" (стадион)\n`}</span>
                    <span className="bl">{`@method`}</span>(<span className="str">"текст блока"</span>);<span className="cm">{`\t\t\t\t\t\t\t\t\t\t\t<= создаст блок типа "Предопределенный процесс" (прямоугольник с двойным краем)\n`}</span>
                    <span className="bl">{`@loop`}</span>(<span className="str">"Имя цикла"</span>, <span className="str">"Верхний текст"</span>, <span className="str">"Нижний текст"</span>{") {"}<span className="cm">{`\t<= создаст конструкцию типа "Цикл" (гамбургер)\n`}</span>
                    {"\t...\t\t\t\t\t"}<span className="cm">{"\t\t\t\t\t\t\t\t\t\t\t<= все че в цикле\n"}</span>
                    {"}"}
                </code>

                {/*<p>Так же на данный момент отсутсвует синтаксис условий и циклов в одну строчку, это значит что код на подобии этого не будет распознан корректно:</p>
                <code>
                    <span className="kw">if</span>{`(...)\n\t`}<span className="fun">printf</span>{`(`}<span className="str">"Meow"</span>{`);`}
                </code>
                <p>Вместо этого вам надо написать:</p>
                <code>
                    <span className="kw">if</span>{`(...) {\n\t`}<span className="fun">printf</span>{`(`}<span className="str">"Meow"</span>{`);\n}`}
                </code>*/}
                <p>Все пожелания / баги / благодарности / критику пишите в <a href="https://discordapp.com/users/962346067909836821">Discord</a></p>
                <div className='help-version'>Версия: {GLOBAL_VERSION}</div>
            </div>
            <div className={`site-settings${settings == 2 ? "" : (settings ? " close" : " open")}`}>
                <h1>Настройки</h1>
                {/*<i>Пока тут ничего нет :(</i>*/}
                    
                <div className='settings-pref'>
                   <label>Ширина линий:</label> <Slidebar value={EditorState.prefs.$get('strokeWidth')+""} values={[0,0.1,0.25,.5,1,1.5,2,3,4,6]} onSelect={s => setPref("strokeWidth", s)}/>
                </div>
                {/*{prefBool(`Циклы`, `noLoop`, "цикл из условий", "стандартный цикл")}*/}
                {/*{prefBool(`Типы данных:`, `showVartypes`, "показывать", "игнорировать")}*/}
                {/*{prefBool(`PNG альфа:`, `alpha`, "прозрачный фон", "белый фон")}*/}
                {/*{prefBool(`Ширина блока:`, `sameWidth`, "единая", "компактная")}*/}
                <PrefBool label="Циклы" config="noLoop" val1="цикл из условий" val2="стандартный цикл" />
                <PrefBool label="Типы данных" config="showVartypes" val1="показывать" val2="игнорировать" />
                <PrefBool label="PNG альфа" config="alpha" val1="прозрачный фон" val2="белый фон" />
                <PrefBool label="Ширина блока" config="sameWidth" val1="единая" val2="компактная" />
                <div className='settings-pref'>
                   <label htmlFor="scheme-font-input">Шрифт:</label> <input id="scheme-font-input" value={schemeFontValue} placeholder={EditorState.defPrefs.font} onInput={e => {
                        let font = e.target.value;
                        console.log('Font');
                        setSchemeFontValue(f => font);
                        if(font == "") {
                            setPref('font', encodeURIComponent(EditorState.defPrefs.font));
                        } else {
                            setPref('font', encodeURIComponent(font));
                        }
                   }}></input>
                </div>

                <div className='settings-pref'>
                   <label>X-Отступ <span style={{color:"gray",userSelect:"none"}}>(px)</span></label> 
                   <Slidebar value={EditorState.prefs.$get('paddingx')+""} values={[0,2.5,5,10,15,20]} onSelect={s => {
                        setPref("paddingx", s);
                   }}/>
                </div>
                <div className='settings-pref'>
                   <label>Y-Отступ <span style={{color:"gray",userSelect:"none"}}>(px)</span></label> 
                   <Slidebar value={EditorState.prefs.$get('paddingy')+""} values={[0,2.5,5,10,15,20]} onSelect={s => {
                        setPref("paddingy", s);
                   }}/>
                </div>

                <div className='settings-pref'>
                   <label>X-Расстояние <span style={{color:"gray",userSelect:"none"}}>(px)</span></label> 
                   <Slidebar value={EditorState.prefs.$get('marginx')+""} values={[0,2.5,5,10,15,20,40]} onSelect={s => {
                        setPref("marginx", s);
                   }}/>
                </div>
                <div className='settings-pref'>
                   <label>Y-Расстояние <span style={{color:"gray",userSelect:"none"}}>(px)</span></label> 
                   <Slidebar value={EditorState.prefs.$get('marginy')+""} values={[0,2.5,5,10,15,20,40]} onSelect={s => {
                        setPref("marginy", s);
                   }}/>
                </div>
                {/*
                <div className='settings-pref'>
                   <label>Циклы:</label> <Slidebar value={(EditorState.prefs.$get('noLoop')==1?"цикл из условий":"стандартный цикл")} values={[]} onSelect={s => setPref("noLoop", s == "цикл из условий")?1:0}/>
                </div><div className='settings-pref'>
                   <label>Типы данных:</label> <Slidebar value={(EditorState.prefs.$get('showVartypes')==1?"показывать":"игнорировать")} values={["показывать", "игнорировать"]} onSelect={s => setPref("showVartypes", s == "показывать")?1:0}/>
                </div>
                <div className='settings-pref'>
                   <label>PNG альфа:</label> <Slidebar value={(EditorState.prefs.$get('alpha')==1?"прозрачный фон":"белый фон")} values={["прозрачный фон", "белый фон"]} onSelect={s => setPref("alpha", s == "прозрачный фон")?1:0}/>
                </div>*/}
                {/*<div className='settings-pref'>
                   <label>Ширина линий:</label> <Slidebar values={[0,0.25,.5,1,1.5,2,4,6]}/>
                </div>*/}
               {/* <div className='settings-pref'>
                   <label>Язык:</label> <Slidebar value={EditorState.prefs.$get('lang')+""} values={["смесь", "си подобный", "Pascal"]} onSelect={s => setPref("lang", s)}/>
                </div>*/}
                
                <div className='settings-pref'>
                <label>Поделится настройками:</label> 
                    <div className='settings-url' id="settings-url">{url}</div>
                    <div className='copy-button' onClick={() => {
                        var textArea = document.createElement("textarea");
                        // textArea.style.display = 'none';
                        textArea.value = url;
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                          var successful = document.execCommand('copy');
                          var msg = successful ? 'successful' : 'unsuccessful';
                        } catch (err) {
                          console.error(err);
                        }
                        document.body.removeChild(textArea);
                        // let eurl = document.getElementById('settings-url');
                        // console.log(eurl);
                        // eurl.focus();
                        // eurl.select();
                        document.getElementById('url-copyed-label').animate(
                          [
                            { opacity: "1" },
                            { opacity: "1" },
                            { opacity: "1" },
                            { opacity: "1" },
                            { opacity: "0" },
                          ], {
                            duration: 1000,
                            iterations: 1
                          }
                        );
                    }}><MdContentCopy/></div><div id="url-copyed-label" className="copyed-label">Скопировано!</div>
                </div>
                <h1 className="experement-label"><div className="experement-label"><PiFlaskDuotone /></div><label className="experement-label">Эксперементальные</label></h1>
                <PrefBool label="Редактируемые блоки" config="editableBlocks" val1="да" val2="нет" />

                {/*<div className="settings-button">Сбросить</div>*/}
                {/*<div className="settings-button">Скопировать</div>*/}
                {/*<div className="settings-button">Сохранить</div>*/}
                {/*<label>Масштаб: </label><input type="number" name="" id="settings-image-scale" onChange={e => {}} min="0.1" step="0.1" max="10"/>*/}
            </div>
        </div>
    );
    
    function PrefBool(props) {
        return  <div className='settings-pref'>
                   <label>{props.label}</label> <Slidebar value={(EditorState.prefs.$get(props.config)==1?props.val1:props.val2)} values={[props.val1,props.val2]} onSelect={s => setPref(props.config, s == props.val1)?1:0}/>
                </div>;
    }
}


