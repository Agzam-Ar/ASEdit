
import Lexer from './lexer/lexer'

let myl = new Lexer();
console.log(myl);

class Block {

	static char = {width: 1, height: 1};
	static padding = {x:30,y:10};

	static groupend = -2;
	static group = -1;
	static start = 		0;
	static end = 		1;
	static operation = 	2;
	static condition = 	3;
	static io = 		4;
	static loopstart = 	5;
	static loopend = 	6;
	static areturn = 	7;

	constructor(type) {
		this.type = type;
		this.deepth = 0;
		this.children = [];
		this.setValue(undefined);
		// if(type == Block.group) this.elements = [];
	}

	setValue(value) {
		this.value = value;
		if(this.type == Block.start) this.value = "начало";
		if(this.type == Block.end) this.value = "конец";
	}

    maxWidth() {
    	let max = this.width();
    	for (let c of this.children) {
			max = Math.max(max, c.maxWidth());
    	}
    	return max;
    }


    maxCommentWidth() {
    	let max = this.commentWidth();
    	for (let c of this.children) {
			max = Math.max(max, c.maxCommentWidth());
    	}
    	return max;
    }

    columns() {
    	let max = 1;
    	for (let c of this.children) {
			max = Math.max(max, c.columns());
    	}
    	return max;
    }

    maxDeepth() {
    	let max = this.deepth;
    	for (let c of this.children) {
			max = Math.max(max, c.maxDeepth());
    	}
    	return max;
    }

    heightOfDeepth(deepth, margin, endsAtCurrentDeepth=true, fork=null, skip=false, debug=null) {
    	// if(this.deepth < deepth) return 0;
    	if(this.deepth == deepth && this.type == Block.groupend && !skip) {//} && endsAtCurrentDeepth) {
    		if(fork != null) {
    			fork.end = this;
    		}
    		return 0;
    	}
    	let childrenHeight = 0;
    	const pad = " |  ";
    	let firstDebug = debug == null;
    	if(debug == null) debug = {};

    	// if(this.children.length == 0) return 0;
    	if(this.type == Block.condition && this.children.length >= 2) {
			let debugIf = {block:this.children[0].value};
			let debugElse = {block:this.children[1].value};
			debug.if = debugIf;
			debug.else = debugElse;
			let forkend = {};
			let cif = this.children[0].heightOfDeepth(deepth+1, margin, false, forkend, false, debugIf);
			let celse = this.children[1].heightOfDeepth(deepth, margin, false, forkend, false, debugElse);
			childrenHeight = Math.max(cif, celse);
			debugIf.result = cif;
			debugElse.result = celse;
			if(forkend.end != undefined) {
				let forkh = forkend.end.heightOfDeepth(deepth, margin, endsAtCurrentDeepth, fork, true, {}); // TODO: if
    			childrenHeight += forkh;
			}
			// console.log("|".repeat(deepth),deepth, "if", cif, 'else', celse, childrenHeight);
    	} else if(this.children.length > 0) {
    		childrenHeight = this.children[0].heightOfDeepth(deepth, margin, endsAtCurrentDeepth, fork, false, {});
    	}
		// if(firstDebug) console.log(debug);

    	// for (let c of this.children) {
		// 		// maxChildrenHeight += c.heightOfDeepth(deepth+1, margin);
		// 		maxChildrenHeight = Math.max(maxChildrenHeight, c.heightOfDeepth(deepth+1, margin));
    	// 	} else {
		// 		maxChildrenHeight = Math.max(maxChildrenHeight, c.heightOfDeepth(deepth, margin));
    	// 	}
    	// }
    	return this.height() + childrenHeight + margin;
    }

    each(func) {
		func(this);
    	for (let c of this.children) {
			c.each(func);
    	}
    }

    width() {
    	if(this.type == Block.loopstart) return 0;
    	if(this.value == undefined) return 10;
    	if(this.type == Block.condition || this.type == Block.loopend) return Block.char.width * this.value.length*1.5 + Block.padding.x;
    	if(this.type == Block.io) return Block.char.width * this.value.length + Block.padding.x + this.height();
    	return Block.char.width * this.value.length + Block.padding.x;
    }


    commentWidth() {
    	if(this.comment == undefined) return 0;
    	// if(this.type == Block.condition) return Block.char.width * this.comment.length*1.5 + Block.padding.x;
    	// if(this.type == Block.io) return Block.char.width * this.comment.length + Block.padding.x + this.height();
    	return Block.char.width * this.comment.length;
    }

    commentHeight() {
    	if(this.comment == undefined) return 0;
    	return Block.char.height + Block.padding.y;
    }

    height() {
    	if(this.type == Block.groupend || this.type == Block.loopstart) return 0;
    	if(this.type == Block.condition || this.type == Block.loopend) return Block.char.height*2 + Block.padding.y;
    	return Block.char.height + Block.padding.y;
    }

    addChild(child) {
    	this.children.push(child);
    }

    addElement(e) {
    	this.elements.push(e);
    }
}


export default Block;