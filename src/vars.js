
import Block from './libs/block';
import Lexer from './libs/lexer/lexer'
import Parser from './libs/lexer/parser'
import Node from './libs/lexer/node'


const lexer = new Lexer();
const parser = new Parser();

const hiddenPrefixes = [
	"int", "double", "long", "float",
	"unsigned int"
];

const defaultCIOForamtter = (str, funcname, name) => {
	let source = str;
	str = str.replaceAll("&", "").replace(funcname, "");

	let open = str.indexOf("(");
	if(open == -1) return `Sytax error! Missing "(" at ${source}`;
	let close = str.lastIndexOf(")");	
	if(close == -1) return `Sytax error! Missing ")" at ${source}`;

	str = str.substring(open+1, close);
	
	let frags = [];
	let isString = false;
	let frag = "";
	let skip = 1;
	let hasString = false;
	for (var i = 0; i < str.length; i++) {
		if(str.charAt(i) == '"' && str.charAt(i-1) != '\\') {
			isString = !isString;
			hasString = true;
			continue;
		}
		if(str.charAt(i) == ',' && !isString) {
			if(skip == 0) frags.push(frag);
			skip = 0;
			frag = "";
			continue;
		}
		frag += str.charAt(i);
	}
	if(frag != '') frags.push(frags.length == 0 && skip != 0 && hasString ? `"${frag}"` : frag);

	return `${name} ` + frags;
}

const printFunc = [
	{name:"scanf", format: str => defaultCIOForamtter(str, "scanf", "ввод")},
	{name:"printf", format: str => defaultCIOForamtter(str, "printf", "вывод")},

	{name:"readln", format: str => defaultCIOForamtter(str, "readln", "ввод")},
	{name:"writeln", format: str => defaultCIOForamtter(str, "writeln", "вывод")},
];

const defaultPrefs = {
	strokeWidth: 2,
	alpha: true,
	noLoop: false,
	showVartypes: false,
	sameWidth: true,
	font: "monospace",
	paddingx: 5,
	paddingy: 2.5,
	marginx: 10,
	marginy: 20,
	editableBlocks: false,
};

const getPref = (key, def) => {
	let urlSearchParams = new URLSearchParams(window.location.search);
	if(urlSearchParams.get(key) != null) return urlSearchParams.get(key);
	if(localStorage.getItem(`settins.` + key) != null) return localStorage.getItem(`settins.` + key);
	return defaultPrefs[key];
};


const EditorState = {
	loaderInited: false,
	editor: null,
	scheme: null,
	schemeNode: null,
	errors: [],
	defPrefs: defaultPrefs,
	pointListeners: {},
	prefs: {
		strokeWidth: getPref('strokeWidth'),
		$url: () => {
			let url = window.location.origin;
			let char = '?';
			for(let key of Object.keys(EditorState.prefs)) {
				if(key.charAt(0) == '$') continue;
				if(defaultPrefs[key] == EditorState.prefs[key]) continue;
				url += char + key + "=" + encodeURIComponent(EditorState.prefs[key]);
				char = '&';
			}
			return url;
		},
		$get: key => {
			if(EditorState.prefs[key] == undefined) EditorState.prefs[key] = getPref(key);
			if(EditorState.prefs[key] == 'true') EditorState.prefs[key] = 1;
			if(EditorState.prefs[key] == 'false') EditorState.prefs[key] = 0;
			return EditorState.prefs[key];
		},
		$save: () => {
			for(let key of Object.keys(EditorState.prefs)) {
				if(key.charAt(0) == '$') continue;
				if(defaultPrefs[key] == EditorState.prefs[key]) {
					localStorage.removeItem('settins.' + key);
					continue;
				}
				localStorage.setItem('settins.' + key, EditorState.prefs[key]);
			}
		}
	},
	repaint: () => {console.error("repaint not init")},
	export: (type) => {console.error("export not init")},
	onEditorUpdate: e => {
		console.clear();
		console.log(
		  "%cHave a nice day! :D",
		  "color: fff; font-style: bold; padding: 2px; font-size: 20px; outline: dashed red; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;",
		);
		EditorState.errors = [];
		// console.clear();
		let rootBlock = new Block(Block.start);
		let currentBlock = rootBlock;
		
		let code = e.getValue();
	
		let font = decodeURIComponent(EditorState.prefs.$get('font'));
		if(font == '') {
			font = defaultPrefs.font;
		}
        document.documentElement.style.setProperty('--scheme-font', font);

		parser.code = code;
		EditorState.code = code;

		let rootNode = new Node('programm');
		// rootNode.children.push(new Node('start'));
		parser.loopId = 1;
		Node.nodes = 0;
		parser.parse(lexer.parse(code), rootNode);

		let mainprogramm = new Node('subprogramm');
		mainprogramm.addChild(new Node('start'));
		let subprogramms = [];
		let subprogrammsNames = [];
		for (var i = 0; i < rootNode.children.length; i++) {
			if(rootNode.children[i].type == 'subprogramm') {
				subprogramms.push(rootNode.children[i]);
				subprogrammsNames.push(rootNode.children[i].name);
			} else {
				mainprogramm.addChild(rootNode.children[i]);
			}
		}
		rootNode.children = subprogramms;
		mainprogramm.addChild(new Node('end'));
		if(mainprogramm.children.length > 2) rootNode.addChild(mainprogramm);

		rootNode.eachChild(c => {
			if(c.type == 'operation' && c.tokens != undefined) {
				for (var i = 0; i < c.tokens.length; i++) {
					if(subprogrammsNames.includes(c.tokens[i].value)) {
						c.shape = Node.shapeFunction;
						break;
					}
				}
			}
		});
		

		// rootNode.children.push(new Node('end'));
		console.log('rootNode', rootNode);
		console.log('subprogrammsNames', subprogrammsNames);
		EditorState.schemeNode = rootNode;


		let lines = code.split("\n");
		code = "";

		for (let line of lines) {
			if(code.length == 0) code += " ";
			let isString = false;
			for (var i = 0; i < line.length; i++) {
				if(line.charAt(i) == '"' && line.charAt(i-1) != '\\') {
					isString = !isString;
					continue;
				}
				if(isString) continue;
				if(line.charAt(i) == '/' && line.charAt(i+1) == '/') {
					line = line.substring(0,i) + ";" + line.substring(i) + ";";
					break;
				}

			}
			// FIXME: string check
			code += " " + line.replaceAll("begin", "{").replaceAll("end.", "}").replaceAll("do begin", "{").replaceAll("then", "").replaceAll("end", "}").replaceAll(":=", " = ");
		}
		
		


		code = noSpaces(code.replaceAll("\t"," ")); // .replaceAll("\n"," ")
		// console.log(e.getValue());
		// currentBlock = parseBlock(rootBlock, code);
		
		currentBlock.children = [new Block(Block.end)];
		// console.log("Parsed", rootBlock);
		EditorState.scheme = rootBlock;
		EditorState.repaint();
	},

};

window["Vars"] = EditorState;


function parseBlock(parent, code, deepth=0) {
	let currentBlock = parent;
	let frag = "";
	let forLoopArgument = -1;
	let loopCondition = null;
	let loopIterator = null;
	for(let i = 0; i < code.length; i++) {
		let char = code.charAt(i);
		if(char == '{') {
			if(frag.startsWith("if")) {
				let condition = new Block(Block.condition);
				condition.deepth = deepth;
				condition.value = noSpaces(openBracket(frag.substring(2)));
				
				let close = findCloseBracket(code, i);
				let elseIndex = code.indexOf("else", close);
				
				// console.log("condition:", code.substring(i, close));
				// let group = new Block(Block.group);

				let subBlocks = parseBlock(condition, (code.substring(i+1, close)), deepth+1);
				i = close;

				let end = new Block(Block.groupend);
				end.value = "mini meow";
				end.deepth = deepth;

				subBlocks.adoptedChild = end; // lol

				for (var j = close+1; j < elseIndex; j++) {
					if(code.charAt(j) == ' ') continue;
					elseIndex = -1;
					break;
				}

				if(elseIndex != -1) {
					// console.log(deepth, `else "${ (code.substring(close, elseIndex+4))}"`, currentBlock);

					let elseStart = code.indexOf("{", elseIndex);
					// console.log("elseIndex", elseIndex, code.substring(elseIndex));
					// console.log("{Index", elseStart, code.substring(elseStart));
					let elseEnd = findCloseBracket(code, elseStart);
					
					// console.log("else block:", code.substring(elseStart+1,elseEnd));
					// console.log(deepth, `un condition subcode "${ (code.substring(elseStart+1,elseEnd))}"`, currentBlock);

					let elseBlocks = parseBlock(condition, (code.substring(elseStart+1, elseEnd)), deepth+1);

					elseBlocks.addChild(end);

					// console.log("!else block", condition);
					i = elseEnd+1;
				} else {
					condition.addChild(end);
				}


				currentBlock.addChild(condition);

				currentBlock = end;
				currentBlock.tmpParent = subBlocks;
		
				frag = "";
				continue;
				// let condition = new Block(Block.condition);
				// condition.value = frag;
				// currentBlock.children = [condition];

				// currentBlock.children.push(subBlocks);
				// // condition.children = [subBlocks];

				// console.log(condition);

				// currentBlock = condition;
				// let block = new Block(Block.condition);
				// block.value = frag;
				// currentBlock.children = [block];
				// currentBlock = block;
				
				continue;
			}

			// let block = new Block(Block.operation);
			// block.value = frag;
			// currentBlock.children = [block];
			// currentBlock = block;
	
			// frag = "";
			// continue;
		}
		if(char == ';' || char == '{') {
			if(frag.length == 0) {
				frag = "";
				continue;
			}
			if(frag.startsWith("//")) {
				// console.log("Comment", frag, currentBlock);
				currentBlock.comment = frag.substring(2);
				frag = "";
				continue;
			}
			if(frag.startsWith("for")) {
				if(openBracket(frag).endsWith("do")) {
					frag = openBracket(frag.substring(3));
					console.log("for loop", "|" + frag + "|");
					let varname = frag.substring(0,frag.search(/\W/));
					console.log("varname", "|" + varname + "|");
					let to = frag.split("to");
					console.log("to", "|" + to + "|");
					loopCondition = `${varname} <= ${to[1].substring(0,to[1].length-2)}`;
					frag = `${varname} = ${varname} + 1)`;
					// loopCondition = 
					forLoopArgument = 2;

					let loopInit = new Block(Block.operation);
					loopInit.deepth = deepth;
					loopInit.value = to[0];
					currentBlock.addChild(loopInit);
					currentBlock = loopInit;
				} else {
					let openBracketIndex = frag.indexOf("(");
					if(openBracketIndex != -1) {
						frag = frag.substring(openBracketIndex+1);
						forLoopArgument = 0;
					}
				}
			}

			for (let prefix of hiddenPrefixes) {
				if(frag.startsWith(prefix)) {
					frag = frag.substring(prefix.length);
					break;
				}
			}
			
			let block = undefined;

			for (let pf of printFunc) {
				if(frag.startsWith(pf.name)) {
					block = new Block(Block.io);
					frag = pf.format(frag);
					break;
				}
			}

			if(forLoopArgument == 2) {
				let loopOpenBracket = code.indexOf('{', i);
				if(loopOpenBracket != -1) {
					for (var j = i+1; j < loopOpenBracket; j++) {
						if(code.charAt(j) == ' ') continue;
						loopOpenBracket = -1;
						break;
					}
				}
				if(loopOpenBracket != -1) {
					let loopCloseBracket = findCloseBracket(code, loopOpenBracket);
					let lopped = code.substring(loopOpenBracket+1, loopCloseBracket);

					i = loopCloseBracket;
					forLoopArgument = -1;
	
					let loopStart = new Block(Block.loopstart);
					loopStart.deepth = deepth;
					loopStart.value = "";
					if(currentBlock.tmpParent != undefined) {
						currentBlock.tmpParent.adoptedChild = loopStart; // lol
					}
					currentBlock.addChild(loopStart);
					currentBlock = loopStart;

					currentBlock = parseBlock(currentBlock, lopped, deepth+1);
	
					let loopAction = new Block(Block.operation);
					loopAction.deepth = deepth+1;
					loopAction.value = openBracket("(" + frag);
					currentBlock.addChild(loopAction);
					currentBlock = loopAction;
	
					let loopEnd = new Block(Block.loopend);
					loopEnd.deepth = deepth;
					loopEnd.value = loopCondition;
					loopCondition = null;
					currentBlock.addChild(loopEnd);
					currentBlock = loopEnd;
	
					frag = "";
					continue;
				}
			}
			if(forLoopArgument == 1) {
				loopCondition = frag;
				frag = "";
				forLoopArgument++;
				continue;
			}
			
			if(frag.startsWith("return")) {
				block = new Block(Block.end);
			}

			if(block == undefined) block = new Block(Block.operation);
			
			block.deepth = deepth;
			block.setValue(frag);

			if(currentBlock.tmpParent != undefined) {
				currentBlock.tmpParent.adoptedChild = block; // lol
			}
			currentBlock.addChild(block);
			currentBlock = block;

			frag = "";

			if(forLoopArgument >= 0) forLoopArgument++;

			continue;
		}
		if(char == ' ' && (frag == "" || frag.endsWith(" "))) continue;
		if(char == '}') continue;
		for (let prefix of hiddenPrefixes) {
			if(frag == prefix) {
				frag = "";
				break;
			}
		}
		frag = frag + char;
		if(frag.indexOf("#include") != -1) {
			frag = "";
			for(; i < code.length; i++) {
				if(code.charAt(i) == '>') {
					break;
				}
			}
		}
	}
	return currentBlock;
}

function openBracket(str) {
	// console.log(`openBracket for "${str}"`);
	if(str.endsWith(" ")) return openBracket(str.substring(0,str.length-1));
	if(str.startsWith(" ")) return openBracket(str.substring(1));
	if(str.startsWith("(") && str.endsWith(")")) return openBracket(str.substring(1,str.length-1));
	return str;
}

function noSpaces(str) {
	let s = "";
	let isLastSpace = true;
	for (var i = 0; i < str.length; i++) {
		if(str.charAt(i) == ' ') {
			if(!isLastSpace) s+=" ";
			isLastSpace = true;
			continue;
		}
		isLastSpace = false;
		s += str.charAt(i);
	}
	return s;
}

function findCloseBracket(code, from) {
	let open = code.charAt(from);
	let close = null;
	if(open == '{') close = '}';
	if(open == '[') close = ']';
	if(open == '(') close = ')';
	if(close == null) console.err("Open bracket is wrong");

	let deepth = 1;
	
	for (var i = from+1; i < code.length; i++) {
		if(code.charAt(i) == open) deepth++;
		if(code.charAt(i) == close) {
			 deepth--;
			 if(deepth == 0) return i;
		}
	}
	return from;
}


export default EditorState;