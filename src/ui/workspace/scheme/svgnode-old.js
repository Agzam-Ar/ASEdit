
import React, {useState, useEffect, useRef } from 'react'
import EditorState from "../../../vars";
import Node from "../../../libs/lexer/node";
import Char from "./char";


export default function SVGNode(props) {
	let config = props.scheme.config;
	let zone = props.scheme.zone;
	let node = props.node;
	let x = props.x;
	let y = props.y;

    let e = null;
    let eComment = null;
    let customChildren = false;
    let childrenNodes = [];

    let maxX = Math.max(node.width(), node.width()/2 + node.commentWidth() - Node.commentmargin.x);
	

    let width = EditorState.prefs.$get("sameWidth") ? config.basewidth : node.contentWidth();
    let height = node.contentHeight();

    let translate = {x:x - width/2,y:y - height/2};
    node.lastdraw = {x:x,y:y};

	let drawNode = (node, x, y) => {
		childrenNodes.push({node:node,x:x,y:y});
	}

	if(node.shape == Node.shapeHidden) {
        e = [
            // <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.type}</text>,
            // <rect key="box" fill="none" stroke="#77777700" fill="#ff000011" x="0" y={0} width={node.width()} height={node.height()} />
        ];
        translate.y = y;
    } else if(node.shape == Node.shapeProcess) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <rect key="box" fill="none"  x="0" width={width} height={height} />
        ];
    } else if(node.shape == Node.shapeFunction) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <rect key="box" fill="none"  x="0" width={width} height={height} />,
            <rect key="box-2" fill="none"  x={height/3} width={width-height*2/3} height={height} />
        ];
    } else if(node.shape == Node.shapeTerminator) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <rect key="box" fill="none"  x="0" width={width} height={height} ry={height/2} />
        ];
    } else if(node.shape == Node.shapeData) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <path key="box" fill="none"  d={`M${height},0 L${width},0 L${width-height},${height} L0,${height} Z`}/>
        ];
    } else if(node.shape == Node.shapeData) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <path key="box" fill="none"  d={`M${height},0 L${width},0 L${width-height},${height} L0,${height} Z`}/>
        ];
    } else if(node.shape == Node.shapeLoopBegin) {
        e = [
            // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth)}deg 100% 50% / 10%)`} x="0" y="0" width={node.width()} height={node.height()} />,
            <text key="loop-name" stroke="none" x={width/2} y={height*.3} dominantBaseline="middle" textAnchor="middle">{node.name}</text>,
            <text key="text" stroke="none" x={width/2} y={node.value == "" ? height/2 : height*.7} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <path key="box" fill="none"  d={`M${height/2},0 L${width-height/2},0 L${width},${height/2} L${width},${height} L0,${height} L0,${height/2} Z`}/>
        ];

        let dx = width + Node.margin.x;
        let dy = node.height() - height - Node.margin.y;

        node.lastdraw.continuey = height/2+dy;
        node.lastdraw.continuex = dx+width/2;
        node.lastdraw.continuerx = x + node.width() - width/2;

        let cdy = height + Node.margin.y;

        let leftm = 0;

        arrow(x,y+height,x, y + cdy);

        let arrowFromY = null;
        for (let child of node.children) {
            if(arrowFromY != null) arrow(leftm + x, arrowFromY, leftm + x, y + cdy);
            drawNode(child, leftm + x, y + cdy);
            arrowFromY = child.arrowOutY() + y + cdy;
            if(child.arrowCustom()) arrowFromY = null;
            cdy += child.height();
            cdy += child.marginY();
        }
        if(arrowFromY != null) {
            arrow(x, arrowFromY, x, y + node.height() + Node.margin.y);
            // arrow(leftm + x, y + node.height() - node.insideMargin() - height,  x, y + node.height() - node.insideMargin() - height);
        }
        customChildren = true;

    } else if(node.shape == Node.shapeLoopEnd) {
        e = [
            <text key="loop-name" stroke="none" x={width/2} y={node.value == "" ? height/2 : height*.7} dominantBaseline="middle" textAnchor="middle">{node.name}</text>,
            <text key="text" stroke="none" x={width/2} y={height*.3} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <path key="box" fill="none"  d={`M0,0 L${width},0 L${width},${height/2} L${width-height/2},${height} L${height/2},${height} L0,${height/2} Z`}/>
        ];
    }

    if(node.type == 'break') {
        e = [];
        let loop = node.findParent(p => p.type == 'loopcondition' || p.type == 'loopbegin');
        if(loop != undefined) {
            if(loop.shape == Node.shapeLoopBegin) {
                let arrowy = y + loop.height() + loop.lastdraw.y - y + loop.contentHeight() + Node.margin.y*1.5;
                let arrowx = loop.lastdraw.x;
                let rarrowx = loop.lastdraw.continuerx + Node.margin.x*2/2;
                arrow(x,y, rarrowx, y);
                arrow(rarrowx,y, rarrowx, arrowy);
                arrow(rarrowx,arrowy, arrowx, arrowy);
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
        if(loop != undefined) {
            if(loop.shape == Node.shapeLoopBegin) {
                let arrowy = y + loop.height() + loop.lastdraw.y - y + Node.margin.y/2;
                let arrowx = loop.lastdraw.x;
                let rarrowx = loop.lastdraw.continuerx + Node.margin.x/3;
                arrow(x,y, rarrowx, y);
                arrow(rarrowx,y, rarrowx, arrowy);
                arrow(rarrowx,arrowy, arrowx, arrowy);
                arrow(arrowx, arrowy, arrowx, arrowy+Node.margin.y/2);
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
        let blockHeight = node.height();
        // translate.y += blockHeight - height;
        let dx = width + Node.margin.x;
        let dy = node.height() - height - Node.margin.y;
        e = [
            // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth)}deg 100% 50% / 10%)`} x={0} y={0} width={node.width()} height={node.height()} />,
            <text key="text" stroke="none" x={dx+width/2} y={dy + height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <text key="text-true" stroke="none" x={dx - 2} y={dy + height/2 + 15} dominantBaseline="end" textAnchor="start">да</text>,
            <text key="text-false" stroke="none" x={dx+width/2 + 5} y={dy + height + 12} dominantBaseline="end" textAnchor="start">нет</text>,
            <path key="box" fill="none"  d={`M${dx+width/2},${dy} L${dx+width},${height/2+dy} L${dx+width/2},${height+dy} L${dx},${height/2+dy} Z`}/>
        ];
        node.lastdraw.continuey = height/2+dy;
        node.lastdraw.continuex = dx+width/2;
        node.lastdraw.continuerx = x + node.width() - width/2;
        arrow(x+dx,y+height+dy,x+dx, y + node.height());
        arrow(x+dx,y+node.height(),x, y + node.height());

        let cdy = Node.margin.y;

        arrow(x,y,x+dx, y);
        arrow(x+dx,y,x+dx, y+cdy);

        // yes arrow
        arrow(x,y+height/2+dy,x, y);
        arrow(x+dx-width/2, y+height/2+dy, x,y+height/2+dy);

        let leftm = dx;

        let arrowFromY = null;
        for (let child of node.children) {
            if(arrowFromY != null) arrow(leftm + x, arrowFromY, leftm + x, y + cdy);
            drawNode(child, leftm + x, y + cdy);
            arrowFromY = child.arrowOutY() + y + cdy;
            if(child.arrowCustom()) arrowFromY = null;
            cdy += child.height();
            cdy += child.marginY();
        }
        if(arrowFromY != null) {
            arrow(leftm + x, arrowFromY, leftm + x, y + node.height() - node.insideMargin() - height);
            // arrow(leftm + x, y + node.height() - node.insideMargin() - height,  x, y + node.height() - node.insideMargin() - height);
        }
        customChildren = true;
        if(node.comment != undefined) {
            let cx1 = dx + width*3/4;
            let cy1 = dy + height/4;
            let cx2 = dx + width+Node.commentmargin.x;
            let cy2 = dy;
            let cheight = node.commentHeight();
            eComment = [
                <text key="comment" stroke="none" x={cx2+10} y={cy2} dominantBaseline="middle" textAnchor="start">{node.comment}</text>,
                <line key="comment-box-dash"  x1={cx1} y1={cy1} x2={cx2} y2={cy2} strokeDasharray="4"/>,
                <path key="comment-box" fill="none"  d={`M${cx2+config.commentpadding},${cy2-cheight/2} L${cx2},${cy2-cheight/2} L${cx2},${cy2+cheight/2} L${cx2+config.commentpadding},${
                   cy2+cheight/2}`}/>
            ];
        }
    } else if(node.type == 'condition') { // solution
        let leftm = node.rightWidth()/2 + Node.margin.x -width/2 + Math.max(node.leftWidth(), node.contentWidth());
        // - (node.contentWidth()-node.leftWidth())/2);//+ node.rightWidth()/2 + Node.margin.x;
        // node.width()-width/2 - node.rightWidth()/2 - node.maxCommentWidth()/2; // + (node.contentWidth() - node.leftWidth())/2 + 
        e = [
            // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth)}deg 100% 50% / 10%)`} x="0" y="0" width={node.width()} height={node.height()} />,
            // <rect key="rect" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 120}deg 100% 50% / 10%)`} x="0" y="0" width={node.maxContentWidth()} height={node.height()} />,
            // <rect key="rect-l" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 240}deg 100% 50% / 10%)`} x={leftm} y="0" width={node.leftWidth()} height={node.height()} />,
            // <rect key="rect-l" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 90}deg 100% 50% / 10%)`} x={0} y="0" width={node.leftWidth()} height={node.height()} />,
            // <rect key="rect-c" fill="none" stroke="#77777700" fill={`hsl(${(node.deepth)*360/(config.maxDeepth) + 180}deg 100% 50% / 10%)`} x={0} y="0" width={node.contentWidth()} height={node.height()} />,
            // <rect key="rect-r" fill="none" stroke="#77777700" stroke={`hsl(${(node.deepth)*360/(config.maxDeepth) + 270}deg 100% 50% / 90%)`} x={node.width()-node.rightWidth()} y="0" width={node.rightWidth()} height={node.height()-10} />,
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{node.getValue()}</text>,
            <text key="text-true" stroke="none" x={width + 2} y={height/2 + 15} dominantBaseline="end" textAnchor="end">да</text>,
            <text key="text-false" stroke="none" x={width/2 + 5} y={height + 12} dominantBaseline="end" textAnchor="start">нет</text>,
            <path key="box" fill="none"  d={`M${width/2},0 L${width},${height/2} L${width/2},${height} L0,${height/2} Z`}/>
        ];
        

        arrow(x+width/2,y+height/2,x+leftm,y+height/2);
        if(node.thenTrue.length==0) {
            arrow(x+leftm,y+height/2,x+leftm,y + node.height());
        } else {
            arrow(x+leftm,y+height/2,x+leftm,y + height + node.insideMargin());
        }
        if(node.thenFalse == undefined || node.thenFalse.length == 0) {
            arrow(x,y+height,x,y + node.height());
        } else {
            arrow(x,y+height,x,y + height + node.insideMargin());
        }
        y += height + node.insideMargin();
        let dy = 0;
        let arrowFromY = null;
        for (let child of node.thenTrue) {
            if(arrowFromY != null) arrow(leftm + x, arrowFromY, leftm + x, y + dy);
            drawNode(child, leftm + x, y + dy);
            arrowFromY = child.arrowOutY() + y + dy;
            if(child.arrowCustom()) arrowFromY = null;
            if(!child.hasOutArrow()) break;
            dy += child.height();
            dy += child.marginY();
        }
        if(arrowFromY != null) {
            arrow(leftm + x, arrowFromY, leftm + x, y + node.height() - node.insideMargin() - height);
            // arrow(leftm + x, y + node.height() - node.insideMargin() - height,  x, y + node.height() - node.insideMargin() - height);
            arrow(leftm + x, y + node.height() - node.insideMargin() - height,  x, y + node.height() - node.insideMargin() - height);
        }

        if(node.thenFalse != undefined) {
            arrowFromY = null;
            dy = 0;
            for (let child of node.thenFalse) {
                if(arrowFromY != null) arrow(x, arrowFromY, x, y + dy);
                drawNode(child, x, y + dy);
                arrowFromY = child.arrowOutY() + y + dy;
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
        }
    }

    if(node.type == 'programm') {
        let arrowFromY = null;
        console.log('arrowFromY', arrowFromY);
        for (var i = node.children.length-1; i >= 0; i--) {
            let child = node.children[i];
            if(arrowFromY != null && node.type != 'programm') arrow(x, arrowFromY, x, y);
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

    zone.maxX = Math.max(zone.maxX, translate.x + maxX + Node.margin.x);//x+width/2);
    zone.minX = Math.min(zone.minX, translate.x);
    zone.maxY = Math.max(zone.maxY, translate.y+height);//y+height);
    zone.minY = Math.min(zone.minY, translate.y);//y);
        console.log('zone: ', zone);
    
    if(!customChildren) {
        let arrowFromY = null;
        for (var i = 0; i < node.children.length; i++) {
            let child = node.children[i];
            if(arrowFromY != null && node.type != 'programm') arrow(x, arrowFromY, x, y);
            drawNode(child, x, y);
            arrowFromY = child.arrowOutY() + y;
            if(child.arrowCustom()) arrowFromY = null;
            y += child.marginY();
            y += child.height();
            if(!child.hasOutArrow()) break;
        }
    }

    if(node.comment != undefined) {
        if(eComment == null) {
            let height = node.contentHeight();
            let commentsx = width;
            if(node.shape == Node.shapeData) commentsx -= height/2;
            let commentx = width+Node.commentmargin.x-10;
            eComment = [
                <text key="comment" stroke="none" x={commentx+10} y={height/2} dominantBaseline="middle" textAnchor="start">{node.comment}</text>,
                <line key="comment-box-dash"  x1={commentsx} y1={height/2} x2={commentx} y2={height/2} strokeDasharray="4"/>,
                <path key="comment-box" fill="none"  d={`M${commentx},${height/2} L${commentx},${height/2} L${commentx},0 L${commentx+config.commentpadding},0 L${commentx},0 L${
                    commentx},${height} L${commentx+config.commentpadding} ${height}`}/>
            ];
        }
        if(eComment != null) {
            for (let ec of eComment) {
                e.push(ec);  
            }
        }
    }

	let eChildrenNodes = [];
    for (let cn of childrenNodes) {
    	eChildrenNodes.push(<SVGNode key={eChildrenNodes.length} node={cn.node} scheme={{config:config,zone:zone}} x={cn.x} y={cn.y} />);
    }

    if(e == null) return <g>:(</g>;
       return <g transform={` translate(${translate.x} ${translate.y})`} stroke={`hsl(${(node.deepth-1)*360/(config.maxDeepth)}deg 100% 80%)`}>{e}{eChildrenNodes}</g>
}



function arrow(x1, y1, x2, y2) {
    // let from = getArrowNode(x1,y1);
    // let to = getArrowNode(x2,y2);
    // from.set = true;
    // if(from.target != undefined) console.warn("Arrow alrady has tagets", from);
    // from.target = {x:x2,y:y2};
    // if(to.froms == undefined) to.froms = [];
    // to.froms.push(from);
    // if(to.froms.length >= 2) {
    //     for (let f of to.froms) {
    //         f.head = true;
    //     }
    // }
}
