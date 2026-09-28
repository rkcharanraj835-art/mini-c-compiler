"""Smoke-test the Assignment-II language examples without Flask or React.

Run from the project root:
    python tests/test_assignment_suite.py
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from compiler.lexer import Lexer
from compiler.parser import Parser, ParserError
from compiler.semantic import SemanticAnalyzer
from compiler.intermediate import IntermediateCodeGenerator
from compiler.optimizer import CodeOptimizer
from compiler.code_generator import CodeGenerator


CASES = [
    ("Q2 arithmetic valid", "a = b + c * d;", True),
    ("Q2 arithmetic invalid", "a = b + * c;", False),
    ("Q3 parentheses valid", "x = (a + b) * c;", True),
    ("Q3 parentheses invalid", "x = (a + b * c;", False),
    ("Q4 declarations valid", "int a;\nfloat b;\nint count;", True),
    ("Q4 declaration invalid", "int 123;", False),
    ("Q5 assignments valid", "a = 10;\nb = a + 5;", True),
    ("Q5 assignment invalid", "a =;", False),
    ("Q6 calculator valid", "20 + 10 * 2", True),
    ("Q6 calculator invalid", "20 + * 10", False),
    ("Q7 relational valid", "a > b", True),
    ("Q7 relational invalid", "a >< b", False),
    ("Q9 if-else valid", "if (a > b)\nmax = a;\nelse\nmax = b;", True),
    ("Q9 if invalid", "if (a > b\nmax = a;", False),
    ("Q10 while valid", "while (a < 10)\na = a + 1;", True),
    ("Q10 while invalid", "while (a < 10\na = a + 1;", False),
    ("Q11 lexical invalid", "sum = a + 10 @ b;", False),
    ("Q13 mini compiler valid", "int a;\na = b + c * 10;\nif (a > 20)\nb = a + 5;", True),
    ("Q13 mini compiler invalid", "int a\na = b + * 10;", False),
    ("Q14 syntax tree valid", "a = b + c * 10;", True),
    ("Q14 syntax tree invalid", "a = b + * 10;", False),
    ("Q15 parentheses tree valid", "x = (a + b) * (c - d);", True),
    ("Q15 parentheses tree invalid", "x = (a + b * (c - d);", False),
    ("Q16 if tree valid", "if (a > b)\nx = a + 10;", True),
    ("Q16 if tree invalid", "if (a > )\nx = a + 10;", False),
    ("Q17 if-else tree valid", "if (x > 10)\ny = x + 5;\nelse\ny = x - 5;", True),
    ("Q17 if-else tree invalid", "if (x > 10)\ny = x + 5;\nelse\ny=;", False),
    ("Q18 declarations/assignments valid", "int a;\nint b;\na = 10;\nb = a * 2 + 5;", True),
    ("Q18 declarations/assignments invalid", "int a\nint b;\na = 10;\nb = a * + 5;", False),
    ("Q19 ATM", "int balance;\nint amount;\nint remaining;\nremaining = balance - amount;\nif (balance >= amount)\nstatus = 1;\nelse\nstatus = 0;", True),
    ("Q20 calculator unary", "-10 + 5 * 2", True),
    ("Q21 payroll types", "int employeeId;\nfloat salary;\nfloat taxRate;\nchar grade;\nemployeeId = 101;\nsalary = 45000.50;\ntaxRate = 10.5;\ngrade = 'A';\ntaxRate = salary * 0.10;\nsalary = employeeId + taxRate;\nemployeeId = salary;\ngrade = taxRate;\nsalary = grade + taxRate;", True),
    ("Shopping application", "int price;\nint discount;\nint amount;\nint finalPrice;\nint category;\nprice = 2000;\ndiscount = 10;\namount = price - (price * discount / 100);\nfinalPrice = amount + 50;\nif (finalPrice > 1500)\ncategory = 1;\nelse\ncategory = 2;", True),
]


def compile_case(source):
    lexer = Lexer(source)
    tokens, lexical_errors = lexer.tokenize_with_errors()
    if lexical_errors:
        return False, lexical_errors[0]
    try:
        _, ast = Parser(tokens).parse()
    except ParserError as exc:
        return False, str(exc)

    semantic = SemanticAnalyzer(ast).analyze()
    tac = IntermediateCodeGenerator(ast).generate()
    optimized = CodeOptimizer(tac).optimize()
    CodeGenerator(optimized).generate()
    return True, "ok"


passed = 0
for name, source, expected_valid in CASES:
    actual_valid, detail = compile_case(source)
    # Payroll deliberately contains semantic type errors; parsing/code generation
    # must still be possible, so it is treated as syntactically valid here.
    ok = actual_valid == expected_valid
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {detail}")
    passed += ok

print(f"\n{passed}/{len(CASES)} smoke tests matched the expected lexical/syntax classification.")
raise SystemExit(0 if passed == len(CASES) else 1)
