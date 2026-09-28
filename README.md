# Mini C Compiler — Assignment II Final

A web-based Compiler Design project that simulates the six compiler phases and an execution step for the Mini-C subset used in the uploaded Assignment-II PDF.

## Supported assignment coverage

- Arithmetic expressions and TAC
- Operator precedence
- Parentheses and unmatched-parenthesis errors
- Declarations and symbol table
- Multiple declarations
- Assignments and missing-expression errors
- Arithmetic calculator expressions
- Unary minus
- Relational operators: `<`, `>`, `<=`, `>=`, `==`, `!=`
- `if`, `if-else`
- `while` loops and backward TAC jumps
- Blocks `{ ... }`
- Lexical invalid-character reporting with `INVALID` tokens
- Syntax tree / AST
- Semantic type checking for int, float, char and bool, with implicit int symbols for the PDF's undeclared expression examples
- Three Address Code
- Constant folding / propagation / constant-condition optimization
- Educational target pseudo-assembly
- Program execution simulation and final variable output

## Project structure

```text
mini-c-compiler/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── compiler/
│       ├── lexer.py
│       ├── parser.py
│       ├── semantic.py
│       ├── intermediate.py
│       ├── optimizer.py
│       ├── code_generator.py
│       └── executor.py
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx
        └── style.css
```

## Run backend (Windows)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Run frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Important

This is an educational Mini-C compiler simulator, not a full C compiler. The target code is pseudo-assembly. The executor is an AST interpreter used to demonstrate program output after the compiler phases.

The UI includes ready-made sample programs for Shopping, Arithmetic, Parentheses, While, Calculator, and Student Result.

## Assignment smoke test

From the project root:

```powershell
python tests\test_assignment_suite.py
```

This runs the representative valid/invalid examples from the uploaded Assignment-II PDF through the lexer, parser, semantic analyzer, TAC generator, optimizer, and target-code generator.
