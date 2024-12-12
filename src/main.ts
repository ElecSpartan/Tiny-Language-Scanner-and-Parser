/****************************************/
/*********  Tokens and Symbols  *********/
/****************************************/

const tokenType = [
    "SEMICOLON",
    "IF",
    "THEN",
    "ELSE",
    "END",
    "REPEAT",
    "UNTIL",
    "IDENTIFIER",
    "ASSIGN",
    "READ",
    "WRITE",
    "LESSTHAN",
    "EQUAL",
    "PLUS",
    "MINUS",
    "MULT",
    "DIV",
    "OPENBRACKET",
    "CLOSEDBRACKET",
    "NUMBER",
] as const;

type TokenType = typeof tokenType[number];

const Keywords: Record<string, TokenType> = {
    if: "IF",
    then: "THEN",
    else: "ELSE",
    end: "END",
    repeat: "REPEAT",
    until: "UNTIL",
    read: "READ",
    write: "WRITE",
} as const;

const Symbols: Record<string, TokenType> = {
    ";": "SEMICOLON",
    ":=": "ASSIGN",
    "<": "LESSTHAN",
    "=": "EQUAL",
    "+": "PLUS",
    "-": "MINUS",
    "*": "MULT",
    "/": "DIV",
    "(": "OPENBRACKET",
    ")": "CLOSEDBRACKET",
} as const;

class TokenRecord {
    tokenType: TokenType;
    tokenValue: string;

    constructor(tokenType: TokenType, tokenValue: string) {
        this.tokenType = tokenType;
        this.tokenValue = tokenValue;
    }
}

/****************************************/
/**************  Scanner  ***************/
/****************************************/

function scan(input: string): TokenRecord[] {
    const tokens: TokenRecord[] = [];
    let i = 0;
    let notClosedFlag = 0;        //flag to handle unclosed brackets

    while (i < input.length) {
        
      const char = input[i];
      
      //remove white spaces,tabs and newlines
      if (/\s/.test(char)) {
            i++;
            continue;
        }

      //Handle comments

      if (char === "{") {
            i++; // skip first open curly
            notClosedFlag = 1;
            while (i < input.length) {
                if (input[i] === "}") {
                    notClosedFlag = 0;
                    i++;
                    break;
                }
                i++;
            }
            continue;
      }

      if (char === "}") {
        throw new Error(`There is Lone Close Curly!`);
  }


      // Handle keywords and identifiers
        if (/[a-zA-Z]/.test(char)) {
            let word = "";
            while (i < input.length && /[a-zA-Z]/.test(input[i])) {
                word += input[i];
                i++;
            }

            const tokenType = Keywords[word] || "IDENTIFIER";
            tokens.push(new TokenRecord(tokenType, word));
            continue;
        }

        // Handle numbers
        if (/\d/.test(char)) {
            let number = "";
            while (i < input.length && /\d/.test(input[i])) {
                number += input[i];
                i++;
            }

            tokens.push(new TokenRecord("NUMBER", number));
            continue;
        }

        // Handle symbols except assign
        if (Symbols[char]) {
            tokens.push(new TokenRecord(Symbols[char],char));
            i++;
            continue;
        }

      // Handle ASSIGN by checking the next of colon symbol
      if (char == ":" && input[i + 1] == "=") {
            tokens.push(new TokenRecord(Symbols[":="],":="));
            i += 2;
            continue;
        }

      throw new Error(`Unexpected character: ${char}`);
    }

    if(notClosedFlag)
        throw new Error(`There is Lone Open Curly!`);
    return tokens;
}

/****************************************/
/***************  Parser  ***************/
/****************************************/

class SyntaxNode {
    public type: string;
    public children: SyntaxNode[] = [];
    public metadata: string = "";

    constructor(type: string) {
        this.type = type;
    }

    public addChild(node: SyntaxNode) {
        this.children.push(node);
    }

    public drawTree(depth: number = 0): any {
        var node_json = {
            text: {
                name: `${this.type}`,
                title: `${this.metadata ? this.metadata : ""}`
            },
            children: [] as any
        }
        for (const child of this.children) {
            var child_json = child.drawTree(depth + 1);
            node_json["children"].push(child_json);
        }
        return node_json
    }
}

class Parser {
    private tokens: TokenRecord[];
    private currentTokenIndex = 0;

    constructor(tokens: TokenRecord[]) {
        this.tokens = tokens;
    }

    private currentToken(): TokenRecord {
        return this.tokens[this.currentTokenIndex];
    }

    private matchToken(tokenType: TokenType) {
        if (this.currentToken().tokenType === tokenType) {
            this.currentTokenIndex++;
        } else {
            throw new Error(`Unexpected token: ${this.currentToken().tokenValue} in position ${this.currentTokenIndex}. Expected: ${tokenType}`);
        }
    }

    private stmt_seq(): SyntaxNode {
        const node = new SyntaxNode("stmt_seq");
        node.addChild(this.stmt());
        while (this.currentToken() && this.currentToken().tokenType === "SEMICOLON") {
            this.matchToken("SEMICOLON");
            node.addChild(this.stmt());
        }
        return node;
    }

    private stmt(): SyntaxNode {
        switch (this.currentToken().tokenType) {
            case "IF":
                return this.if_stmt();
            case "REPEAT":
                return this.repeat_stmt();
            case "IDENTIFIER":
                return this.assign_stmt();
            case "READ":
                return this.read_stmt();
            case "WRITE":
                return this.write_stmt();
            default:
                throw new Error(`Unexpected token: ${this.currentToken().tokenValue} in position ${this.currentTokenIndex}. Expected: IF, REPEAT, IDENTIFIER, READ, WRITE`);
        }
    }

    private if_stmt(): SyntaxNode {
        const node = new SyntaxNode("if_stmt");
        this.matchToken("IF");
        node.addChild(this.exp());
        this.matchToken("THEN");
        node.addChild(this.stmt_seq());
        if (this.currentToken().tokenType === "ELSE") {
            this.matchToken("ELSE");
            node.addChild(this.stmt_seq());
        }
        this.matchToken("END");
        return node;
    }

    private repeat_stmt(): SyntaxNode {
        const node = new SyntaxNode("repeat_stmt");
        this.matchToken("REPEAT");
        node.addChild(this.stmt_seq());
        this.matchToken("UNTIL");
        node.addChild(this.exp());
        return node;
    }

    private assign_stmt(): SyntaxNode {
        const node = new SyntaxNode("assign_stmt");
        node.metadata = this.currentToken().tokenValue;
        this.matchToken("IDENTIFIER");
        this.matchToken("ASSIGN");
        node.addChild(this.exp());
        return node
    }

    private read_stmt(): SyntaxNode {
        const node = new SyntaxNode("read_stmt");
        this.matchToken("READ");
        node.metadata = this.currentToken().tokenValue;
        this.matchToken("IDENTIFIER");
        return node;
    }

    private write_stmt(): SyntaxNode {
        const node = new SyntaxNode("write_stmt");
        this.matchToken("WRITE");
        node.addChild(this.exp());
        return node;
    }

    private exp(): SyntaxNode {
        const node = new SyntaxNode("exp");
        node.addChild(this.simple_exp());
        if (this.currentToken().tokenType === "LESSTHAN" || this.currentToken().tokenType === "EQUAL") {
            node.metadata = this.currentToken().tokenValue;
            this.matchToken(this.currentToken().tokenType);
            node.addChild(this.simple_exp());
        }
        return node;
    }

    private simple_exp(): SyntaxNode {
        const node = new SyntaxNode("simple_exp");
        node.addChild(this.term());
        while (this.currentToken().tokenType === "PLUS" || this.currentToken().tokenType === "MINUS") {
            node.metadata = this.currentToken().tokenValue;
            this.matchToken(this.currentToken().tokenType);
            node.addChild(this.term());
        }
        return node;
    }

    private term(): SyntaxNode {
        const node = new SyntaxNode("term");
        node.addChild(this.factor());
        while (this.currentToken().tokenType === "MULT" || this.currentToken().tokenType === "DIV") {
            node.metadata = this.currentToken().tokenValue;
            this.matchToken(this.currentToken().tokenType);
            node.addChild(this.factor());
        }
        return node;
    }

    private factor(): SyntaxNode {
        const node = new SyntaxNode("factor");
        switch (this.currentToken().tokenType) {
            case "OPENBRACKET":
                this.matchToken("OPENBRACKET");
                node.addChild(this.exp());
                this.matchToken("CLOSEDBRACKET");
                break;
            case "IDENTIFIER":
                node.metadata = this.currentToken().tokenValue;
                this.matchToken("IDENTIFIER");
                break;
            case "NUMBER":
                node.metadata = this.currentToken().tokenValue;
                this.matchToken("NUMBER");
                break;
            default:
                throw new Error(`Unexpected token: ${this.currentToken().tokenValue} in position ${this.currentTokenIndex}. Expected: OPENBRACKET, IDENTIFIER, NUMBER`);
        }
        return node;
    }

    public parse(): SyntaxNode {
        return this.stmt_seq();
    }

}

/****************************************/
/***********  Button Handler  ***********/
/****************************************/

function handleScanAndParse(event: Event) {

    event.preventDefault()
    const input = (document.getElementById("inputId") as HTMLInputElement).value;
    
    const error = document.getElementById("errorId")!
    const noerror = document.getElementById('outputId')!
    const tree = document.getElementById('tree_section')!

    if (!input) {
        error.classList.remove("hidden")
        noerror.classList.add("hidden")
        tree.classList.add("hidden")

        error.innerHTML = `<p>Input is empty!</p>`;
        return
    }
    
    let tokens: TokenRecord[];
    try {
        tokens = scan(input)
    } catch (err) {
        error.classList.remove("hidden")
        noerror.classList.add("hidden")
        tree.classList.add("hidden")

        error.innerHTML = `<p>${err}</p>`;
        return
    }
    
    
    if (tokens.length > 0) {
        error.classList.add("hidden")
        noerror.classList.remove("hidden")
        tree.classList.remove("hidden")
        
        const table = document.getElementById("tableId")!; 
        table.innerHTML = "";
        
        for (let token of tokens) {
            let tokenType = document.createElement("td")
            tokenType.innerText = token.tokenType
            let tokenVal = document.createElement("td")
            tokenVal.innerText = token.tokenValue;
    
            let row = document.createElement("tr")
            row.append(tokenType, tokenVal)
            table.appendChild(row)
        }

        const parser = new Parser(tokens);
        const syntaxTree = parser.parse();

        var chart_config = {
            chart: {
                container: "#tree_container",
                connectors: {
                    type: 'bCurve',
                    style: {
                        'stroke': '#c748ac',
                        'arrow-end': 'oval-wide-long'
                    }
                },
                node: {
                    HTMLclass: 'tree_node',
                }
            },
            nodeStructure: {}
        }
        chart_config["nodeStructure"] = syntaxTree.drawTree();
        new Treant( chart_config );
        
    } else {
        error.classList.remove("hidden")
        noerror.classList.add("hidden")
        tree.classList.add("hidden")
    }
    

}

const button = document.getElementById("buttonId")!;
button.addEventListener('click', handleScanAndParse);

/*
read x; {input an integer}
if 0 < x then { don’t compute if x <= 0}
fact := 1;
repeat
fact := fact * x;
x := x - 1
until x = 0;
write fact { output factorial of x }
end
*/