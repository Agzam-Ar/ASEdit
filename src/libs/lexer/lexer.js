
const Character = {
	
	isDigit: c => /^\d+$/.test(c),
	isAlphabetic: c => c == '_' || /^[A-Z]$/i.test(c),
	isAlphabeticName: c => Character.isDigit(c) || Character.isAlphabetic(c),
	isSpace: c => /\s/.test(c),
};

class Lexer {
	
	constructor(props) {
		this.symbols = {};
		this.keywords = {};
		this.blocks = {};
		this.typekeywords = {};
		this.multiSymbols = [];
		this.linecomment = '//';
		this.putSymbol('{', 'lbrace');
		this.putSymbol('}', 'rbrace');
		this.putSymbol('[', 'lbrack');
		this.putSymbol(']', 'rbrack');
		this.putSymbol('=', 'equals');
		this.putSymbol(';', 'semi');
		this.putSymbol('(', 'lpar');
		this.putSymbol(')', 'rpar');
		this.putSymbol('+', 'plus');
		this.putSymbol('-', 'minus');
		this.putSymbol('*', 'ast');
		this.putSymbol('&', 'amp');
		this.putSymbol('|', 'vert');
		this.putSymbol('/', 'sol');
		this.putSymbol('<', 'lt');
		this.putSymbol('>', 'gt');
		this.putSymbol(',', 'comma');
		this.putSymbol('!', 'excl');
		this.putSymbol('%', 'percnt');
		this.putSymbol('.', 'period');

		this.putMultiSymbol('&&', 'and');
		this.putMultiSymbol('||', 'or');
		this.putMultiSymbol('++', 'increment');
		this.putMultiSymbol('--', 'decrement');
		this.putMultiSymbol('+=', 'add');
		this.putMultiSymbol('-=', 'subtract');
		this.putMultiSymbol('*=', 'multiply');
		this.putMultiSymbol('/=', 'divide');
		this.putMultiSymbol('<=', 'le');
		this.putMultiSymbol('>=', 'ge');
		this.putMultiSymbol('<>', 'ne');
		this.putMultiSymbol('!=', 'ne');
		this.putMultiSymbol('==', 'isequals');
		this.putMultiSymbol('<<', 'lshiftbits');
		this.putMultiSymbol('>>', 'rshiftbits');
		this.putMultiSymbol('->', 'lambda');


		this.putKeyword('if', 'if');
		this.putKeyword('else', 'else');
		this.putKeyword('do', 'do');
		this.putKeyword('while', 'while');
		this.putKeyword('for', 'for');
		this.putKeyword('return', 'return');
		this.putKeyword('break', 'break');
		this.putKeyword('continue', 'continue');

		this.putBlock('@data', '@data');
		this.putBlock('@process', '@process');
		this.putBlock('@loop', '@loop');
		this.putBlock('@method', '@method');

		this.putTypeKeyword('void', 'void');
		this.putTypeKeyword('int', 'int');
		this.putTypeKeyword('double', 'double');
		this.putTypeKeyword('float', 'float');
		this.putTypeKeyword('long', 'long');
		this.putTypeKeyword('char', 'char');
		this.putTypeKeyword('unsigned', 'unsigned');
		this.putTypeKeyword('boolean', 'boolean');
		this.putTypeKeyword('function', 'function'); // magic trick for easy detecting of function declarating
		this.putTypeKeyword('procedure', 'procedure'); // magic trick for easy detecting of function declarating


		this.putKeyword('begin', 'lbrace');
		this.putKeyword('to', 'to');
		this.putKeyword('do', 'do');
		this.putKeyword('end', 'rbrace');
		this.putKeyword('then', 'then');
	}
	
	putSymbol(symbol, name) {
		this.symbols[symbol.charCodeAt(0)] = name;
	}

	putMultiSymbol(symbol, name) { // todo: raplce by array to use += -= and etc
		this.multiSymbols.push({value:symbol,name:name});
	}

	putKeyword(keyword, name) {
		this.keywords[keyword] = name;
	}

	putBlock(keyword, name) {
		this.blocks[keyword] = name;
	}

	putTypeKeyword(typekeyword, name) {
		this.typekeywords[typekeyword] = name;
	}

	parse(code) {
		this.log('parsing', code.length, 'chars');
		this.code = code;
		this.inputIndex = 0;
		this.char = " ";
		
		let tokens = [];
		while(true) {
			let token = this.nextToken();
			if(token == null) break;
			// this.log('token:', JSON.stringify(token));
			tokens.push(token);
		}
		this.log('tokens:', tokens);
		return tokens;
	}

	log() {
		// console.log('%c[LEXER]', "color: #FF7F7F; font-style: bold; padding: 2px; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;", ...arguments);
		console.log('%c[LEXER]', "color: #7FFF7F; font-style: bold; padding: 2px; background: #333", ...arguments);
	}

	nextChar() {
		this.char = this.code.charAt(this.inputIndex++);
		this.charCode = this.char.charCodeAt(0);
		return this.char;
	}

	nextStartsWith(prefix) {
		for (var i = 0; i < prefix.length; i++) {
			if(this.code.charAt(i + this.inputIndex - 1) != prefix.charAt(i)) return false;
		}
		return true;
	}

	nextToken() {
		// this.value = "";
		let token = {
			type: undefined,
			index: this.inputIndex,
		};
		while (token.type == undefined) {
			if(this.char == '') return null;
			if (Character.isSpace(this.char)) { // is space
				this.nextChar();
				token.index = this.inputIndex;
			} else if (this.nextStartsWith(this.linecomment)) {
				this.inputIndex += this.linecomment.length-1;
				this.nextChar();
				
				token.type = 'comment';
				token.value = '';
				while (this.char != '\n' && this.char != '') {
					token.value += this.char;
					this.nextChar();
				}
			// } else if(this.char == this.linecomment.charAt(0)) {
				// let isComment = true;
				// for (var i = 1; i < this.linecomment.length; i++) {
				// 	if(this.nextChar() == this.linecomment.charAt(i)) continue;
				// 	isComment = false;
				// 	console.error('Неизвестный символ комментария: ', this.char);
				// 	break;
				// }
				// if(isComment) {
				// }
			} else if (this.symbols[this.charCode] != undefined) {
				let isMuli = false;
				for (let ms of this.multiSymbols) {
					if(this.nextStartsWith(ms.value)) {
						isMuli = true;
						token.type = ms.name;
						token.value = ms.value;
						this.inputIndex += ms.value.length-1;
						this.nextChar();
						break;
					}
				}
				if(!isMuli) {
					token.type = this.symbols[this.charCode];
					token.value = this.char;
					this.nextChar();
				}
				// if(this.multiSymbols[this.charCode] != undefined) {
				// 	let ms = this.multiSymbols[this.charCode].value;
				// 	this.log("multi symbol", ms)
				// 	let ok = true;
				// 	for (var i = 0; i < ms.length; i++) {
				// 		if(ms.charAt(i) == this.code.charAt(this.inputIndex+i-1)) continue;
				// 		ok = false;
				// 		break;
				// 	}
				// 	if(ok) {
				// 		this.inputIndex += ms.length-1;
				// 		this.nextChar();
				// 	} else {
				// 		token.type = this.symbols[this.charCode];
				// 		token.value = this.char;
				// 		this.nextChar();
				// 	}
				// } else {
				// }
			} else if (Character.isDigit(this.char)) { // is digit
				token.type = "number";
				token.value = "";
				while (Character.isDigit(this.char) || this.char == '.' || this.char == 'x' || this.char == 'b') {
					token.value += this.char;
					this.nextChar();
					if(this.char == '') break;
				}
			} else if (this.char == '@') {
				this.nextChar();
				let word = '';
				while (Character.isAlphabeticName(this.char)) {
					word += this.char;
					this.nextChar();
					if(this.char == '') break;
				}
				token.type = 'annotation';
				token.value = word;
			} else if (Character.isAlphabetic(this.char)) {
				let word = '';
				while (Character.isAlphabeticName(this.char)) {
					word += this.char;
					this.nextChar();
				}
				if(this.typekeywords[word] != undefined) {
					token.type = 'typename';
					token.value = word;
				} else if(this.keywords[word] == undefined) {
					token.type = 'var';
					token.value = word;
				} else {
					token.type = this.keywords[word];
					token.value = word;
				}
			} else if (this.char == '"') {
				let str = '';
				this.nextChar();
				while (this.char != '"' && this.char != '') {
					str += this.char;
					this.nextChar();
				}
				this.nextChar();
				token.type = 'string';
				token.value = str;
			} else if (this.char == "'") {
				let str = '';
				this.nextChar();
				while (this.char != "'" && this.char != '') {
					str += this.char;
					this.nextChar();
				}
				this.nextChar();
				token.type = 'string';
				token.value = str;
			} else {
				console.error('Неизвестный символ: ', this.char);
				this.nextChar();
			}
		// 	else:
		// 		self.error('Unexpected symbol: ' + self.ch)
		}
		token.endIndex = this.inputIndex+1;
		return token;
	}
}

export default Lexer