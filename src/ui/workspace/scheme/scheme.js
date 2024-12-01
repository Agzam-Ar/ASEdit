"use client";
import React, {useState, useEffect, useRef } from 'react'
import './scheme.css';
import EditorState from "../../../vars";
import Block from "../../../libs/block";
import Node from "../../../libs/lexer/node";
import Char from "./char";
import SVGNode from "./svgnode";
import SVGArrow from "./svgarrow";
import DIOCell from "./diocell";

import { IoIosWarning } from "react-icons/io";
import { MdError } from "react-icons/md";

let eCanvas = null;
let g = null;

let camera = {
    pos: {x:0,y:0},
    scale: 10,
    width: 100,
    height: 100,
};
camera.x = (x=0) => Math.floor((x-camera.pos.x)*camera.scale);
camera.y = (y=0) => Math.floor((y-camera.pos.y)*camera.scale);
camera.ux = (x=0) => x/camera.scale+camera.pos.x;
camera.uy = (y=0) => y/camera.scale+camera.pos.y;
camera.scl = s => Math.ceil(s*camera.scale);

const mouse = {
    offset: {x:0,y:0}, // canvas offset
    x: 0, y: 0,
    down: false,
    dx: () => mouse.x - mouse.offset.x,
    dy: () => mouse.y - mouse.offset.y,
}

let eBlocks = [];
let arrows = {};

let config = {
    sameWidth: true,
    basewidth: 10,
    commentmargin: 20,
    commentpadding: 10,
    margin: 20, // 20
};

let zone = {
    minX: 0,
    maxX: 0
};

let $repaints = 0;

export default function Scheme() {

    const [updates, setUpdates] = useState(0);
    const [size, setSize] = useState([100, 100]);
    
    EditorState.repaint = () => {
        resizeHanler();
        setUpdates(updates => {
            return updates + 1;
        });
    };

    EditorState.export = (format) => {
        let mainSvg = document.getElementById('main-svg');
        // console.log(mainSvg);
        zone.maxX = Math.max(zone.maxX, EditorState.schemeNode.width());
        console.log( zone.maxX, EditorState.schemeNode.width());

        mainSvg.setAttribute("fill", "#000");
        mainSvg.setAttribute("stroke", "#000");
        mainSvg.setAttribute("font-family", "monospace");
        mainSvg.setAttribute("viewBox", `${zone.minX} ${zone.minY} ${(zone.maxX-zone.minX)} ${(zone.maxY-zone.minY)}`);
        canvas.current.setAttribute("fill", "#000");
        canvas.current.setAttribute("stroke", "#000");
        let oldGAttributes = [];
        let groups = mainSvg.getElementsByTagName('g');
        for (let g of groups) {
            oldGAttributes.push(g.getAttribute('stroke'));
            g.setAttribute("stroke", "#000");
        }
        const saveFile = () => {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'scheme.' + format;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
    
            for (var i = 0; i < groups.length; i++) {
                groups[i].setAttribute("stroke", oldGAttributes[i]);
            }
            canvas.current.setAttribute("fill", "#fff");
            canvas.current.setAttribute("stroke", "#7a7a7a");
            mainSvg.setAttribute("fill", "#7a7a7a");
            mainSvg.setAttribute("stroke", "#7a7a7a");
            EditorState.repaint();
            let scale = Math.max((zone.maxX-zone.minX) / width, (zone.maxY-zone.minY) / height);
            mainSvg.setAttribute("viewBox", `${zone.minX} ${zone.minY} ${width*scale} ${height*scale}`);
        };
        
        let url = "";

        if(format == 'svg') {
            url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(mainSvg.outerHTML)))}`;
            saveFile();
            return;
        }
        if(format == 'drawio') {
            url = `data:image/xml;base64,${btoa(unescape(encodeURIComponent(DIOCell.toString())))}`;
            saveFile();
            return;
        }

        if(format == 'png') {
            let scale = 2;
            let exportCanvas = document.getElementById('exportCanvas');
            exportCanvas.width = (zone.maxX-zone.minX)*scale;
            exportCanvas.height = (zone.maxY-zone.minY)*scale;
            // console.log(exportCanvas);
            let g = exportCanvas.getContext('2d');
            var img = new Image();
            img.onload = function() {
                console.log(img);
                g.scale(scale, scale);
                if(EditorState.prefs.alpha != 1) {
                    g.fillStyle = '#fff';
                    g.fillRect(0, 0, exportCanvas.width/scale, exportCanvas.height/scale);
                    g.fillStyle = '#000';
                }
                g.font = `15px ${EditorState.prefs.$get('font')}`;
                console.log(g.font, EditorState.prefs.$get('font'));
                g.drawImage(img, 0, 0, exportCanvas.width/scale, exportCanvas.height/scale);
                // g.scale(1/scale, 1/scale);
                url = `${exportCanvas.toDataURL('image/png')}`;
                saveFile();
                return;
            }
            url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(mainSvg.outerHTML)))}`;
            img.src = url;
        }


    };

    const resizeHanler = e => {
        // if(size[0] != eCanvas.clientWidth || size[1] != eCanvas.clientHeight) {
            setSize(size => [eCanvas.clientWidth, eCanvas.clientHeight]);
        // }
        camera.width = eCanvas.clientWidth;
        camera.height = eCanvas.clientHeight;


    };

    const canvas = useRef();
    useEffect(() => {
        eCanvas = canvas.current.parentElement.parentElement;

        repaint();
    

        eCanvas.addEventListener('resize', resizeHanler);

        return () => {
            eCanvas.removeEventListener('resize', resizeHanler);
        };
    }, []);

    eBlocks = [];
    arrows = {};
    zone.minX = 0;
    zone.maxX = 0;
    zone.minY = 0;
    zone.maxY = 0;


    let eArrows = [];
    // WEH

    let errors = [];

    let errorsCounter = {
        error: 0,
        warn: 0
    };

    DIOCell.root = DIOCell.createRoot("root");
    DIOCell.arrows = 0;

    if(EditorState.schemeNode != null) {
        zone.minX = 9999;
        zone.maxX = -9999;
        zone.minY = 9999;
        zone.maxY = -9999;
    
        Node.basewidth = 0;
        config.basewidth = EditorState.schemeNode.maxContentWidth();
        if(EditorState.prefs.$get("sameWidth")) {
            Node.basewidth = config.basewidth;
        }
        config.maxDeepth = EditorState.schemeNode.getMaxDeepth();

        config.columnsWidth = {};
        EditorState.schemeNode.build(config);

        drawNode(EditorState.schemeNode);


        zone.maxX = Math.max(zone.maxX, EditorState.schemeNode.width());//x+width/2);

        for (let error of EditorState.errors) {
            let line = 0;
            let preLineStart = 0;
            let lineStart = 0;
            let position = 0;
            let lastPos = 0;

            let lastLine = "";
            for (var i = 0; i < error.index; i++) {
                position++;
                lastLine += EditorState.code.charAt(i);
                if(EditorState.code.charAt(i) == '\n') {
                    preLineStart = lineStart;
                    lineStart = i;
                    line++;
                    lastPos = position;
                    position = 0;
                    lastLine = "";
                }
            }
            errorsCounter[error.type]++;
            let lineEnd = EditorState.code.indexOf('\n', lineStart+1);
            if(lineEnd == -1) lineEnd = EditorState.code.length-1;
            let code = EditorState.code.substring(EditorState.code.charAt(lineStart) == '\n' ? lineStart+1 : lineStart, lineEnd);
            errors.push(<div key={errors.length} className={"error-body " + error.type}>
                <div className="error-text"><div className="error-icon">{(error.type == 'error' ? <MdError /> : <IoIosWarning />)}</div>{error.text}</div>
                <div className="error-code">{code}</div>
                <div className="error-line" onClick={e => {
                    for (var i = 0; i < 10; i++) {
                        try {
                            let editor = EditorState.editor();
                            // console.log(editor);
                            editor.revealLine(line+1);
                            let sel = editor.getSelection();
                            // console.log(sel);
                            // console.log(line+1, position,  position + Math.max(1, Math.abs(error.endIndex-error.index)));
                            sel = sel.setStartPosition(line+1, position);
                            editor.setSelection(sel);
                            sel = sel.setEndPosition(line+1, position + Math.max(1, Math.abs(error.endIndex-error.index)));
                            editor.setSelection(sel);
                            // editor.setPosition({lineNumber: line+1, column: position });
                        } catch (e) {
                            console.error(e);
                        }
                    }
                                        // EditorState.monaco.editor.setSelection(new EditorState.monaco.Selection(line, 0, 0, 0));
                }}>Line:{line+1}</div>
            </div>)
        }
        
        // searching arrows intersection
        let intersections = [];
        for (let ah of Object.values(arrows)) {
            let hx1 = (ah.x);
            let hy1 = (ah.y);
            if(ah.target == undefined) continue;
            let hx2 = (ah.target.x);
            let hy2 = (ah.target.y);
            if(hx1-hx2 == 0) continue;
            for (let av of Object.values(arrows)) {
                let vx1 = (av.x);
                let vy1 = (av.y);
                if(av.target == undefined) continue;
                let vx2 = (av.target.x);
                let vy2 = (av.target.y);
                if(vy1-vy2 == 0) continue;
                
                if(hx1 < vx1 && vx1 < hx2 &&
                   vy1 < hy1 && hy1 < vy2) {
                    // if(av.intersections == undefined) av.intersections = [];
                    if(ah.intersections == undefined) ah.intersections = [];

                    console.log(ah);
                    // av.intersections.push({x:vx1,y:hy1);
                    ah.intersections.push({x:vx1,y:hy1});
                    // intersections.push({v:av,h:ah,x:vx1,y:hy1});
                }
            }
        }

        // for(let a of intersections) {
        //     eArrows.push(<rect key={eArrows.length}  x={a.x-5} y={a.y-5} width={10} height={10}></rect>);
        // }
        EditorState.arrows = arrows;
        // drawing arrows
        let arrowId = -1;
        for (let f of Object.values(arrows)) {
            arrowId++;
            let target = f.target;
            if(target == undefined) continue;
            let ta = getArrowNode(target.x,target.y);
            let needHead = f.head || ta.set == undefined;//arrows[]
            let x1 = (f.x);
            let y1 = (f.y);
            let x2 = (target.x);
            let y2 = (target.y);

            let d = `M${x1} ${y1}`;
            if(f.intersections != undefined) {
                let delta = Node.margin.y/4;
                for(let p of f.intersections) {
                    d += ` L${p.x-delta} ${p.y}`;
                    d += ` L${p.x-delta} ${p.y-delta}`;
                    d += ` L${p.x+delta} ${p.y-delta}`;
                    d += ` L${p.x+delta} ${p.y}`;
                }
            }
            if(needHead) d += `L ${x2} ${y2}`;
            else d += `L ${target.x} ${target.y}`;
            eArrows.push(<SVGArrow key={`svg-arrow-` + eArrows.length} id={arrowId} d={`${d}`} head={needHead} start={{x:f.x,y:f.y}} end={{x:target.x,y:target.y}}/>);
        }
    }

    camera.width = size[0];
    camera.height = size[1];
    let width = camera.width;
    let height = camera.height;

    zone.minX -= config.margin;
    zone.maxX += config.margin;
    zone.minY -= config.margin;
    zone.maxY += config.margin;

    let scale = Math.max((zone.maxX-zone.minX) / width, (zone.maxY-zone.minY) / height);

    EditorState.scale = scale;
    
    window["DIOCell"] = DIOCell;
    // console.log(scale, zone);
    // scale = 1.5;
    // scale *= 1.5;

	return (<div className="canvasbody">
        <svg xmlns="http://www.w3.org/2000/svg" className="scheme-font" className="hidden-svg">
            <Char/>
        </svg>
        <canvas id="exportCanvas" className="hidden-canvas">{updates}</canvas>
        {/*{updates}*/}
        <div className={'errors-box' + (errors.length == 0 ? ' hidden' : '')}>
            <div className="errors-counter">
                {errorsCounter.error == 0 ? "" : <div className="error"><MdError/>{errorsCounter.error}</div>}
                {errorsCounter.warn == 0 ? "" : <div className="warn"><IoIosWarning/>{errorsCounter.warn}</div>}
            </div>
            {errors}
        </div>
        <div className="svg-box" contentEditable={EditorState.prefs.$get('editableBlocks')} suppressContentEditableWarning={true}>
            <svg style={{font:EditorState.prefs.$get('font')}} viewBox={`${zone.minX} ${zone.minY} ${width*scale} ${height*scale}`} xmlns="http://www.w3.org/2000/svg" id="main-svg" className="scheme-font" fill="#7a7a7a">
                <style>
                    {
                    `text {
                        font-family: ${EditorState.prefs.$get('font')};
                        font-size: 15px;
                    }`
                    }
                </style>
                <defs>
                    <marker 
                        id='arrow-head' 
                        orient="auto" 
                        markerWidth='3' 
                        markerHeight='4' 
                        refX='1' 
                        refY='2'
                    >
                    {/*<path d='M0,0 V4 L2,2 Z'/>*/}
                    <path strokeWidth='1' d='M0,0 V4 L2,2 Z'/>
                  </marker>
                </defs>
                <g ref={canvas} stroke="#7a7a7a" fill="#fff" strokeWidth={EditorState.prefs.strokeWidth} strokeLinecap="round">
                    <g stroke="#7a7a7a" fill="none" strokeWidth={EditorState.prefs.strokeWidth} strokeLinecap="square">
                        {eArrows}
                    </g>
                    {eBlocks}
                </g>
            </svg>
        </div>
    </div>);
}

function repaint() {}

let keys = 0;

let loopstartsPoints = {};

function drawNode(node, x=0, y=0, arrowsListeners=[]) {

    let width = EditorState.prefs.$get("sameWidth") ? config.basewidth : node.contentWidth();
    let height = node.contentHeight();

    let translate = {x:x - width/2,y:y/* - height/2*/};
    node.lastdraw = {x:x,y:y};

    let e = null;
    let eComment = null;
    let customChildren = false;

    let diocell = null;
        
    let maxX = Math.max(node.width(), node.width()/2 + node.commentWidth() - Node.commentmargin.x);
    
    let box = {x:0,y:0,width:width,height:height};

    let dioComment = () => {};

    let callback = {};

    if(node.shape == Node.shapeHidden) {
        e = [
            // <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.type}</text>,
            // <rect key="box" fill="none" stroke="#77777700" fill="#ff000011" x="0" y={0} width={node.width()} height={node.height()} />
        ];
        translate.y = y;
    } else if(node.shape == Node.shapeProcess) {
        e = [
                <rect key="box" fill="transparent"  x="0" width={width} height={height} />,
                <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>
        ];
        diocell = DIOCell.createCell(node, {x:x,y:y,width:width,height:height});
    } else if(node.shape == Node.shapeFunction) {
        e = [
                <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
                <rect key="box" fill="transparent"  x="0" width={width} height={height} />,
                <rect key="box-2" fill="none"  x={height/3} width={width-height*2/3} height={height} />
        ];
        diocell = DIOCell.createCell(node, {x:x,y:y,width:width,height:height}, DIOCell.styles.process);
    } else if(node.shape == Node.shapeTerminator) {
        e = [
            <rect key="touch-box" fill="transparent" stroke="transparent" x="0" width={width} height={height}/>,
            <rect key="box" fill="transparent"  x="0" width={width} height={height} ry={height/2} />,
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>
        ];
        if(node.type == 'continue' || node.type == 'break') diocell = DIOCell.createCell(node, {x:x+width/2,y:y+height/2,width:0,height:0}, DIOCell.styles.empty, {value:""});
        else diocell = DIOCell.createCell(node, {x:x,y:y,width:width,height:height}, DIOCell.styles.terminator);
    } else if(node.shape == Node.shapeData) {
        e = [
            <rect key="touch-box" fill="transparent" stroke="transparent" x="0" width={width} height={height}/>,
            <path key="box" fill="none"  d={`M${height},0 L${width},0 L${width-height},${height} L0,${height} Z`}/>,
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
        ];
        diocell = DIOCell.createCell(node, {x:x,y:y,width:width,height:height}, DIOCell.styles.data);
    } else if(node.shape == Node.shapeLoopBegin) {
        e = [
            <rect key="touch-box" fill="transparent" stroke="transparent" x="0" width={width} height={height}/>,
            // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth)}deg 100% 50% / 10%)`} x="0" y="0" width={node.width()} height={node.height()} />,
            <text key="loop-name" stroke="none" x={width/2} y={height*.3} dominantBaseline="middle" textAnchor="middle">{node.name}</text>,
            <path key="box" fill="none"  d={`M${height/2},0 L${width-height/2},0 L${width},${height/2} L${width},${height} L0,${height} L0,${height/2} Z`}/>,
            <text key="text" stroke="none" x={width/2} y={node.value == "" ? height/2 : height*.7} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>
        ];
        diocell = DIOCell.createCell(node, {x:x,y:y,width:width,height:height}, DIOCell.styles.loopbegin, {
            value: node.name + '\n' + node.getValue(),
        });

        let dx = width + Node.margin.x;
        let dy = node.height() - height - Node.margin.y;

        node.lastdraw.continuey = height/2+dy;
        node.lastdraw.continuex = dx+width/2;
        node.lastdraw.continuerx = x + node.width() - width/2;

        let cdy = height + Node.margin.y;

        let leftm = 0;

        arrow(x,y+height,x, y + cdy);

        let arrowFromY = null;
        let lastChild = null;
        let lastCallback = null;
        let isFirst = true;
        for (let child of node.children) {
            if(arrowFromY == null) {
                // DIOCell.createArrow(node, child));
            } else {
                arrow(leftm + x, arrowFromY, leftm + x, y + cdy);
                // DIOCell.createArrow(lastChild, child));
            }
            let $callback = drawNode(child, leftm + x, y + cdy, [{x:leftm + x,y:y + cdy}]);

            if(lastChild != null) {
                if(lastChild.type == 'condition') {
                    if(lastCallback.dio != undefined) {
                        let fromNode = lastChild.thenTrue[lastChild.thenTrue.length-1];
                        if(fromNode.hasOutArrow()) DIOCell.createArrow(fromNode, child, [lastCallback.dio.thenTrueOut]);
                    }
                    if(lastChild.thenFalse == undefined) {
                        DIOCell.createArrow(lastChild, child);
                    } else {
                        let fromNode = lastChild.thenFalse[lastChild.thenFalse.length-1];
                        if(fromNode.hasOutArrow()) DIOCell.createArrow(fromNode, child);
                    }
                } else if(lastChild.shape == Node.shapeLoopBegin) {
                    DIOCell.createArrow(lastChild.children[lastChild.children.length-1], child);
                } else {
                    DIOCell.createArrow(lastChild, child);
                }
            } else if(isFirst) {
                DIOCell.createArrow(node, child);
            }
            isFirst = false;

            arrowFromY = child.arrowOutY() + y + cdy;
            lastChild = child;
            lastCallback = $callback;
            if(child.arrowCustom()) {
                arrowFromY = null;
                lastChild = null;
            }
            cdy += child.height();
            cdy += child.marginY();
        }
        if(arrowFromY != null) {
            arrow(x, arrowFromY, x, y + node.height() + Node.margin.y);
            // callback.dio = {};
            // arrow(leftm + x, y + node.height() - node.insideMargin() - height,  x, y + node.height() - node.insideMargin() - height);
        }
        customChildren = true;
    } else if(node.shape == Node.shapeLoopEnd) {
        e = [
            <rect key="touch-box" fill="transparent" stroke="transparent" x="0" width={width} height={height}/>,
            <text key="loop-name" stroke="none" x={width/2} y={node.value == "" ? height/2 : height*.7} dominantBaseline="middle" textAnchor="middle">{node.name}</text>,
            <text key="text" stroke="none" x={width/2} y={height*.3} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <path key="box" fill="none"  d={`M0,0 L${width},0 L${width},${height/2} L${width-height/2},${height} L${height/2},${height} L0,${height/2} Z`}/>
        ];
        diocell = DIOCell.createCell(node, {x:x,y:y,width:width,height:height}, DIOCell.styles.loopend, {
            value: node.name + '\n' + node.getValue(),
        });
        arrowsListeners.push({x:x,y:y});
    }

    if(node.type == 'break') {
        e = [
        ];
        let loop = node.findParent(p => p.type == 'loopcondition' || p.type == 'loopbegin');
        if(loop != undefined) {
            if(loop.shape == Node.shapeLoopBegin) {
                let arrowy = y + loop.height() + loop.lastdraw.y - y + loop.contentHeight() + Node.margin.y*1.5;
                let arrowx = loop.lastdraw.x;
                let rarrowx = loop.lastdraw.continuerx + Node.margin.x*2/2;
                arrow(x,y, rarrowx, y);
                arrow(rarrowx,y, rarrowx, arrowy);
                arrow(rarrowx,arrowy, arrowx, arrowy);

                let srcArrow = DIOCell.findArrowTo(node);
                if(srcArrow != undefined) {
                    let nextNode = loop.end.parent.children[loop.end.parent.indexOf(loop.end)+1];
                    if(nextNode != undefined) {
                        let srcNode = srcArrow.getAttribute('source');
                        console.log('nextNode', nextNode);
                        DIOCell.removeArrow(srcArrow);
                        DIOCell.createArrow(srcNode, nextNode, [{x:rarrowx,y:y},{x:rarrowx,y:arrowy}]);
                    }
                }
            } else {
                let arrowy = y + loop.height() + loop.lastdraw.y - y;
                let arrowx = loop.lastdraw.x + loop.lastdraw.continuex;
                let rarrowx = loop.lastdraw.continuerx + Node.margin.x*2/3;
                arrow(x,y, rarrowx, y);
                arrow(rarrowx,y, rarrowx, arrowy);
                arrow(rarrowx,arrowy, x, arrowy);
                // let arrowy = y + loop.height() + loop.lastdraw.y - y;
                // arrow(x,y, x, arrowy);
                // arrow(x,arrowy, loop.lastdraw.x, arrowy);
            }
        }
    }
    if(node.type == 'continue') {
        e = [];
        let loop = node.findParent(p => p.type == 'loopcondition' || p.type == 'loopbegin');
        console.log('skip', loop);
        if(loop != undefined) {
            let skip = loop.skip == undefined ? loop : loop.skip;
            if(loop.shape == Node.shapeLoopBegin) {
                let arrowy = y + loop.height() + loop.lastdraw.y - y + Node.margin.y/2 - (skip==loop.end?0:skip.height()+Node.margin.y*3/2);
                let arrowx = loop.lastdraw.x;
                let rarrowx = loop.lastdraw.continuerx + Node.margin.x/3;
                arrow(x,y, rarrowx, y);
                arrow(rarrowx,y, rarrowx, arrowy);
                arrow(rarrowx,arrowy, arrowx, arrowy);
                arrow(arrowx, arrowy, arrowx, arrowy+Node.margin.y/2);
                
                let fromArrow = DIOCell.findArrowFrom(node);
                console.log('from', fromArrow);
                let srcArrow = DIOCell.findArrowTo(node);
                if(srcArrow != undefined) {
                    let srcNode = srcArrow.getAttribute('source');
                    DIOCell.root.removeChild(srcArrow);
                    DIOCell.createArrow(srcNode, loop.skip, [{x:arrowx+width/2,y:y+Node.margin.y}, {x:rarrowx,y:arrowy+Node.margin.y}]);
                } else {
                    console.warn('arrow not found');
                }
            } else {
                let arrowy = loop.lastdraw.y + loop.lastdraw.continuey;
                let arrowx = loop.lastdraw.x + loop.lastdraw.continuex;
                let rarrowx = loop.lastdraw.continuerx + Node.margin.x/3;
                arrow(x,y, rarrowx, y);
                arrow(rarrowx,y, rarrowx, arrowy);
                arrow(rarrowx,arrowy, arrowx, arrowy);
            }
        }
    }
    if(node.type == 'loopcondition') { // solution
        // let blockHeight = node.height();
        // // translate.y += blockHeight - height;
        // let dx = width + Node.margin.x;
        // let dy = node.height() - height - Node.margin.y;
        // e = [
        //     // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth)}deg 100% 50% / 10%)`} x={0} y={0} width={node.width()} height={node.height()} />,
        //     <text key="text" stroke="none" x={dx+width/2} y={dy + height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
        //     <text key="text-true" stroke="none" x={dx - 2} y={dy + height/2 + 15} dominantBaseline="end" textAnchor="start">да</text>,
        //     <text key="text-false" stroke="none" x={dx+width/2 + 5} y={dy + height + 12} dominantBaseline="end" textAnchor="start">нет</text>,
        //     <path key="box" fill="none"  d={`M${dx+width/2},${dy} L${dx+width},${height/2+dy} L${dx+width/2},${height+dy} L${dx},${height/2+dy} Z`}/>
        // ];
        // node.lastdraw.continuey = height/2+dy;
        // node.lastdraw.continuex = dx+width/2;
        // node.lastdraw.continuerx = x + node.width() - width/2;

        // arrow(x+dx,y+height+dy,x+dx, y + node.height());
        // arrow(x+dx,y+node.height(),x, y + node.height());

        // let cdy = Node.margin.y;

        // arrow(x,y,x+dx, y);
        // arrow(x+dx,y,x+dx, y+cdy);

        // // yes arrow
        // arrow(x,y+height/2+dy,x, y);
        // arrow(x+dx-width/2, y+height/2+dy, x,y+height/2+dy);

        // let leftm = dx;

        // let arrowFromY = null;
        // for (let child of node.children) {
        //     if(arrowFromY != null) arrow(leftm + x, arrowFromY, leftm + x, y + cdy);
        //     drawNode(child, leftm + x, y + cdy);
        //     arrowFromY = child.arrowOutY() + y + cdy;
        //     if(child.arrowCustom()) arrowFromY = null;
        //     cdy += child.height();
        //     cdy += child.marginY();
        // }
        // if(arrowFromY != null) {
        //     arrow(leftm + x, arrowFromY, leftm + x, y + node.height() - node.insideMargin() - height);
        // }
        // customChildren = true;
        // if(node.comment != undefined) {
        //     let cx1 = dx + width*3/4;
        //     let cy1 = dy + height/4;
        //     let cx2 = dx + width+Node.commentmargin.x;
        //     let cy2 = dy;
        //     let cheight = node.commentHeight();
        //     eComment = [
        //         <text key="comment" stroke="none" x={cx2+10} y={cy2} dominantBaseline="middle" textAnchor="start">{node.comment}</text>,
        //         <line key="comment-box-dash"  x1={cx1} y1={cy1} x2={cx2} y2={cy2} strokeDasharray="4"/>,
        //         <path key="comment-box" fill="none"  d={`M${cx2+config.commentpadding},${cy2-cheight/2} L${cx2},${cy2-cheight/2} L${cx2},${cy2+cheight/2} L${cx2+config.commentpadding},${
        //            cy2+cheight/2}`}/>
        //     ];
        // }
    } else if(node.type == 'condition') { // solution
        let leftm = node.rightWidth()/2 + Node.margin.x -width/2 + Math.max(node.leftWidth(), node.contentWidth());

        let topArrowY = y+height/2 - (isNaN(node.delta[1]) ? 0 : node.delta[1]);

        e = [
            <rect key="touch-box" fill="transparent" stroke="transparent" x="0" width={width} height={height}/>,
            // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth)}deg 100% 50% / 10%)`} x="0" y="0" width={node.width()} height={node.height()} />,
            // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 120}deg 100% 50% / 10%)`} x="0" y="0" width={node.maxContentWidth()} height={node.height()} />,
            // <rect key="rect-l" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 240}deg 100% 50% / 10%)`} x={leftm} y="0" width={node.leftWidth()} height={node.height()} />,
            // <rect key="rect-l" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 90}deg 100% 50% / 10%)`} x={0} y="0" width={node.leftWidth()} height={node.height()} />,
            // <rect key="rect-c" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 180}deg 100% 50% / 10%)`} x={0} y="0" width={node.contentWidth()} height={node.height()} />,
            // <rect key="rect-r" fill="none" stroke="#77777700" stroke={`hsl(${(node.deepth)*360/(config.maxDeepth) + 270}deg 100% 50% / 90%)`} x={node.width()-node.rightWidth()} y="0" width={node.rightWidth()} height={node.height()-10} />,
            <path key="box" fill="none"  d={`M${width/2},0 L${width},${height/2} L${width/2},${height} L0,${height/2} Z`}/>,
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <text key="text-true" stroke="none" x={width + 2} y={height/2 + 15} dominantBaseline="end" textAnchor="end">да</text>,
            <text key="text-false" stroke="none" x={width/2 + 5} y={height + 12} dominantBaseline="end" textAnchor="start">нет</text>
        ];

        diocell = DIOCell.createCell(node, {x:x,y:y,width:width,height:height}, DIOCell.styles.condition);

        // DIOCell.root.append(DIOCell.createText());

        createArrowMover(node, {x:x+leftm,y:y+height/2,width:0,height:0});

            // arrowsListeners.push();

        arrowsListeners.push({x:x+width/2,y:y+height/2});
        // arrowsListeners.push({x:x+leftm,y:topArrowY});
        arrow(x+width/2,y+height/2,x+leftm,topArrowY);
        if(node.thenTrue.length==0) {
            arrow(x+leftm,y+height/2,x+leftm,y + node.height());
        } else {
            arrow(x+leftm,y+height/2,x+leftm,y + height + node.insideMargin());
            // arrowsListeners.push({x:x+leftm,y:y+height/2});
        }
        if(node.thenFalse == undefined || node.thenFalse.length == 0) {
            arrow(x,y+height,x,y + node.height());
            arrowsListeners.push({x:x,y:y+height});
        } else {
            arrow(x,y+height,x,y + height + node.insideMargin());
            arrowsListeners.push({x:x,y:y+height});
        }
        y += height + node.insideMargin();
        let dy = 0;
        let arrowFromY = null;
        let lastChild = node;
        let $callback = null;
        let lastCallback = null;
        for (let child of node.thenTrue) {
            if(arrowFromY != null) {
                arrow(leftm + x, arrowFromY, leftm + x, y + dy);
            }
            $callback = drawNode(child, leftm + x, y + dy, [{x:leftm+x, y:y + dy}]);
            if(lastChild == node) {
                DIOCell.createArrow(node, child, undefined, "да");
            } else {
                if(!DIOCell.makePrevArrows(child, lastChild, lastCallback)) {
                    DIOCell.createArrow(lastChild, child);
                }
                // if(lastChild != null && lastChild.type == 'condition') {
                //     if(lastCallback.dio != undefined) {
                //         DIOCell.createArrow(lastChild.thenTrue[lastChild.thenTrue.length-1], child, [lastCallback.dio.thenTrueOut]);
                //     }
                //     if(lastChild.thenFalse == undefined) {
                //         DIOCell.createArrow(lastChild, child, undefined, "нет");
                //     } else {
                //         DIOCell.createArrow(lastChild.thenFalse[lastChild.thenFalse.length-1], child);
                //     }
                // } else if(lastChild != null && lastChild.shape == Node.shapeLoopBegin) {
                //     DIOCell.createArrow(lastChild.children[lastChild.children.length-1], child);
                // } else {
                //     DIOCell.createArrow(lastChild, child);
                // }
            }
            arrowFromY = child.arrowOutY() + y + dy;
            lastChild = child;
            if(child.arrowCustom()) arrowFromY = null;
            if(!child.hasOutArrow()) break;
            dy += child.height();
            dy += child.marginY();
        }

        if(arrowFromY != null) {
            arrow(leftm + x, arrowFromY, leftm + x, y + node.height() - node.insideMargin() - height);
            arrow(leftm + x, y + node.height() - node.insideMargin() - height,  x, y + node.height() - node.insideMargin() - height);
            createArrowMover(node, {x: x+leftm, y: y + node.height() - node.insideMargin() - height,width:0,height:0});
            callback.dio = {thenTrueOut:{x:leftm + x + width/2,y:arrowFromY}};
            console.log('set callback', callback);
        }
        createArrowMover(node, {x: x, y: y + node.height() - node.insideMargin() - height,width:0,height:0});

        if(node.thenFalse != undefined) {
            arrowFromY = null;
            dy = 0;
            $callback = null;
            lastCallback = null;
            for (let child of node.thenFalse) {
                if(arrowFromY != null) {
                    arrow(x, arrowFromY, x, y + dy);
                }
                $callback = drawNode(child, x, y + dy, [{x:x,y:y}]);
                if(lastChild == node) {
                    DIOCell.createArrow(node, child, undefined, "нет");
                } else {
                    if(lastChild != null && lastChild.type == 'condition') {
                        if(lastCallback == null) console.warn("lastCallback is null");
                        else {
                            if(lastCallback.dio != undefined) {
                                DIOCell.createArrow(lastChild.thenTrue[lastChild.thenTrue.length-1], child, [lastCallback.dio.thenTrueOut]);
                            }
                            if(lastChild.thenFalse == undefined) {
                                DIOCell.createArrow(lastChild, child, undefined, "нет");
                            } else {
                                DIOCell.createArrow(lastChild.thenFalse[lastChild.thenFalse.length-1], child);
                            }
                        }
                    } else if(lastChild != null && lastChild.shape == Node.shapeLoopBegin) {
                        DIOCell.createArrow(lastChild.children[lastChild.children.length-1], child);
                    } else {
                        DIOCell.createArrow(lastChild, child);
                    }
                }
                arrowFromY = child.arrowOutY() + y + dy;
                lastCallback = $callback;
                lastChild = child;
                if(child.arrowCustom()) arrowFromY = null;
                dy += child.height();
                dy += child.marginY();
            }
            if(arrowFromY != null) {
                arrow(x, arrowFromY, x, y + node.height() - node.insideMargin() - height);
            }
        }
        customChildren = true;
        // console.log('node', node);
        if(node.comment != undefined) {
            let cx1 = 0 + width*3/4;
            let cy1 = 0 + height/4;
            let cx2 = 0 + width+config.commentmargin;
            let cy2 = 0;
            let cheight = node.commentHeight();
            eComment = [
                <text key="comment" stroke="none" x={cx2+10} y={cy2} dominantBaseline="middle" textAnchor="start">{node.comment}</text>,
                <line key="comment-box-dash"  x1={cx1} y1={cy1} x2={cx2} y2={cy2} strokeDasharray="4"/>,
                <path key="comment-box" fill="none"  d={`M${cx2+config.commentpadding},${cy2-cheight/2} L${cx2},${cy2-cheight/2} L${cx2},${cy2+cheight/2} L${cx2+config.commentpadding},${
                   cy2+cheight/2}`}/>
            ];
            dioComment = () => DIOCell.createComment(node, {x:x+cx2,y:y-cy1-height-cheight,width:10,height:cheight});
        }
    }

    if(node.type == 'programm') {
        let arrowFromY = null;
        console.log('arrowFromY', arrowFromY);
        for (var i = node.children.length-1; i >= 0; i--) {
            let child = node.children[i];
            if(arrowFromY != null && node.type != 'programm') {
                arrow(x, arrowFromY, x, y);
            }
            drawNode(child, x, y);
            arrowFromY = child.arrowOutY() + y;
            if(child.arrowCustom()) arrowFromY = null;
            x += child.marginX();
            x += Math.max(0, child.maxCommentWidth() - child.width()/2);
            // y += child.height();
            x += child.width();
            x += Node.margin.x;
            if(!child.hasOutArrow()) break;
        }
        customChildren = true;
    } 

    zone.maxX = Math.max(zone.maxX, translate.x + maxX + Node.margin.x + (node.comment == undefined ? 0 : node.commentWidth()));//x+width/2);
    zone.minX = Math.min(zone.minX, translate.x);
    zone.maxY = Math.max(zone.maxY, translate.y+height);//y+height);
    zone.minY = Math.min(zone.minY, translate.y);//y);
    
    if(node.comment != undefined) {
        if(eComment == null) {
            let height = node.contentHeight();
            let commentw = node.commentWidth();
            let cbox = {x:width+Node.commentmargin.x-10,y:0,width:commentw,height:height};
            eComment = [
                <SVGNode key={`svg-node-block-comment-` + eBlocks.length} id={"#" + eBlocks.length} node={node} transform={{x:0,y:0}} scheme={{config:config}} box={cbox} elements={(delta) => {
                let commentsx = width;
                if(node.shape == Node.shapeData) commentsx -= height/2;
                let commentx = cbox.x;
                let commentsy = -delta[1];

                commentsx -= delta[0];
                
                return [
                <rect key="touch-box" fill="transparent" stroke="transparent" x={commentx} width={commentw} height={height}/>,
                <text key="comment" stroke="none" x={commentx+10} y={height/2} dominantBaseline="middle" textAnchor="start">{node.comment}</text>,
                <line key="comment-box-dash"  x1={commentsx} y1={height/2+commentsy} x2={commentx} y2={height/2} strokeDasharray="4"/>,
                <path key="comment-box" fill="none"  d={`M${commentx},${height/2} L${commentx},${height/2} L${commentx},0 L${commentx+config.commentpadding},0 L${commentx},0 L${
                    commentx},${height} L${commentx+config.commentpadding} ${height}`}/>
                ]}}/>,
            ];
            dioComment = () => DIOCell.createComment(node, {x:x+width+Node.commentmargin.x-10,y:y,width:10,height:height});
        }
        if(eComment != null) {
            for (let ec of eComment) {
                e.push(ec);  
            }
        }
    }
    arrowsListeners.push({x:x,y:y+height});


    if(e != null) {
        // e.push(<rect key="debug-box" fill={node.shape == Node.shapeHidden ? "none" : "transparent"} stroke="none" stroke={`hsl(${(node.deepth)*360/(config.maxDeepth)}deg 100% 50% / 10%)`} x="0" y="0" width={node.width()} height={node.height()} />);
        eBlocks.push(
            // <g key={`block-group-` + eBlocks.length} transform={` translate(${translate.x} ${translate.y})`} stroke={`hsl(${(node.deepth-1)*360/(config.maxDeepth)}deg 100% 80%)`}>{
            <SVGNode key={`svg-node-block-` + eBlocks.length} id={eBlocks.length} node={node} transform={{x:translate.x,y:translate.y}} scheme={{config:config}} box={box} elements={delta => {
                // console.log(arrowsListeners);
                for (let a of arrowsListeners) {
                    let listeners = EditorState.pointListeners[getArrowKey(a.x,a.y)];
                    if(listeners != undefined) {
                        for (let listener of Object.values(listeners)) {
                            if(listener == undefined) continue;
                            listener(delta);
                        }
                    }
                }
                return [e];
            }}/>
            // }</g>
        );
    }


    if(!customChildren) {
        let arrowFromY = null;
        let lastChild = null;
        let lastCallback = null;
        for (var i = 0; i < node.children.length; i++) {
            let child = node.children[i];
            let $callback = null;
            if(arrowFromY != null && node.type != 'programm') {
                arrow(x, arrowFromY, x, y);
                $callback = drawNode(child, x, y, [{x:x,y:y}]);
                // console.log(child.type, '$callback', child, lastCallback, lastChild);
            } else {
                console.log('#', child.type, lastChild);
                $callback = drawNode(child, x, y);
            }
            arrowFromY = child.arrowOutY() + y;
            
            if(lastChild != null) {
                if(!DIOCell.makePrevArrows(child, lastChild, lastCallback)) {
                    DIOCell.createArrow(lastChild, child);
                }
            }
            // if(lastChild != null) {
            //     if(lastChild.type == 'condition') {
            //         if(lastCallback.dio != undefined) {
            //             DIOCell.createArrow(lastChild.thenTrue[lastChild.thenTrue.length-1], child, [lastCallback.dio.thenTrueOut]);
            //         }
            //         if(lastChild.thenFalse == undefined) {
            //             DIOCell.createArrow(lastChild, child, undefined, "нет");
            //         } else {
            //             DIOCell.createArrow(lastChild.thenFalse[lastChild.thenFalse.length-1], child);
            //         }
            //     } else if(lastChild.shape == Node.shapeLoopBegin) {
            //         DIOCell.createArrow(lastChild.children[lastChild.children.length-1], child);
            //     } else {
            //         DIOCell.createArrow(lastChild, child);
            //     }
            // }

            lastChild = child;
            lastCallback = $callback;
            if(child.arrowCustom()) arrowFromY = null;
            y += child.marginY();
            y += child.height();
            if(!child.hasOutArrow()) break;
        }
        // arrowsListeners.push({x:x,y:arrowFromY});
    }

    if(diocell != null) {
        DIOCell.root.append(diocell);
    }

    dioComment();

    node.callback = callback;

    return callback;
}

function arrow(x1, y1, x2, y2) {
    if(isNaN(y2)) {
        console.error('y2 is Nan', x2,y2);
    }
    // if((x2-x1 == 0)) { 
        // y2 += (y2 > y1) ? -3 : 3;
    // }
    // if((y2-y1 == 0)) {
        // x2 += (x2 > x1) ? -3 : 3;
    // }
    // let key = arrows.length;
    // arrow[`${x1}_${y1}`];
    let from = getArrowNode(x1,y1);
    let to = getArrowNode(x2,y2);

    from.set = true;

    if(from.target != undefined) console.warn("Arrow alrady has tagets", from);
    from.target = {x:x2,y:y2};
    // if(from.targets == undefined) from.targets = [];

    if(to.froms == undefined) to.froms = [];
    to.froms.push(from);
    if(to.froms.length >= 2) {
        for (let f of to.froms) {
            f.head = true;
        }
    }
    
    // arrows.push(<path key={key} d={`M${x1} ${y1} L ${x2} ${y2}`} markerEnd='url(#arrow-head)'></path>);
}

function getArrowNode(x, y) {
    if(arrows[getArrowKey(x,y)] == undefined) arrows[getArrowKey(x,y)] = {x:x,y:y,head:false};
    return arrows[getArrowKey(x,y)];
}

function getArrowKey(x, y) {
    return `${x}_${y}`;
}

function createArrowMover(node, box) {
    eBlocks.push(
        <SVGNode key={`arrow-mover-${eBlocks.length}`} id={"#AM#" + eBlocks.length} node={node} transform={{x:0,y:0}} scheme={{config:config}} box={box} elements={(delta) => {
            let a = {x:box.x,y:box.y};
            let listeners = EditorState.pointListeners[getArrowKey(a.x, a.y)];
            if(listeners != undefined) {
                for (let listener of Object.values(listeners)) {
                    if(listener == undefined) continue;
                    listener(delta);
                }
            }
        return [
        <rect className="arrow-mover" key={`touch-box-${eBlocks.length}`} fill="transparent" stroke="transparent" x={box.x-5} y={box.y-5} width={10} height={10}/>,
    ]}}/>
    );
}