
const TextMetrics = {
	getTextBox: text => {
		if(TextMetrics.svg == undefined) TextMetrics.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		TextMetrics.svg.id = "textMetrics";
		if(TextMetrics.textElement == undefined) {
			TextMetrics.textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
			TextMetrics.textElement.style.fontFamily = 'var(--scheme-font)';
			TextMetrics.textElement.style.fontSize = 'var(--scheme-font-size)';
			TextMetrics.svg.append(TextMetrics.textElement);
		}
		if(TextMetrics.svg.parentElement == null) {
			document.body.append(TextMetrics.svg);
		}
		TextMetrics.textElement.textContent = text;
		return TextMetrics.textElement.getBBox();
	},
	getTextWidth: text => TextMetrics.getTextBox(text).width,
}


/**
 * 
 *	Types: 
 * 	> Basic: 
 * 		- start
 * 		- end 
 * 		- function
 * 		- operation
 *  > Extended: 
 * 		- condition:
 * 		|	Has 2 coulumns: <thenTrue : array of nodes> [thenFalse : array of nodes]
 * 		- loopcondition
 * 		|	Has 1 coulumn: <children>
 */

class Node {

	static nodes = 0; // counter

	static char = {width: 1, height: 1};
	static padding = {x:5,y:5};
	static margin = {x:10,y:20};
	static basewidth = 0;
   	static commentmargin = {x:30};
   	static calcDefaultHeight = () => TextMetrics.getTextBox("Agzam").height;


	static shapeHidden = 		'hidden';
	static shapeTerminator = 	'round';
	static shapeProcess = 		'rect';
	static shapeData = 			'data';
	static shapeLoopBegin = 	'loopbegin';
	static shapeLoopEnd = 		'loopend';
	static shapeFunction = 		'function';
	
	constructor(type) {
		this.type = type;
		this.children = [];
		this.shape = Node.shapeHidden;
		this.value = "placeholder";
		this.delta = [0,0];
		this.deltaConsumer = [0,0];
		this.uid = Node.nodes++;
		if(type == 'start' || type == 'end' || type == 'break' || type == 'continue' || type == 'terminator') this.shape = Node.shapeTerminator;
		if(type == 'operation' || type == 'function') this.shape = Node.shapeProcess;
		if(type == 'data') this.shape = Node.shapeData;
		if(type == 'start') this.value = `начало`;
		if(type == 'end') this.value = `конец`;
		if(type == 'condition') {
			this.leftWidth = () => {
				let left = Math.max(this.contentWidth(), Node.basewidth);
				if(this.thenFalse != undefined) {
    				for (let child of this.thenFalse) {
						left = Math.max(left, child.width());
						if(child.comment != undefined) left = Math.max(left, child.width()/2 + this.contentWidth()/2 + child.commentWidth());
    				}
				}
    			return left;//Math.max(left, /2);//(this.contentWidth() + left)/2;
			}
			this.rightWidth = () => {
				let right = Node.basewidth;
    			for (let child of this.thenTrue) {
					right = Math.max(right, child.width());
    			}
    			return right;//(this.contentWidth() + left)/2;
			}
			this.realRightWidth = () => {
				let right = Node.basewidth;
    			for (let child of this.thenTrue) {
					right = Math.max(right, child.width());
					if(child.comment != undefined) right = Math.max(right, child.width() + child.commentWidth());
    			}
    			return right;//(this.contentWidth() + left)/2;
			}
			this.insideMargin = () => Node.margin.y;
		}
		if(type == 'loopcondition') {
			this.leftWidth = () => {return this.contentWidth()};
			this.insideMargin = () => Node.margin.y;
		}
		if(type == 'loopbegin') {
			this.value = ``;
			this.shape = Node.shapeLoopBegin;
		}
		if(type == 'loopend') {
			this.value = ``;
			this.shape = Node.shapeLoopEnd;
		}
	}

	addChild(child) {
		this.children.push(child);
		child.parent = this;
	}

	replaceChild(oldChild, newChild) {
		let index = this.children.indexOf(oldChild);
		if(index == -1) return false;
		this.children[index] = newChild;
		oldChild.parent = undefined;
		newChild.parent = this;
		return true;
	}

	lastChild(child) {
		return this.children[this.children.length-1];
	}


	indexOf(child) {
		for (var i = 0; i < this.children.length; i++) {
			if(this.children[i] == child) return i;
		}
		return -1;
	}

	findParent(validator) {
		if(this.parent == undefined) return undefined;
		if(validator(this.parent)) return this.parent;
		return this.parent.findParent(validator);
	}

	eachChild(consumer) {
		consumer(this);
    	for (let child of this.children) child.eachChild(consumer);
    	if(this.thenTrue != undefined) for (let child of this.thenTrue) child.eachChild(consumer);
    	if(this.thenFalse != undefined) for (let child of this.thenFalse) child.eachChild(consumer);
	}

	build(config, deepth) {
		// if(config.columnsWidth[deepth] == undefined) config.columnsWidth[deepth] = 0;
		// config.columnsWidth[deepth] = Math.max(config.columnsWidth[deepth], this.contentWidth()); 
	}

	getMaxDeepth(deepth=0) {
		this.deepth = deepth;
		let max = deepth;
    	if(this.type == 'condition') {
    		for (let child of this.thenTrue) {
				max = Math.max(max, child.getMaxDeepth(deepth+1));
			}
    		if(this.thenFalse != undefined) for (let child of this.thenFalse) {
				max = Math.max(max, child.getMaxDeepth(deepth+1));
			}
    		return max;
    	}
    	for (let child of this.children) {
			max = Math.max(max, child.getMaxDeepth(deepth+1));
    	}
    	return max;
	}

	getValue() {
		if(typeof(this.value) == 'object') {
			let text = "";
			for (let token of this.value) {
				text += token.type == 'string' ? `"${token.value}"` : token.value;
			}
			console.log(this.value, text);
			return text;
		}
		return this.value;
	}

    height() {
    	if(this.type == 'condition') {
    		let height = Math.max(this.contentHeight(), Node.char.height);

    		let trueHeight = 0;
    		let falseHeight = 0;
    		for (let child of this.thenTrue) {
				trueHeight += child.height() + child.marginY();
    		}
    		if(this.thenFalse != undefined) {
    			for (let child of this.thenFalse) {
					falseHeight += child.height() + child.marginY();
    			}
    		}
    		return height + Math.max(trueHeight, falseHeight) + this.paddingY();
    	}
    	if(this.type == 'loopbegin') {
    		let height = this.contentHeight();
    		let childrenHeight = 0;
    		for (let child of this.children) {
				childrenHeight += child.height() + child.marginY();
    		}
    		return height + childrenHeight; //  + this.paddingY(
    	}
		if(this.type == 'loopcondition') {
    		let height = this.contentHeight();
    		let trueHeight = 0;
    		let falseHeight = 0;
    		for (let child of this.children) {
				trueHeight += child.height() + child.marginY();
    		}
    		return height + Math.max(trueHeight, falseHeight) + this.paddingY() + Node.margin.y;
		}
    	let height = (this.shape == Node.shapeHidden ? this.paddingY() : this.contentHeight());
    	for (let child of this.children) {
			height += child.height() + child.marginY();
    	}
    	if(this.children.length != 0) height -= this.children[this.children.length-1].marginY();
    	return height;
    }

    width() {
    	// if(this.type == 'condition' || this.type == 'loopcondition') return Node.basewidth*2 + Node.margin.x;
    	if(this.type == 'condition') {
    		return Math.max(this.leftWidth(), this.contentWidth()) + this.realRightWidth() + Node.margin.x;
    		//+ Math.max(0, this.commentWidth() - this.contentWidth() - Node.commentmargin.x);//Math.max(this.leftWidth(), this.contentWidth()) - rightOffset + right + Node.margin.x;
    		// return (this.leftWidth() + this.contentWidth())/2 + this.realRightWidth() + Node.margin.x + Math.max(0, this.commentWidth() - this.contentWidth()/2 + Node.commentmargin.x);//Math.max(this.leftWidth(), this.contentWidth()) - rightOffset + right + Node.margin.x;
    	}
		if(this.type == 'loopcondition') {
			let right = 0;
    		for (let child of this.children) {
				right = Math.max(right, child.width());
    		}
    		return right + Node.margin.x + Node.basewidth;
		}

    	let width = Math.max(Node.basewidth, this.maxContentWidth());// + this.commentWidth(); // FIXME
    	for (let child of this.children) {
			width = Math.max(width, child.width());
    	}
    	return width;
    }
	

    maxContentWidth() {
    	let width = this.contentWidth();
    	if(this.type == 'condition') {
    		// console.log('condition', this.thenTrue);
    		for (let child of this.thenTrue) {
				width = Math.max(width, child.maxContentWidth());
    		}
    		if(this.thenFalse != undefined) {
    			for (let child of this.thenFalse) {
					width = Math.max(width, child.maxContentWidth());
    			}
    		}
    	} else {
    		// console.log('type', this.children);
    		for (let child of this.children) {
				width = Math.max(width, child.maxContentWidth());
    		}
    	}
    	return width;
    }

    contentWidth() {
    	if(this.type == 'condition' || this.type == 'loopcondition') {
			let left = Node.basewidth;
			if(this.thenFalse != undefined) {
    			for (let child of this.thenFalse) {
					left = Math.max(left, child.width());
    			}
			}
    		// Geometry :D
    		let vb = TextMetrics.getTextBox(this.getValue());
    		let tw = vb.width/2 + Node.padding.x/2;
    		// console.log('tw', tw, 'is', vb.width/2, Node.padding.x/2);
    		let th = this.paddingY()/2;
    		let Th = th + (vb.height);
    		return Math.max(tw*Th/th, /*left*/TextMetrics.getTextWidth('нетда')*2);
    	}
    	let width = TextMetrics.getTextWidth((this.value == undefined ? "" : this.getValue()));
		if(this.shape == Node.shapeLoopBegin || this.shape == Node.shapeLoopEnd) width = Math.max(width, TextMetrics.getTextWidth((this.name == undefined ? "" : this.name)));
    	if(this.shape == Node.shapeData) width += this.contentHeight()*2;
    	return Math.max(width + this.paddingX(), Node.basewidth);
    }

    commentWidth() {
    	if(this.comment == undefined) return 0;
    	return TextMetrics.getTextWidth(this.comment) + Node.commentmargin.x;
    }

    maxCommentWidth() {
    	let width = this.commentWidth();
    	for (let child of this.children) {
			width = Math.max(width, child.maxCommentWidth());
    	}
    	return width;
    }
	
    contentHeight() {
    	if(this.type == 'loopbegin' || this.type == 'loopend') return TextMetrics.getTextBox(`L`).height + this.paddingY();
    	return TextMetrics.getTextBox(this.getValue()).height + this.paddingY();
    }

    commentHeight() {
    	if(this.type == 'subprogramm') return TextMetrics.getTextBox(this.comment).height + Node.padding.y;
    	if(this.type == 'break' || this.type == 'continue') return 0;
    	return TextMetrics.getTextBox(this.getValue()).height + Node.padding.y;
    }

	paddingX() {
		// if(this.shape == Node.shapeData) return Node.padding.x + this.contentHeight();
		// if(this.shape == Node.shapeLoopBegin || this.shape == Node.shapeLoopEnd) return Node.padding.x + this.contentHeight();
		if(this.shape == Node.shapeFunction) return Node.padding.x + this.contentHeight()*2/3;
		return (this.shape == Node.shapeHidden ? 0 : Node.padding.x);
	}

	paddingY() {
    	if(this.type == 'subprogramm') return Node.padding.y;
    	if(this.type == 'condition' || this.type == 'loopcondition') return Node.padding.y + TextMetrics.getTextBox(this.getValue()).height;
    	if(this.type == 'loopbegin' || this.type == 'loopend') return Node.padding.y + Node.char.height;
		return (this.shape == Node.shapeHidden ? 0 : Node.padding.y);
	}

	marginX() {
		return (this.shape == Node.shapeHidden ? 0 : Node.margin.x);
	}

	marginY() {
    	if(this.type == 'condition' || this.type == 'loopcondition' || this.type == 'group') return Node.margin.y;
    	if(this.type == 'subprogramm') return Node.margin.y;
		return (this.shape == Node.shapeHidden ? 0 : Node.margin.y);
	}

	arrowInY() {
		return 0;
	}

	arrowOutY() {
		if(this.type == 'condition' || this.type == 'loopcondition' || this.type == 'group') return this.height();
		return this.contentHeight();
	}

	arrowCustom() {
		if(this.type == 'end' || this.type == 'break' || this.type == 'continue' || this.type == 'loopbegin') return true;
		return false;
	}

	hasOutArrow() {
		if(this.type == 'end' || this.type == 'break' || this.type == 'continue') return false;
		return true;
	}
	
}
window["Node"] = Node;

export default Node;