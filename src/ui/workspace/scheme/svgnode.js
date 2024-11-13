
import React, {useState, useEffect, useRef } from 'react'
import EditorState from "../../../vars";
import Node from "../../../libs/lexer/node";
import Char from "./char";

const style = {
    boxPoint: {
        size: 10,
        color: "#0094FF",
        border: "var(--content-background)",
    }
};
let $globalActiveElement = undefined;

export default function SVGNode(props) {
    const [repaints, setRepaints] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [move, setMove] = useState([0,0]);

    const [mouse, setMouse] = useState(false);

    let node = props.node;
    let transform = props.transform;
    let elements = props.elements;
    let config = props.scheme.config;
    let box = props.box;
    if(box.width == undefined) box.width = 0;
    if(box.height == undefined) box.height = 0;
    let key = props.id;

    let color = (node == undefined || node == null) ? '#0f0' : `hsl(${(node.deepth-1)*360/(config.maxDeepth)}deg 100% 80%)`;
    let eOverlay = [];

    const canvas = useRef();

    const boxPoint = (k, x,y, cn="") => {
        return <rect 
        key={`box-point-${key}-${k}`} 
        className={"box-point" + cn}
        onMouseEnter={() => setRepaints(r => repaints+1)} onMouseLeave={() => setRepaints(r => repaints+1)}
        stroke="#fff" strokeWidth="2" rx="0" fill="#0094FF" id={`box-point-${key}-${k}`}
        x={x + style.boxPoint.size/-2} y={y+style.boxPoint.size/-2} width={style.boxPoint.size} height={style.boxPoint.size}/>
    };
    useEffect(() => {
        let delta = {x:0,y:0};
        let onmousedown = e => {
            if(!(e.srcElement.id + "").startsWith(`box-point-${key}-`)) return;
            setMouse(mouse => [e.clientX, e.clientY]);
            $globalActiveElement = key;
        };
        let onmouseup = e => {
            setMouse(mouse => false);
            $globalActiveElement = undefined;
        };
        let onmousemove = e => {
            if(mouse != false) {
                let dx = (mouse[0] - e.clientX)*EditorState.scale;
                let dy = (mouse[1] - e.clientY)*EditorState.scale;
                if(e.shiftKey) dy = 0;
                if(e.ctrlKey) dx = 0;
                const delta = [dx,dy];
                if(node != undefined) node.deltaConsumer.x += dx;// = {x:move[0],y:move[1]};
                if(node != undefined) node.deltaConsumer.x += dy;// = {x:move[0],y:move[1]};
                setMouse(mouse => [e.clientX, e.clientY]);
                setMove(move => {
                    return [move[0]-delta[0],move[1]-delta[1]];
                });
                if (window.getSelection) {window.getSelection().removeAllRanges();}
                else if (document.selection) {document.selection.empty();}
            }
        };
        window.addEventListener('mousedown', onmousedown);
        window.addEventListener('mousemove', onmousemove);
        window.addEventListener('mouseup', onmouseup);
        return () => {
            window.removeEventListener('mousedown', onmousedown);
            window.removeEventListener('mousemove', onmousemove);
            window.removeEventListener('mouseup', onmouseup);
        };
    }, [move, mouse]);

    // repaints, move, mouse

    if((hovered || mouse != false) && ($globalActiveElement == key || $globalActiveElement == undefined)) {
        // console.log(box);
        let left = box.x;
        let right = box.x + box.width;
        let top = box.y;
        let bottom = box.y + box.height;
        if(box.width == 0 && box.height == 0) {
            eOverlay.push(<g key={`overlay-group-${key}`}>
                {boxPoint(0,left, top, ' round')}
            </g>);
        } else {
            eOverlay.push(<g key={`overlay-group-${key}`}>
                {boxPoint(0,left, top)}
                {boxPoint(1,right,top)}
                {boxPoint(2,left, bottom)}
                {boxPoint(3,right,bottom)}
                {/*<rect key="box" stroke="#fff" strokeWidth="2" rx="0" fill={style.boxPoint.color}  x={left + style.boxPoint.size/-2} y={top+style.boxPoint.size/-2} width={style.boxPoint.size} height={style.boxPoint.size}/>*/}
                {/*<rect key="box" stroke="#fff" strokeWidth="2" rx="0" fill={style.boxPoint.color}  x={right + style.boxPoint.size/-2} y={top+style.boxPoint.size/-2} width={style.boxPoint.size} height={style.boxPoint.size}/>*/}
                {/*<rect key="box" stroke="#fff" strokeWidth="2" rx="0" fill={style.boxPoint.color}  x={left + style.boxPoint.size/-2} y={bottom+style.boxPoint.size/-2} width={style.boxPoint.size} height={style.boxPoint.size}/>*/}
                {/*<rect key="box" stroke="#fff" strokeWidth="2" rx="0" fill={style.boxPoint.color}  x={right + style.boxPoint.size/-2} y={bottom+style.boxPoint.size/-2} width={style.boxPoint.size} height={style.boxPoint.size}/>*/}
            </g>);
        }
    }

    if(node != undefined) node.delta = {x:move[0],y:move[1]};

    return  <g onMouseEnter={() => {
        console.log('SVGNode hovered', key);
        setHovered(hovered => true);
    }} onMouseLeave={() => {
        console.log('SVGNode unhovered', key);
         setHovered(hovered => false);
    }}
                transform={` translate(${transform.x + move[0]} ${transform.y + move[1]})`} stroke={color}>
                {typeof(elements) == 'function' ? elements(move) : elements}
                {eOverlay}
            </g>
}


