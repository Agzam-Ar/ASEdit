
function drawBlock(block, x=0, y=0, from) {
    if(block == undefined) return;
    block.drawed = true;

    let width = config.sameWidth ? config.basewidth : block.width();//;//
    let height = block.height();

    zone.maxX = Math.max(zone.maxX, x+width/2);
    zone.minX = Math.min(zone.minX, x-width/2);
    zone.maxY = Math.max(zone.maxY, y+height);
    zone.minY = Math.min(zone.minY, y);

    y += height/2;

    if(from != undefined) {
        arrow(from[0], from[1], x, y-height/2-3);
    }

    let e = null;
    let eComment = undefined;
    if(block.type == Block.start || block.type == Block.end) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{block.value}</text>,
            <rect key="box" fill="none"  x="0" width={width} height={height} ry={height/2} />
        ];
    }
    if(block.type == Block.operation) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{block.value}</text>,
            <rect key="box" fill="none"  x="0" width={width} height={height}/>
        ];
    }
    if(block.type == Block.io) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{block.value}</text>,
            <path key="box" fill="none"  d={`M${height},0 L${width},0 L${width-height},${height} L0,${height} Z`}/>
        ];
    }
    if(block.type == Block.loopend) {
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{block.value}</text>,
            <text key="text-true" stroke="none" x={0 - 5 - 20} y={height/2 + 12} dominantBaseline="end" textAnchor="start">да</text>,
            <text key="text-false" stroke="none" x={width/2 + 5} y={height + 12} dominantBaseline="end" textAnchor="start">нет</text>,
            <path key="box" fill="none" d={`M${width/2},0 L${width},${height/2} L${width/2},${height} L0,${height/2} Z`}/>
        ];
        if(e != null) blocks.push(<g key={blocks.length} transform={` translate(${x - width/2} ${y - height/2})`} stroke={`hsl(${block.deepth*90}deg 100% 80%)`}>{e}</g>);
        y += height + config.margin;
        y -= height/2;
        from = [x-width/2,y - config.margin - height/2];
        let src = loopstartsPoints[`l${block.deepth}`];
        arrow(x-width/2, y - config.margin - height/2, x- (config.basewidth+config.xgap) + 2.5,y - config.margin - height/2);
        arrow(x-(config.basewidth+config.xgap),y - config.margin - height/2, src.x , src.y + 2.5);

        // exit arrow
        arrow(x,y- config.margin, x,y-2.5);
        arrow(x,y, x-(config.basewidth+config.xgap)+2.5,y);
        from = [x-(config.basewidth+config.xgap),y];
        drawBlock(block.children[0], x - (config.basewidth+config.xgap)*1, y+config.margin, from);
        return;
    }
    if(block.type == Block.loopstart) {
        width = block.width();
        e = [
        ];
        if(e != null) blocks.push(<g key={blocks.length} transform={` translate(${x - width/2} ${y - height/2})`} stroke={`hsl(${block.deepth*90}deg 100% 80%)`}>{e}</g>);
        loopstartsPoints[`l${block.deepth}`] = {x:x,y:y+height/2};
        // console.log('saved', {x:x,y:y});
        // console.log(loopstartsPoints);
        y += height + config.margin;
        y -= height/2;
        from = [x+width/2,y - config.margin - height/2];
        drawBlock(block.children[0], x + (config.basewidth+config.xgap)*1, y, from);
        return;
    }
    if(block.type == Block.condition && block.children.length >= 2) {
        let heightOfDeepth = block.heightOfDeepth(block.deepth, config.margin); // TODO: only for else

        let elseColumns = 1;//block.children[1].maxDeepth() - block.deepth + 1; // TODO: only for else
        let ifSeqHeight = block.children[0].heightOfDeepth(block.deepth+1, config.margin); // TODO: only for else
        let elseSeqHeight = block.children[1].heightOfDeepth(block.deepth, config.margin);

        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{block.value}</text>,
            <text key="text-true" stroke="none" x={width + 5} y={height/2 + 12} dominantBaseline="end" textAnchor="start">да</text>,
            <text key="text-false" stroke="none" x={width/2 + 5} y={height + 12} dominantBaseline="end" textAnchor="start">нет</text>,
            <path key="box" fill="none"  d={`M${width/2},0 L${width},${height/2} L${width/2},${height} L0,${height/2} Z`}/>
        ];
        
        if(block.comment != undefined) {
            let cx1 = width*3/4;
            let cy1 = height/4;
            let cx2 = width+config.commentmargin;
            let cy2 = 0;
            let cheight = block.commentHeight();
            let eComment = [
                <text key="comment" stroke="none" x={cx2+10} y={cy2} dominantBaseline="middle" textAnchor="start">{block.comment}</text>,
                <line key="comment-box-dash"  x1={cx1} y1={cy1} x2={cx2} y2={cy2} strokeDasharray="4"/>,
                <path key="comment-box" fill="none"  d={`M${cx2+config.commentpadding},${cy2-cheight/2} L${cx2},${cy2-cheight/2} L${cx2},${cy2+cheight/2} L${cx2+config.commentpadding},${
                   cy2+cheight/2}`}/>
            ];
            if(eComment != null) {
                for (let ec of eComment) {
                    e.push(ec);  
                } 
            }
        }

        if(e != null) blocks.push(<g key={blocks.length} transform={` translate(${x - width/2} ${y - height/2})`} stroke={`hsl(${block.deepth*90}deg 100% 80%)`}>{e}</g>);

        y += height + config.margin;
        y -= height/2;
        from = [x+width/2,y - config.margin - height/2];
        drawBlock(block.children[0], x + (config.basewidth+config.xgap)*elseColumns, y+Math.max(ifSeqHeight, elseSeqHeight)-ifSeqHeight, from);
        // +Math.max(ifSeqHeight, elseSeqHeight)


        // Else block
        from = [x,y - config.margin];
        drawBlock(block.children[1], x, y+Math.max(ifSeqHeight, elseSeqHeight)-elseSeqHeight, from);
        return;
    }
    // if(block.type == Block.operation) {
    //     e = [
    //         <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">{block.value}</text>,
    //         <rect key="box" fill="none"  x="0" width={width} height={height}/>
    //     ];
    // }

    if(block.type == Block.groupend) {
        let ifSeqHeight = block.heightOfDeepth(block.deepth, config.margin); // TODO: only for else
        e = [
            // <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">LINK {block.value} {Math.round(ifSeqHeight)}</text>,
            // <rect key="box" fill="none" x="0" width={width} height={height}/>
        ];
        // stroke="#555" 
    }

    if(block.type == Block.group) {
        width = block.maxWidth();
        // width = block.maxSequenceSize();
        e = [
            <text key="text" stroke="none" x={width/2} y={height/2} dominantBaseline="middle" textAnchor="middle">GROUP</text>,
            <rect key="box" fill="none" x="0" width={width} height={height}/>
        ];
    }

    if(block.comment != undefined) {
        if(eComment == undefined) {
            let commentsx = width;
            if(block.type == Block.io) commentsx -= height/2;
            let commentx = width+config.commentmargin;
            eComment = [
                <text key="comment" stroke="none" x={commentx+10} y={height/2} dominantBaseline="middle" textAnchor="start">{block.comment}</text>,
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


    if(e != null) blocks.push(<g key={blocks.length} transform={` translate(${x - width/2} ${y - height/2})`} stroke={`hsl(${block.deepth*80}deg 100% 80%)`}>{e}</g>);

    if(block.type == Block.end) return;

    from = [x,y+height/2];
    y += height + config.margin;
    y -= height/2;
    if(block.children == undefined) return;
    let dx = 0;
    let id = 0;
    for(let i = block.children.length-1; i >= 0; i--) {
        let c = block.children[i];
        if(id == 0) from = [x,y - config.margin];
        if(id == 1) from = [x+width/2,y - config.margin - height/2];
        drawBlock(c, x + (config.basewidth+config.margin)*id, y, from);
        dx += (config.basewidth+config.margin)*1;
        id++;
    }
    
    if(block.adoptedChild != undefined) {
        arrow(x, y - config.margin, x, y - 2.5);
        arrow(x, y, x - (config.basewidth+config.xgap) + 2.5, y);
    }

}