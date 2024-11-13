// "use client";
import './workspace.css';
import MyEditor from "./editor/editor";
import Scheme from "./scheme/scheme";

export default function Box({config = {size: 1}, width=100,height=100}) {

    if(config.children == undefined) {
        let content = null;
        let title = ""
        let subtitle = "";

        if(config.type == 'editor') {
            content = (<MyEditor/>);
            title = "Редактор "
            subtitle = `Ctrl+S - чтобы сделать схему`;
        }
        if(config.type == 'scheme') {
            content = (<Scheme/>);
            title = "Схема"
        }

        return (
            <div className={`box-flex-${config.horisontal ? "row" : "col"} box`} style={{
                        width:  (width) + '%',
                        height: (height) + '%',
                    }}>
                    <div className="boxbody">
                        <div className="boxtitle">{title}<i className="subtitle">{subtitle}</i></div>
                        {content}
                    </div>
            </div>);
    }

    // undefined 
    // let layout = {
    //     isHorisontal: true,
    //     size: config.size,
    //     children1: undefined,
    //     children2: undefined,
    // };

    config.sizeSum = () => {
        let sum = 0;
        for(let c of config.children) sum += c.size;
        return sum;
    };


    // if(parentlayout != undefined) {
    //     if(parentlayout.children1 != undefined) parentlayout.children1 = layout;
    //     else if(parentlayout.children2 != undefined) parentlayout.children2 = layout;
    // }

    let boxes = [];
    if(config != undefined && config.children != undefined) {
        for(let c of config.children) {
            boxes.push(c);
        }
    }

    //if(parentlayout != undefined) console.log("sizeSum: ", config.sizeSum());

    return (
        <div className={`box-flex-${config.horisontal ? "row" : "col"} box`} style={{
                    width:  (width) + '%',
                    height: (height) + '%',
                }}>
            {boxes.map((c,i)=>
                <Box key={i} config={c} width={config.horisontal ? (c.size*100/config.sizeSum()) : 100} height={config.horisontal ? 100 : (c.size*100/config.sizeSum())}/>)}
        </div>
    );
}





