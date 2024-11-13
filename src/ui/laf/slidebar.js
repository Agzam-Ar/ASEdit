import "./slidebar.css"
import React, {useState, useEffect, useRef } from 'react'


export default function Slidebar(props) {
    const ref = useRef();

    for (var i = 0; i < props.values.length; i++) {
    	props.values[i] += "";
    }
	
	let values = props.values;
    const [selected, setSelected] = useState(values.indexOf(props.value));

	let buttons = [];
	
	for (var i = 0; i < values.length; i++) {
		const s = i;
		buttons.push(
			<div key={i} className="slidebar-button-box" style={{width: `${100/values.length}%`}}>
				<div className={"slidebar-button" + (selected == i ? " selected" : "")} onClick={e => setSelected(selected => {props.onSelect(values[s]);return s;})}>{values[i]}</div>
			</div>);
	}

	return 	<div className="slidebar-box" ref={ref} style={{maxWidth: `${7*values.length}em`}}>{buttons}</div>


    // const ref = useRef();
    // const slider = useRef();

	// useEffect(() => {
	// 	let mouse = {
			
	// 	};
	// 	let down = e => {
	// 		if(e.target == ref.current) {
	// 			//  + ref.current.getClientRects()[0].left
	// 			slider.current.style.left = `${e.screenX - ref.current.offsetLeft}px`;
	// 			// console.log(e.target);
	// 		}
	// 	};
	// 	let move = e => {
	// 		if(e.buttons <= 0) return;
	// 		if(e.target == ref.current) {
	// 			slider.current.style.left = `${e.screenX - ref.current.offsetLeft}px`;
	// 			// console.log(e);
	// 		}
	// 	};

    // 	window.addEventListener('mousedown', down);
    // 	window.addEventListener('mousemove', move);

	// 	return () => {
    // 		window.removeEventListener('mousedown', down);
    // 		window.removeEventListener('mousemove', move);
	// 	};
	// });


	// return 	<div className="slidebar-box" ref={ref}>
	// 			<div className="slidebar"></div>
	// 			<div className="slider" ref={slider}></div>
	// 			{/*Slidebar :D <div>Weh</div>*/}
	// 		</div>
}