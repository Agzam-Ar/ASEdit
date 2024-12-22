import Node from './node';
import EditorState from '../../vars';

class Parser {

	// TODO: fix for
	
	constructor() {
		this.code = "";
		this.functions = {
			input: ['scanf', 'readln', 'read'],
			output: ['printf', 'writeln', "println", 'write', "print"],
			clear: ['cls', 'clear'],
		};
		this.loopId = 1;
	}

	subparse(tokens, currentNode, tokenIndex, tokenTypeBreaker) {
		let $indexes = {tokenStart:tokenIndex};
		this.parse(tokens, currentNode, $indexes, tokenTypeBreaker);
		return $indexes.tokenEnd+1;
	}

	parse(tokens, parent=new Node(), indexes={tokenStart: 0}, tokenTypeBreaker=null, parseType='default') {
		let program = {
			nodes: []
		};

		// if(tokenTypeBreaker == null) this.log('parent', parent.children.length);

		let currentNode = parent;

		let token = null;
		let tokenIndex = indexes.tokenStart;

		// this.log('parsing', tokens.length, 'tokens from', tokenIndex);
	
		const setTokenIndex = i => {
			tokenIndex = i;
			indexes.tokenEnd = i-1;
		}

		const getNextToken = () => {
			if(tokenIndex >= tokens.length) return null;
			return tokens[tokenIndex];
		}

		const nextToken = () => {
			if(tokenIndex >= tokens.length) return null;
			// token = tokens[tokenIndex++];
			indexes.tokenEnd = tokenIndex;
			return tokens[tokenIndex++];
		}

		let varribleType = ""; // last vartype name
		// let usedVarNames = {}; // map of used names of vars on current deepth, used to ignore 


		while(true) {
			let token = nextToken();
			if(token == null) break;
			// if(tokenTypeBreaker == 'semi') this.log('semitok', token.value);
			
			if(token.type == 'comment') {
				// console.log(`setting comment "${token.value}" to`, currentNode);
				if(token.value != "") currentNode.comment = token.value;
				continue;
			}
			if(token.type == 'typename') {
				varribleType += token.value + " ";
				continue;
			}
			if(token.type == tokenTypeBreaker) {
				break;
			}
			/**
			 * ============ IF ============
			 * if(<arg1>)
			 * 		<runnable>
			 * ============================
			 * if <arg1> then
			 * 		<runnable>
			 * ============================
			 */
			if(token.type == 'if') { // if (...) ...
				currentNode = new Node('condition');
				let lpar = nextToken();
				let conditions = [];
				if(lpar == null) break;
				if(lpar.type != 'lpar') {
					// Pascal variation
					conditions.push(lpar);
					while(true) {
						let tvalue = nextToken();
						if(tvalue == null) break;
						if(tvalue.type == 'then') break;
						conditions.push(tvalue);
					}
				} else {
					let deepth = 0;
					while(true) {
						let tvalue = nextToken();
						if(tvalue == null) break;
						if(tvalue.type == 'lpar') deepth++;
						if(tvalue.type == 'rpar') {
							// this.log('deepth', deepth);
							if(deepth == 0) break;
							deepth--;
						}
						conditions.push(tvalue);
					}
				}
				
				currentNode.value = (conditions.length == 1 && conditions[0].type) ? conditions[0].value : this.formatTokens(conditions);

				let conditionBodyStart = nextToken();
				if(conditionBodyStart == null) break;
				if(conditionBodyStart.type == 'then') {
					this.log("Skipping then")
					conditionBodyStart = nextToken();
					this.log("Next token", conditionBodyStart);
					if(conditionBodyStart == null) break;
				}
				
				if(conditionBodyStart.type == 'lbrace') {
					let $indexes = {tokenStart:tokenIndex};
					this.parse(tokens, currentNode, $indexes, "rbrace");
					setTokenIndex($indexes.tokenEnd+1);
				} else { // FIXME
					let $indexes = {tokenStart:tokenIndex-1};
					this.parse(tokens, currentNode, $indexes, "semi");
					setTokenIndex($indexes.tokenEnd+1);
					this.log("Parsed", currentNode);
				}
				currentNode.thenTrue = currentNode.children;

				// this.log('if', currentNode.children);
				
				let elseKeywordToken = getNextToken();
				// this.log('elseKeywordToken', elseKeywordToken.type);
				if(elseKeywordToken != null && elseKeywordToken.type == 'else') {
					// this.log('is else', elseKeywordToken.type);
					currentNode.children = [];
					// this.log('else', elseKeywordToken.type);
					nextToken();
					conditionBodyStart = nextToken();
					// this.log('conditionBodyStart:', conditionBodyStart);
					// this.log('nextIndex:', getNextToken());
					if(conditionBodyStart == null) break;
					if(conditionBodyStart.type == 'lbrace') {
						let $indexes = {tokenStart:tokenIndex};
						this.parse(tokens, currentNode, $indexes, "rbrace");
						setTokenIndex($indexes.tokenEnd+1);
					} else { // FIXME
						let $indexes = {tokenStart:tokenIndex-1};
						this.parse(tokens, currentNode, $indexes, "semi");
						setTokenIndex($indexes.tokenEnd+1);
					}
					currentNode.thenFalse = currentNode.children;
				}
				parent.addChild(currentNode);
				continue;
			}






			/**
			 * =========== FOR ===========
			 * for(<arg1>;<arg2>;<arg3>)
			 * 		<runnable>
			 * ===========================
			 * for <arg1> to <arg2> do
			 * 		<runnable>
			 * ===========================
			 */
			if(token.type == 'for') {
				let lpar = nextToken();
				if(lpar == null) break;
				if(lpar.type != 'lpar') { 
					let ti = tokenIndex;
					let varTokens = [lpar];
					let vtoken = null;
					while(true) {
						vtoken = nextToken();
						// this.log('vtoken', vtoken, vtoken.type);
						if(vtoken == null) break;
						if(vtoken.type == 'to') break;
						varTokens.push(vtoken);
					}
					if(vtoken == null) {
						this.error('цикл должен иметь "(" ' + varTokens.type, lpar);
						continue;
					}
					let resultTokens = [];
					vtoken = null;
					while(true) {
						vtoken = nextToken();
						// this.log('vtoken', vtoken);
						if(vtoken == null) break;
						if(vtoken.type == 'do') break;
						resultTokens.push(vtoken);
					}
					if(vtoken == null) {
						this.error('цикл ожидалось "do"', lpar);
						continue;
					}

					if(EditorState.prefs.$get("noLoop") != 0) { // loop using "if"
						let loopFrom = new Node('operation');
						loopFrom.value = "";
						for(let t of varTokens) loopFrom.value += (loopFrom.value.length == 0 ? '':' ') + t.value;
						let loopIterator = new Node('operation');
						loopIterator.value = `${lpar.value} = ${lpar.value} + 1`;
	
						let loopCondition = new Node('loopcondition');
						loopCondition.value = `${lpar.value} \u2264`;
						for(let t of resultTokens) loopCondition.value += ' ' + t.value;
	
						// this.parse(varTokens, loopFrom, undefined, null, 'forArguments');
						
						vtoken = nextToken();
						if(vtoken.type == 'lbrace') {
							setTokenIndex(this.subparse(tokens, loopCondition, tokenIndex, "rbrace"));
						} else { // FIXME
							setTokenIndex(this.subparse(tokens, loopCondition, tokenIndex-1, "semi"));
						}
						loopCondition.thenTrue = loopCondition.children;
						loopCondition.thenTrue.push(loopIterator);
	
						parent.addChild(loopFrom);
						let outerCondition = new Node('condition');
						outerCondition.value = loopCondition.value;
						outerCondition.thenTrue = [loopCondition];
						parent.addChild(outerCondition);
						this.log(currentNode);
						currentNode = outerCondition;
					} else {
						let loopFrom = new Node('operation');
						loopFrom.value = "";
						for(let t of varTokens) loopFrom.value += (loopFrom.value.length == 0 ? '':' ') + t.value;
						let loopIterator = new Node('operation');
						loopIterator.value = `${lpar.value} = ${lpar.value} + 1`;
	
						let loopname = `Цикл ${this.loopId++}`;
						let loopBegin = new Node('loopbegin');
						loopBegin.name = loopname;
						parent.addChild(loopBegin);
						loopBegin.value = `${lpar.value} >`;
						for(let t of resultTokens) loopBegin.value += ' ' + t.value;
	
						vtoken = nextToken();
						if(vtoken.type == 'lbrace') {
							setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex, "rbrace"));
						} else { // FIXME
							setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex-1, "semi"));
						}
						if(loopBegin.lastChild().hasOutArrow()) loopBegin.addChild(loopIterator);
						let loopEnd = new Node('loopend');
						loopEnd.name = loopBegin.name;

						loopBegin.end = loopEnd;
						loopBegin.skip = loopIterator;
						parent.addChild(loopEnd);
						currentNode = loopEnd;
					}
					continue;
				}
				// Searching pair of "("
				let loopArgumentsTokens = [];
				let deepth = 0;
				while(true) {
					let tvalue = nextToken();
					if(tvalue == null) break;
					if(tvalue.type == 'lpar') deepth++;
					if(tvalue.type == 'rpar') {
						if(deepth == 0) break;
						deepth--;
					}
					loopArgumentsTokens.push(tvalue);
				}

				let splittedLoopArgumentsTokens = [[]];
				for (let token of loopArgumentsTokens) {
					if(token.type == 'semi') {
						splittedLoopArgumentsTokens.push([]);
						continue;
					}
					splittedLoopArgumentsTokens[splittedLoopArgumentsTokens.length-1].push(token);
				}

				// @deprecated let loopArguments = new Node('tmp');
				// @deprecated this.parse(loopArgumentsTokens, loopArguments, undefined, null, 'forArguments');
				if(splittedLoopArgumentsTokens.length != 3) {//if(loopArguments.children.length != 3) {
					this.error('"for" цикл должен иметь 3 аргумента, имеется: ' + splittedLoopArgumentsTokens.length, token);//loopArguments.children.length, token);
					continue;
				}
				let tmp = new Node('tmp');
				this.parse(splittedLoopArgumentsTokens[0], tmp, undefined, null, 'forArguments');
				this.parse(splittedLoopArgumentsTokens[2], tmp, undefined, null, 'forArguments');
				let loopInitor = tmp.children[0];
				let loopIterator = tmp.children[1];
				// if(loopInitor == undefined) {//if(loopArguments.children.length != 3) {
				// 	this.error('первый аргумент "for" не может быть пустым: ' + splittedLoopArgumentsTokens.length, token);//loopArguments.children.length, token);
				// 	continue;
				// }

				if(loopInitor != undefined) {
					currentNode = loopInitor;//loopArguments.children[0];
					parent.addChild(currentNode);
				}
				
				if(EditorState.prefs.$get("noLoop") != 0) { // loop using "if"
					let conditions = new Node('condition');
					conditions.value = this.formatTokens(splittedLoopArgumentsTokens[1]);
					conditions.thenTrue = [];
					currentNode = new Node('weh');
					currentNode.value = "";
					let conditionBodyStart = nextToken();
					currentNode = conditions;//new Node('condition');
					if(conditionBodyStart == null) break;
					if(conditionBodyStart.type == 'lbrace') {
						setTokenIndex(this.subparse(tokens, currentNode, tokenIndex, "rbrace"));
					} else {
						setTokenIndex(this.subparse(tokens, currentNode, tokenIndex-1, "semi"));
					}
					currentNode.thenTrue = currentNode.children;
					if(loopIterator != undefined) conditions.addChild(loopIterator);//loopArguments.children[2]);
					let outerCondition = new Node('condition');
					outerCondition.value = conditions.value;
					outerCondition.thenTrue = [conditions];
					parent.addChild(outerCondition);
					currentNode = outerCondition;
				} else {
					let conditionBodyStart = nextToken();
					let loopname = `Цикл ${this.loopId++}`;
					let loopBegin = new Node('loopbegin');
					// TODO: better reverse of condition
					loopBegin.value = `не (${this.formatTokens(splittedLoopArgumentsTokens[1])})`;
					// @deprecated loopBegin.value = `не (${loopArguments.children[1].value})`;
					loopBegin.name = loopname;
					parent.addChild(loopBegin);
					if(conditionBodyStart == null) break;
					if(conditionBodyStart.type == 'lbrace') {
						setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex, "rbrace"));
					} else {
						setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex-1, "semi"));
					}
					if((loopIterator != undefined) && (loopBegin.lastChild() == undefined || loopBegin.lastChild().hasOutArrow())) loopBegin.addChild(loopIterator);//loopArguments.children[2]);
					let loopEnd = new Node('loopend');
					loopBegin.end = loopEnd;
					loopBegin.skip = loopIterator == undefined ? loopEnd : loopIterator;
					loopEnd.name = loopname;
					parent.addChild(loopEnd);
					currentNode = loopEnd;
				}
				continue;
			}






			/**
			 * ========== WHILE ==========
			 * while(<arg1>)
			 * 		<runnable>
			 * ===========================
			 * while <arg1> do
			 * 		<runnable>
			 * ===========================
			 */
			if(token.type == 'while') {
				let lpar = nextToken();
				if(lpar == null) break;
				if(lpar.type != 'lpar') { 
					let ti = tokenIndex;
					let varTokens = [lpar];
					let vtoken = null;
					while(true) {
						vtoken = nextToken();
						// this.log('vtoken', vtoken, vtoken.type);
						if(vtoken == null) break;
						if(vtoken.type == 'do') break;
						varTokens.push(vtoken);
					}
					if(vtoken == null) {
						this.error('цикл должен иметь "(" ' + varTokens.type, lpar);
						continue;
					}
					if(EditorState.prefs.$get("noLoop") != 0) { // loop using "if"
						let loopCondition = new Node('loopcondition');
						loopCondition.value = this.formatTokens(varTokens);
	
						vtoken = nextToken();
						if(vtoken.type == 'lbrace') {
							setTokenIndex(this.subparse(tokens, loopCondition, tokenIndex, "rbrace"));
						} else { // FIXME
							setTokenIndex(this.subparse(tokens, loopCondition, tokenIndex-1, "semi"));
						}
						loopCondition.children = loopCondition.children;
						let outerCondition = new Node('condition');
						outerCondition.value = loopCondition.value;
						outerCondition.thenTrue = [loopCondition];
						parent.addChild(outerCondition);
						currentNode = outerCondition;
					} else {
						let loopBegin = new Node('loopbegin');
						loopBegin.name = `Цикл ${this.loopId++}`;
						loopBegin.value = `не ${this.formatTokens(varTokens)}`;
						parent.addChild(loopBegin);
	
						vtoken = nextToken();
						if(vtoken.type == 'lbrace') {
							setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex, "rbrace"));
						} else { // FIXME
							setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex-1, "semi"));
						}
						let loopEnd = new Node('loopend');
						loopEnd.name = loopBegin.name;
						loopBegin.end = loopEnd;
						loopBegin.skip = loopEnd;
						parent.addChild(loopEnd);
						currentNode = loopEnd;
					}
					continue;
				}
				// Searching pair of "("
				let loopArgumentsTokens = [];
				let deepth = 0;
				while(true) {
					let tvalue = nextToken();
					if(tvalue == null) break;
					if(tvalue.type == 'lpar') deepth++;
					if(tvalue.type == 'rpar') {
						if(deepth == 0) break;
						deepth--;
					}
					loopArgumentsTokens.push(tvalue);
				}
				
				if(EditorState.prefs.$get("noLoop") != 0) { // loop using "if"
					let loopCondition = new Node('loopcondition');
					loopCondition.value = this.formatTokens(loopArgumentsTokens);
					
					let vtoken = nextToken();
					if(vtoken.type == 'lbrace') {
						setTokenIndex(this.subparse(tokens, loopCondition, tokenIndex, "rbrace"));
					} else { // FIXME
						setTokenIndex(this.subparse(tokens, loopCondition, tokenIndex-1, "semi"));
					}
					loopCondition.children = loopCondition.children;
					let outerCondition = new Node('condition');
					outerCondition.value = loopCondition.value;
					outerCondition.thenTrue = [loopCondition];
					parent.addChild(outerCondition);
					currentNode = outerCondition;
				} else {
					let loopBegin = new Node('loopbegin');
					loopBegin.name = `Цикл ${this.loopId++}`;
					loopBegin.value = `не ${this.formatTokens(loopArgumentsTokens)}`;
					parent.addChild(loopBegin);

					let vtoken = nextToken();
					if(vtoken.type == 'lbrace') {
						setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex, "rbrace"));
					} else { // FIXME
						setTokenIndex(this.subparse(tokens, loopBegin, tokenIndex-1, "semi"));
					}

					let loopEnd = new Node('loopend');
					loopEnd.name = loopBegin.name;
					loopBegin.end = loopEnd;
					loopBegin.skip = loopEnd;
					parent.addChild(loopEnd);
					currentNode = loopEnd;
					// loopCondition.children = loopCondition.children;
					// let outerCondition = new Node('condition');
					// outerCondition.value = loopCondition.value;
					// outerCondition.thenTrue = [loopCondition];
					// parent.addChild(outerCondition);
					// currentNode = outerCondition;
				}
				continue;
			}
			if(token.type == 'break') {
				currentNode = new Node('break');
				currentNode.value = "break";
				parent.addChild(currentNode);
				let semi = nextToken();
				if(semi.type != 'semi') {
					this.error('ожидалось ";"', token);
				}
				if(tokenTypeBreaker == 'semi') break;
				continue;
			}
			if(token.type == 'continue') {
				currentNode = new Node('continue');
				currentNode.value = "continue";
				parent.addChild(currentNode);
				let semi = nextToken();
				if(semi.type != 'semi') {
					this.error('ожидалось ";"', token);
				}
				if(tokenTypeBreaker == 'semi') break;
				continue;
			}
			if(token.type == 'return') {
				currentNode = new Node('end');
				parent.addChild(currentNode);
				let semi = null;
				let returnTokens = [];
				while(true) {
					semi = nextToken();
					if(semi == null || semi.type == 'semi') break;
					returnTokens.push(semi);
				}
				currentNode.returnTokens = returnTokens;
				if(semi == null) {
					this.error('ожидалось ";"', token);
				}
				if(tokenTypeBreaker == 'semi') break;
				continue;
			}
			if(token.type == 'annotation') {
				let type = token.value;
				let node = null;
				if(type == 'data') node = new Node('data');
				if(type == 'process') node = new Node('operation');
				if(type == 'terminator') node = new Node('terminator');
				if(type == 'method') {
					node = new Node('operation');
					node.shape = Node.shapeFunction;
				}
				if(type == 'loop') node = new Node('loopbegin');
				
				if(node == null) {
					this.error(`неизвестный тип блока "${type}"`);
					break;
				}
				node.value = "";

				let lpar = nextToken();
				if(lpar == null || lpar.type != 'lpar') {
					this.error(`ожидалось "("`);
					break;
				}
				let args = [];

				while(true) { // reading arguments: ("a", "b", "c")
					let str = nextToken();
					if(str == null || str.type != 'string') {
						this.error(`ожидалась строка`);
						break;
					}
					args.push(str.value);
					let comma = getNextToken();
					if(comma == null || comma.type != 'comma') {
						break;
					}
					nextToken(); // skip comma
				}
				node.value = args[0] || "";
				let rpar = nextToken();
				if(rpar == null || rpar.type != 'rpar') {
					this.error(`ожидалось ")"`);
					break;
				}
				if(type == 'loop') {
					let lbrace = nextToken();
					if(lbrace == null || lbrace.type != 'lbrace') {
						this.error(`ожидалось "{"`);
						break;
					}
					node.name = node.value;
					node.value = args[1] || "";
					currentNode = node;
					setTokenIndex(this.subparse(tokens, currentNode, tokenIndex, "rbrace"));
					parent.addChild(currentNode);
					let loopend = new Node('loopend');
					loopend.name = node.name;
					loopend.value = args[2] || "";
					parent.addChild(loopend);
					currentNode = loopend;
					continue;
				}
				let semi = nextToken();
				if(semi == null || semi.type != 'semi') {
					this.error(`ожидалось ";"`);
					break;
				}
				currentNode = node;
				parent.addChild(currentNode);
				continue;
			}
			if(token.type == 'var') {
				let token2 = nextToken();
				if(token2 == null) break;
				let varname = token.value;
				let vartype = varribleType;
				let isPointless = true;
				varribleType = "";
				if(token2.type == 'period' || token2.type == 'lambda') {
					let subname = nextToken();
					varname += '.' + subname.value;
					token2  = nextToken();
				}
				if(token2.type == 'lbrack') {
					let rbrack = null;
					let bracks = [token2];
					while(true) {
						rbrack = nextToken();
						if(rbrack == null || rbrack.type == 'rbrack') break;
						bracks.push(rbrack);
					}
					if(rbrack == null) {
						this.error(`ожидалось "]"`, token2);
						break;
					}
					bracks.push(rbrack);
					if(bracks.length != 2) varname += this.formatTokens(bracks);
					token2 = nextToken();
					isPointless = false;
				}
				if(token2.type == 'equals' || token2.type == 'increment'  || token2.type == 'decrement'
					|| token2.type == 'add' || token2.type == 'subtract'
					|| token2.type == 'multiply' || token2.type == 'divide') { // varriable = ...
					currentNode = new Node('operation');
					let args = [];
					while(true) {
						let tvalue = nextToken();
						if(tvalue == null || tvalue.type == 'semi') break;
						args.push(tvalue);
					}
					// let semi = nextToken();
					// if(semi.type != 'semi') {
						// console.error(`expected ';' at ${semi.index} current token ${semi.type}:${this.code.substring(this.code.lastIndexOf('\n', semi.index), this.code.indexOf('\n', semi.index))}`);
					// }
					// this.log('var', args);
					if(args.length == 1) {
						currentNode.value = args[0].value;
					} else {
						currentNode.value = this.formatTokens(args);
					}
					if(token2.type == 'equals') {
						currentNode.value = varname + " = " + currentNode.value;
					}
					if(token2.type == 'increment') {
						currentNode.value = `${varname} = ${varname} + 1 ` + currentNode.value;
					}
					if(token2.type == 'decrement') {
						currentNode.value = `${varname} = ${varname} - 1 ` + currentNode.value;
					}
					if(token2.type == 'add') currentNode.value = `${varname} = ${varname} + ` + currentNode.value;
					if(token2.type == 'subtract') currentNode.value = `${varname} = ${varname} - (${currentNode.value})`;
					if(token2.type == 'multiply') currentNode.value = `${varname} = (${varname}) * (${currentNode.value})`;
					if(token2.type == 'divide') currentNode.value = `${varname} = (${varname}) / (${currentNode.value})`;

					currentNode.tokens = args;

					if(EditorState.prefs.$get("showVartypes")) {
						currentNode.value = vartype + currentNode.value;
					}
					// this.log('var =', token.value, args);
					parent.addChild(currentNode);
					if(tokenTypeBreaker == 'semi') break;
					continue;
				} else if(token2.type == 'lpar') {
					// if "(" has data type it means that its declaration of function (some trick: i use "function" keyword as datatype for easy mixing of langs)
					if(vartype == "" || vartype == " ") { // function call: "function(...)"
						currentNode = new Node('function');
						let args = [];
						while(true) {
							let arg = nextToken();
							if(arg.type == 'amp') continue; // no ponters in scheme 
							if(arg == null || arg.type == 'rpar') break;
							args.push(arg);
						}
	
						if(args.length == 1) {
							currentNode.value = args[0].value;
						} else {
							// this.log(args);
							currentNode.value = "";
							let first = true;
							for (let a of args) {
								if(first && (a.type == 'string' || a.type == 'comma')) continue;
								if(currentNode.value.length != 0 && a.type != 'comma') currentNode.value += " ";
								currentNode.value += a.value;
								first = false;
							}
							currentNode.value = this.formatTokens(args, 'output');
						}
						currentNode.args = args;
	
						currentNode.name = token.value;
						if(this.functions.input.includes(token.value)) {
							currentNode.shape = Node.shapeData;
							currentNode.value = "ввод " + currentNode.value;
						} else if(this.functions.output.includes(token.value)) {
							currentNode.shape = Node.shapeData;
							currentNode.value = "вывод " + currentNode.value;
						} else if(token.value == 'system' && args.length == 1 && this.functions.clear.includes(args[0].value)) {
							currentNode.shape = Node.shapeData;
							currentNode.value = "очистить консоль";
						} else {
							currentNode.shape = Node.shapeFunction;
							currentNode.value = `${token.value}(${currentNode.value})`;
						}
						// this.log('function:', token.value, args.length);
	
						let semi = getNextToken();
						parent.addChild(currentNode);
						if(semi == null) {
							this.warn(`отсутствует ';' у функции`, token);
							break;
						}
						if(semi.type != 'semi') {
							this.warn(`отсутствует ';' у функции`, token);
						} else {
							nextToken();
						}
						if(tokenTypeBreaker == 'semi') break;
						continue;
					}
					// function declaration: "<type> function(...) {...}"
					if(tokenTypeBreaker == 'semi') this.log("semitok deffunc: ", token, parent);

					let funcNode = new Node('subprogramm');
					funcNode.name = token.value;
					let args = [];
					while(true) {
						let arg = nextToken();
						if(arg == null || arg.type == 'rpar') break;
						args.push(arg);
					}
					nextToken();
					// this.log("nextfunctok: ", getNextToken());

					let funcStart = new Node('start');
					funcNode.addChild(funcStart);
					args = args.filter(arg => arg.type != 'typename');
					funcStart.value = token.value == 'main' ? `начало` : `${token.value}(${this.formatTokens(args)})`;

					// this.log("args: ", args);
					
					setTokenIndex(this.subparse(tokens, funcNode, tokenIndex, "rbrace"));
					

					if(funcNode.lastChild() == undefined) {
						currentNode = funcNode;
					} else {
						let ends = [];
						if(token.value != 'main') {
							funcNode.eachChild(c => {
								if(c.type == 'end') {
									if(c.returnTokens.length > 0) {
										let returnData = new Node('data');
										returnData.shape = Node.shapeData;
										returnData.value = `возврат ${this.formatTokens(c.returnTokens)}`;
										ends.push(c.parent);
										c.parent.replaceChild(c, returnData);
									}
									c.value = token.value;
								}
							});
						}
						for (let e of ends) {
							let endNode = new Node('end');
							if(token.value != 'main') {
								endNode.value = token.value;
							}
							e.addChild(endNode);
						}

						currentNode = funcNode.lastChild();
						if(funcNode.lastChild().type != 'end') {
							let endNode = new Node('end');
							if(token.value != 'main') {
								endNode.value = token.value;
							}
							funcNode.addChild(endNode);
						}
						parent.addChild(funcNode);
					}
					continue;
				} else if(token2.type == 'lbrack') {
					let args = [];
					while(true) {
						let tvalue = nextToken();
						if(tvalue == null || tvalue.type == 'semi') break;
						args.push(tvalue);
					}
				} else if(parseType == 'forArguments') {
					currentNode = new Node('loopcondition');
					let conditions = [token, token2];
					while(true) {
						let tvalue = nextToken();
						if(tvalue == null || tvalue.type == 'semi') break;
						conditions.push(tvalue);
					}
					currentNode.value = this.formatTokens(conditions);
					parent.addChild(currentNode);
					continue;
				} else if(token2.type == 'semi') {
					currentNode = new Node('operation');
					parent.addChild(currentNode);
					if(EditorState.prefs.$get("showVartypes")) {
						currentNode.value = vartype + varname;
					} else {
						currentNode.value = varname;
						if(isPointless) this.warn(`Бессмысленное выражение:\nвозможно ты забыл включить отображение типов в настройках`, token);
					}
					continue;
				}
				this.warn(`Неожиданная конструкция "${token2.value}" `, token);
				continue;
			}
			if(token.type == 'semi') {
				this.warn('Лишнее ";"', token);
				continue;
			}
			if(token.type == 'lbrace') {
				currentNode = new Node('group');
				this.log('group next', getNextToken());
				setTokenIndex(this.subparse(tokens, currentNode, tokenIndex, "rbrace"));
				parent.addChild(currentNode);
				// if(EditorState.prefs.$get("showVartypes")) {
				// 	currentNode.value = vartype + varname;
				// } else {
				// 	currentNode.value = varname;
				// 	if(isPointless) this.warn(`Бессмысленное выражение:\nвозможно ты забыл включить отображение типов в настройках`, token);
				// }
				continue;
			}
			this.error(`Неожиданная конструкция "${token.value}" `, token);

			break;
		}

		return tokens;
	}

	formatTokens(tokens, mode="default") {
		if(tokens.length == 1) return tokens[0].type == 'string' ? `"${tokens[0].value}"` : tokens[0].value;
		let str = "";
		// let buffer = "";
		let needSpace = false;
		let isFirst = true;
		const consumeSpace = () => {
			if(str.charAt(str.length-1) == ' ') {
				str = str.substring(0, str.length-1);
			}
		};
		for (let t of tokens) {
			if(mode=='output') {
				if(isFirst && (t.type == 'string' || t.type == 'comma')) continue;
			}
			if(t.type == 'and' || t.type == 'or' || t.type == 'percnt' || t.type == 'lt' || t.type == 'ge' || t.type == 'equals' || t.type == 'ne') needSpace = true;
			if(needSpace) str += " ";
			needSpace = true;
			if(t.type == 'and') {
				str += "и";
				continue;
			}
			if(t.type == 'or') {
				str += "или";
				continue;
			}
			if(t.type == 'ne') {
				str += "\u2260";
				continue;
			}
			if(t.type == 'ge') {
				str += "\u2265";
				continue;
			}
			if(t.type == 'le') {
				str += "\u2264";
				continue;
			}
			if(t.type == 'isequals') {
				str += "=";
				continue;
			}
			if(t.type == 'lambda' || t.type == 'period') {
				consumeSpace();
				str += ".";
				needSpace = false;
				continue;
			}
			if(str.charAt(str.length-1) == ' ') {
				if(t.type != 'equals' && t.type != 'isequals') {
					if(t.type == 'lbrack' || t.type == 'rbrack' || t.type == 'comma' || t.type == 'rpar') {
						consumeSpace();
					}
				}
			}
			if(t.type == 'lbrack' || t.type == 'rbrack' || t.type == 'lpar' || t.type == 'rpar' || t.type == 'lambda') needSpace = false;
			str += t.value;
			isFirst = false;
		}
		return str;
	}


	log() {
		console.log('%c[PARSER]', "color: #7F7FFF; font-style: bold; padding: 2px; background: #333", ...arguments);
	}

	error(text, token=null) {
		let index = token == null ? null : token.index;
		let endIndex = token == null ? null : token.endIndex;
		EditorState.errors.push({
			type: "error",
			text: text,
			index: index,
			endIndex: endIndex,
		});
		let start = this.code.lastIndexOf('\n', index-1);
		let end = this.code.indexOf('\n', index+1);
		if(end == -1) end = this.code.length;
		// FF6347 FF3826
		console.log('%c[PARSER-ERROR]', "color: #FF6347; font-style: bold; padding: 2px; background: #333", 
			text, index == null ? '' : '\n' + this.code.substring(start+1, end));
	}

	warn(text, token=null) {
		let index = token == null ? null : token.index;
		let endIndex = token == null ? null : token.endIndex;
		EditorState.errors.push({
			type: "warn",
			text: text,
			index: index,
			endIndex: endIndex,
		});

		let start = this.code.lastIndexOf('\n', index-1);
		let end = this.code.indexOf('\n', index+1);
		if(end == -1) end = this.code.length;
		console.warn('%c[PARSER-WARN]', "color: #FFBE00; font-style: bold; padding: 2px; background: #333", 
			text, index == null ? '' : '\n' + this.code.substring(start+1, end));
	}

}


export default Parser