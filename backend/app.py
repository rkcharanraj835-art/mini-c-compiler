from flask import Flask, request, jsonify
from flask_cors import CORS
from compiler.lexer import Lexer, LexerError
from compiler.parser import Parser, ParserError
from compiler.semantic import SemanticAnalyzer
from compiler.intermediate import IntermediateCodeGenerator
from compiler.optimizer import CodeOptimizer
from compiler.code_generator import CodeGenerator
from compiler.executor import Executor, ExecutionError

app = Flask(__name__)
CORS(app)

@app.get("/api/health")
def health():
    return jsonify({"status":"ok","project":"Mini C Compiler","version":"FINAL"})


def error_response(phase, message, tokens=None, parse_tree=None, status=400):
    return jsonify({"success":False,"phase":phase,"error":message,"tokens":tokens or [],"parse_tree":parse_tree,"stages":{phase:"failed"}}), status

@app.post("/api/compile")
def compile_program():
    data=request.get_json(silent=True) or {}; source=data.get("source","")
    if not source.strip(): return error_response("Input","Source program is empty.")

    lexer=Lexer(source)
    tokens, lexical_errors=lexer.tokenize_with_errors()
    token_dicts=[t.to_dict() for t in tokens]
    if lexical_errors:
        return jsonify({"success":False,"phase":"Lexical Analysis","error":lexical_errors[0],"errors":lexical_errors,"tokens":token_dicts,"stages":{"Lexical Analysis":"failed","Syntax Analysis":"not-run","Semantic Analysis":"not-run","Intermediate Code Generation":"not-run","Code Optimization":"not-run","Code Generation":"not-run"}}),400

    try:
        parser=Parser(tokens); parse_tree, ast=parser.parse()
    except ParserError as exc:
        return jsonify({"success":False,"phase":"Syntax Analysis","error":str(exc),"tokens":token_dicts,"parse_tree":None,"stages":{"Lexical Analysis":"success","Syntax Analysis":"failed","Semantic Analysis":"not-run","Intermediate Code Generation":"not-run","Code Optimization":"not-run","Code Generation":"not-run"}}),400

    semantic=SemanticAnalyzer(ast).analyze()
    tac=IntermediateCodeGenerator(ast).generate()
    optimization=CodeOptimizer(tac).optimize()
    target=CodeGenerator(optimization).generate()
    execution=None
    execution_error=None
    if semantic["success"]:
        try: execution=Executor(ast).run()
        except (ExecutionError, ZeroDivisionError) as exc: execution_error=str(exc)
    else:
        execution_error="Execution skipped because semantic errors were found."

    return jsonify({
        "success":True,"phase":"Code Generation","tokens":token_dicts,
        "parse_tree":parse_tree.to_dict(),"semantic":semantic,"intermediate":tac,
        "optimization":optimization,"code_generation":target,"execution":execution,
        "execution_error":execution_error,
        "stages":{"Lexical Analysis":"success","Syntax Analysis":"success","Semantic Analysis":"success" if semantic["success"] else "warning","Intermediate Code Generation":"success","Code Optimization":"success","Code Generation":"success"}
    })

if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
