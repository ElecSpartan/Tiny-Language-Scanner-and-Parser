const tokenType = Object.freeze([
    "SEMICOLON",
    "IF",
    "THEN",
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
]);

const Keywords = {
    if: "IF",
    then: "THEN",
    end: "END",
    repeat: "REPEAT",
    until: "UNTIL",
    read: "READ",
    write: "WRITE",
};

const Symbols = {
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
};

class TokenRecord {
    constructor(tokenType, stringVal, intVal) {
        this.tokenType = tokenType;
        this.stringVal = stringVal;
        this.intVal = intVal;
    }
}

function scan(input) {
    const tokens = [];
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
                if (input[i] == "}") {
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

            tokens.push(new TokenRecord("NUMBER", "", parseInt(number, 10)));
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

function handleScan(event) {

    event.preventDefault()
    const input = document.getElementById("inputId").value;
    
    const error = document.getElementById("errorId")
    const noerror = document.getElementById('outputId')
    
    let tokens
    try {
        tokens = scan(input)
    } catch (err) {
        error.classList.remove("hidden")
        noerror.classList.add("hidden")

        error.innerHTML = `<p>${err}</p>`;
        return
    }
    
    
    if (tokens.length > 0) {
        error.classList.add("hidden")
        noerror.classList.remove("hidden")
        
        const table = document.getElementById("tableId")
        table.innerHTML = "";
        
        for (let token of tokens) {
            let tokenType = document.createElement("td")
            tokenType.innerText = token.tokenType
            let tokenVal = document.createElement("td")
            tokenVal.innerText = token.stringVal || token.intVal
    
            let row = document.createElement("tr")
            row.append(tokenType, tokenVal)
            table.appendChild(row)
        }
    } else {
        error.classList.remove("hidden")
        noerror.classList.add("hidden")
    }
    

}

const button = document.getElementById("buttonId");
button.addEventListener('click', handleScan);

const sourceCode = `
read x; {input an integer}
if 0 < x then { don’t compute if x <= 0}
fact := 1;
repeat
fact := fact * x;
x := x - 1
until x = 0;
write fact { output factorial of x }
end
`;

const tokens = scan(sourceCode);

tokens.forEach(token => {
    console.log(`Type: ${token.tokenType}, Value: ${token.stringVal || token.intVal}`);
});


