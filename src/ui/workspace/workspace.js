import './workspace.css';
import Box from "./box";

export default function Workspace() {
    return (
        // <div className="">
            <main className="workspace">
                <Box config={{
                    // children: [
                    //     {size:3,children:[{type: "scheme", size:3},{size:2}]},
                    //     {size:2, type: "editor"}
                    // ]
                    horisontal: true,
                    children: [
                        {size:3, type: "scheme"},
                        {size:2, type: "editor"}
                    ]
                    // horisontal: false,
                    // children: [
                    //     {
                    //         size: 1,
                    //         type: "toolbar"
                    //     },
                    //     {
                    //         size: 10,
                    //         horisontal: true,
                    //         children: [
                    //             {size:3, type: "scheme"},
                    //             {size:2, type: "editor"}
                    //         ]
                    //     }
                    // ],
                    
                }}/>
            </main>
        // </div>
    );
}


