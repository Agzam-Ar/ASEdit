
import React, {useState, useEffect, useRef } from 'react'
import EditorState from "../../../vars";
import SVGNode from "./svgnode";

export default function SVGArrow(props) {
	let start = props.start;
	let end = props.end;

    const [delta1, setDelta1] = useState([0,0]);
    const [delta2, setDelta2] = useState([0,0]);

    const [segments, setSegments] = useState([]);
	
    const ref = useRef();

	let d = props.d;
	let head = props.head;
	let key = props.id;

	let key1 = getArrowKey(start.x, start.y);
	let key2 = getArrowKey(end.x, end.y);

    useEffect(() => {
		// console.log(`arrow`, key, key1, key2);
		if(EditorState.pointListeners[key1] == undefined) EditorState.pointListeners[key1] = {};
		if(EditorState.pointListeners[key2] == undefined) EditorState.pointListeners[key2] = {};
		EditorState.pointListeners[key1][key] = delta => {
			// console.log('start delta', delta);
			// setDelta1(d => [delta1[0]+delta[0],delta1[1]+delta[1]]);
			setDelta1(d => [delta[0],delta[1]]);
		};
		EditorState.pointListeners[key2][key] = delta => {
			// setDelta2(d => [delta2[0]+delta[0],delta2[1]+delta[1]]);
			setDelta2(d => [delta[0],delta[1]]);
		};
		return () => {
			EditorState.pointListeners[key1][key] = undefined;
			EditorState.pointListeners[key2][key] = undefined;
		};
    });

    let dx2 = 0;
    let dy2 = 0;

    let x1 = (start.x);
    let y1 = (start.y);
    let x2 = (end.x);
    let y2 = (end.y);
	// console.log('end delta', delta2);


    if(head) {
    	// TODO: direction can be changed by user
        let delta = (1 | EditorState.prefs.strokeWidth) / 2;
        let hdelta = 3.5 | EditorState.prefs.strokeWidth;
        if((x1-x2 == 0)) dy2 += (y2 > y1) ? -hdelta : hdelta;
        if((y1-y2 == 0)) dx2 += (x2 > x1) ? -hdelta : hdelta;
    }

    // TODO
	let minX = Math.min(start.x, end.x);
	let minY = Math.min(start.y, end.y);

    d = `M${start.x + delta1[0]} ${start.y + delta1[1]}`;
    let eSegments = [];
	for (let seg of segments) {
    	d += ` L ${seg.x + seg.dx} ${seg.y + seg.dy}`;
		minX = Math.min(minX, seg.x + seg.dx);
		minY = Math.min(minY, seg.y + seg.dy);

    	const segId = eSegments.length;
    	eSegments.push(
			<g key={`arrow-${key}-segment-${eSegments.length}`}><SVGNode id={`arrow-${key}-segment-${eSegments.length}`} node={undefined} transform={{x:0,y:0}} 
				scheme={{config:null}} box={{x:seg.x,y:seg.y,width:0,height:0}} elements={(delta) => {
               
                if(segments[segId].dx != delta[0] || segments[segId].dy != delta[1]) {
					segments[segId].dx = delta[0];
					segments[segId].dy = delta[1];
					setSegments([...segments]);
                }
                // ref.current.setAttribute("d", createPath(start, segments, end, delta1, delta2));

                return [
                	<rect key="touch-box" fill="transparent" stroke="transparent" x={seg.x-5} y={seg.y-5} width={10} height={10}/>,
        			<rect key="mover-box" className="arrow-mover" fill="transparent" stroke="transparent" x={seg.x-5} y={seg.y-5} width={10} height={10}/>
                ]
            }}/>
            </g>
    	);
	}
    d += ` L ${end.x + delta2[0] + dx2} ${end.y + delta2[1] + dy2}`;

    if(d.indexOf('NaN') != -1) {
    	console.log('d is', d, start, end);
    }

    // d = createPath(start, segments, end, delta1, delta2);

	// TODO: bg arrow
	return  <g>
				<path d={`${d}`} ref={ref} markerEnd={head ? `url(#arrow-head)` : ""} onMouseDown={e => {
					let crect = ref.current.getClientRects()[0];
					let mx = (e.clientX-crect.x)*EditorState.scale + minX;
					let my = (e.clientY-crect.y)*EditorState.scale + minY;
					const index = segments.length;

					// TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
					// TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
					// TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
					// TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
					// TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
					// TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO

					// TODO: add segments not to the end (shift other segments position after inserting element)
					setSegments([...segments, {x: mx,y:my,dx:0,dy:0}]);
				}}></path>
				{eSegments}
		   	</g>;
	
}

// function createPath(start, segments, end, delta1, delta2) {
//     let dx2 = 0;
//     let dy2 = 0;
//     let d = `M${start.x + delta1[0]} ${start.y + delta1[1]}`;
// 	for (let seg of segments) {
//     	d += ` L ${seg.x + seg.dx} ${seg.y + seg.dy}`;
//     }
//     d += ` L ${end.x + delta2[0] + dx2} ${end.y + delta2[1] + dy2}`;
//     return d;
// }

function getArrowKey(x, y) {
    return `${x}_${y}`;
}