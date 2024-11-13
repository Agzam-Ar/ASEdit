import EditorState from "../../../vars";

const doc = document.implementation.createDocument(null, "doc");
const serializer = new XMLSerializer();

export default class DIOCell {

	static arrows = 0;

	static mainStyle = () => `fontSize=15;strokeWidth=1;html=1;glass=0;shadow=0;`;

	static styles = {
		process: (d) => `shape=process;size=${d.geometry.height/d.geometry.width/3}`, //;backgroundOutline=1;`
		terminator: () => `arcSize=987;rounded=1;absoluteArcSize=1;`,
		data: (d) => `shape=parallelogram;perimeter=parallelogramPerimeter;size=${d.geometry.height/d.geometry.width};`,
		loopbegin: () => `shape=loopLimit;direction=east;size=15`,
		loopend: () => `shape=loopLimit;direction=west;size=15`,
		condition: () => `rhombus;`,
		empty: () => ``,
	};
	
	static toString = () => `<mxfile host="app.diagrams.net" version="24.8.0">
	<diagram id="page1" name="Page-1">
    	<mxGraphModel dx="1386" dy="791" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
			${serializer.serializeToString(DIOCell.root)}
		</mxGraphModel>
	</diagram>
</mxfile>
`;
	static root = undefined;
	static element = (tag) => doc.createElement(tag);
	static createRoot = (tag) => {
		let eRoot = doc.createElement(tag);

		let eCell0 = DIOCell.element('mxCell');
		let eCell1 = DIOCell.element('mxCell');
		eCell0.setAttribute('id', `0`);
		eCell1.setAttribute('id', `1`);
		eCell1.setAttribute('parent', `0`);

		eRoot.append(eCell0);
		eRoot.append(eCell1);

		return eRoot;
	}

	static createCell = (node, geometry, style=() => "", props={}) => {
		let eCell = DIOCell.element('mxCell');
		eCell.setAttribute('id', `${node.uid+2}`);
		eCell.setAttribute('value', node.value);
		eCell.setAttribute('parent', `1`);
		eCell.setAttribute('vertex', 1);
		eCell.setAttribute('style', `${DIOCell.mainStyle()}fontFamily=${EditorState.prefs.$get("font")};${style({geometry:geometry})}`);
		
		for (let key of Object.keys(props)) {
			eCell.setAttribute(key, props[key]);
		}

		if(geometry != undefined) {
			let eGeometry = DIOCell.element('mxGeometry');
			eGeometry.setAttribute('as', 'geometry');
			eGeometry.setAttribute('x', geometry.x);
			eGeometry.setAttribute('y', geometry.y);
			eGeometry.setAttribute('width', geometry.width);
			eGeometry.setAttribute('height', geometry.height);
			eCell.append(eGeometry);
		}
		return eCell;
	};


	static createComment = (node, geometry, style=() => "", props={}) => {
		let eCell = DIOCell.element('mxCell');
		eCell.setAttribute('id', `comment-${node.uid+2}`);
		eCell.setAttribute('value', node.comment);
		eCell.setAttribute('parent', `1`);
		eCell.setAttribute('vertex', 1);
		eCell.setAttribute('style', `${DIOCell.mainStyle()}shape=mxgraph.flowchart.annotation_1;align=left;pointerEvents=1;hachureGap=4;fontFamily=${EditorState.prefs.$get("font")};${style({geometry:geometry})}`);
		
		if(geometry != undefined) {
			let eGeometry = DIOCell.element('mxGeometry');
			eGeometry.setAttribute('as', 'geometry');
			eGeometry.setAttribute('x', geometry.x);
			eGeometry.setAttribute('y', geometry.y);
			eGeometry.setAttribute('width', geometry.width);
			eGeometry.setAttribute('height', geometry.height);
			eCell.append(eGeometry);
		}

        DIOCell.root.append(eCell);

       	DIOCell.createArrow(node, `comment-${node.uid+2}`, undefined, undefined, () => "dashed=1;endArrow=none;"); // edgeStyle=elbowEdgeStyle;
	}

	static createArrow = (sourceNode, targetNode, points, label, style=() => "edgeStyle=orthogonalEdgeStyle;", props={}) => {
		if(sourceNode == undefined) console.warn("source node is undefined");
		if(targetNode == undefined) console.warn("target node is undefined");

		const arrowId = `arrow-${DIOCell.arrows}`;

		let eCell = DIOCell.element('mxCell');
		eCell.setAttribute('id', arrowId);
		// eCell.setAttribute('value', node.value);
		eCell.setAttribute('parent', `1`);
		eCell.setAttribute('edge', `1`);
		if(sourceNode != undefined) eCell.setAttribute('source', typeof(sourceNode) != 'object' ? sourceNode : sourceNode.uid+2);
		if(targetNode != undefined) eCell.setAttribute('target', typeof(targetNode) != 'object' ? targetNode : targetNode.uid+2);
		eCell.setAttribute('style', `${DIOCell.mainStyle()}rounded=0;orthogonalLoop=1;jettySize=auto;jumpStyle=sharp;${style()}`);
		for (let key of Object.keys(props)) {
			eCell.setAttribute(key, props[key]);
		}
		let eGeometry = DIOCell.element('mxGeometry');
		eGeometry.setAttribute('as', 'geometry');
		eGeometry.setAttribute('relative', 1);
		eCell.append(eGeometry);
		if(points != undefined) {
			let eArray = DIOCell.element('Array');
			eArray.setAttribute('as', 'points');
			eGeometry.append(eArray);
			for (let point of points) {
				let ePoint = DIOCell.element('mxPoint');
				ePoint.setAttribute('x', point.x);
				ePoint.setAttribute('y', point.y);
				eArray.append(ePoint);
			}
		}
		DIOCell.root.append(eCell);

		if(label != undefined) {
			let eLabel = DIOCell.element('mxCell');
			eLabel.setAttribute('id', `label-${DIOCell.arrows}`);
			eLabel.setAttribute('parent', arrowId);
			eLabel.setAttribute('vertex', `1`);
			eLabel.setAttribute('connectable', `0`);
			eLabel.setAttribute("value", label);
			eLabel.setAttribute('style', `${DIOCell.mainStyle()}edgeLabel;align=left;verticalAlign=top;resizable=0;points=[];`);

			let eLabelGeometry = DIOCell.element('mxGeometry');
			eLabelGeometry.setAttribute('as', 'geometry');
			eLabelGeometry.setAttribute('relative', 1);
			eLabelGeometry.setAttribute('x', -1);
			eLabelGeometry.setAttribute('y', -1);

			let eLabelPoint = DIOCell.element('mxPoint');
			eLabelPoint.setAttribute('x', 5);
			eLabelPoint.setAttribute('y', -5);
			eLabelPoint.setAttribute("as", 'offset');
			eLabelGeometry.append(eLabelPoint);

			eLabel.append(eLabelGeometry);
			
			DIOCell.root.append(eLabel);
		}

		DIOCell.arrows++;
	};

	static removeArrow = (element) => {
		let id = element.getAttribute('id');
		if(id.startsWith("arrow-")) {
			let label = DIOCell.findId(`label-${id.substring(6)}`);
			if(label != undefined) {
				DIOCell.root.removeChild(label);
			}
		}
		DIOCell.root.removeChild(element);
	}

	static findId = (id) => {
		for (let e of DIOCell.root.getElementsByTagName("mxCell")) {
			if(e.getAttribute('id') == id) return e;
		}
		return undefined;
	}

	static findArrowTo = (node) => {
		for (let e of DIOCell.root.getElementsByTagName("mxCell")) {
			if(e.getAttribute('target') == node.uid+2) return e;
		}
		return undefined;
	}

	static findArrowFrom = (node) => {
		for (let e of DIOCell.root.getElementsByTagName("mxCell")) {
			if(e.getAttribute('source') == node.uid+2) return e;
		}
		return undefined;
	}
	
	static makePrevArrows = (child, lastChild) => {
		if(lastChild == null) return false;

		let lastCallback = lastChild.callback;

        if(lastChild.type == 'condition') {
            if(lastCallback.dio != undefined) {
                DIOCell.createArrow(lastChild.thenTrue[lastChild.thenTrue.length-1], child, [lastCallback.dio.thenTrueOut]);
            }
            if(lastChild.thenFalse == undefined) {
                DIOCell.createArrow(lastChild, child, undefined, "нет");
            } else {
                DIOCell.createArrow(lastChild.thenFalse[lastChild.thenFalse.length-1], child);
            }
        } else if(lastChild.shape == Node.shapeLoopBegin) {
        	let from = lastChild.children[lastChild.children.length-1];
            DIOCell.createArrow(from, child);
            // DIOCell.makePrevArrows();
        } else {
        	return false;
        }
        return true;
	}
}