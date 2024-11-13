
import React, {useState, useEffect, useRef } from 'react'
import Block from "../../../libs/block";
import Node from "../../../libs/lexer/node";


export default function Scheme() {
    const char = useRef();
	
    useEffect(() => {
    	let c = char.current;
		Block.char.width = c.getBBox().width;
		Block.char.height = c.getBBox().height;

		Node.char.width = c.getBBox().width;
		Node.char.height = c.getBBox().height;
    });
    return <text key="text" stroke="none" dominantBaseline="middle" textAnchor="middle" ref={char}>.</text>;
	// return <div className="char scheme-font" ref={char}>A</div>;
}