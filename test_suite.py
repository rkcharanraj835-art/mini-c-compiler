import sys
sys.path.insert(0, '/mnt/data/mini_fix/backend')
from compiler.lexer import Lexer
from compiler.parser import Parser, ParserError
from compiler.semantic import SemanticAnalyzer
from compiler.intermediate import IntermediateCodeGenerator
from compiler.optimizer import CodeOptimizer
from compiler.code_generator import CodeGenerator
from compiler.executor import Executor

cases = [
('Q2 valid', 'a = b + c * d;'),
('Q2 invalid', 'a = b + * c;'),
('Q3 valid', 'x = (a + b) * c;'),
('Q3 invalid', 'x = (a + b * c;'),
('Q4 valid', 'int a;\nfloat b;\nint count;'),
('Q4 invalid', 'int 123;'),
('Q5 valid', 'a = 10;\nb = a + 5;'),
('Q5 invalid', 'a =;'),
('Q6 valid', '20 + 10 * 2'),
('Q6 invalid', '20 + * 10'),
('Q7 valid', 'a > b'),
('Q7 invalid', 'a >< b'),
('Q9 valid', 'if (a > b)\nmax = a;\nelse\nmax = b;'),
('Q9 invalid', 'if (a > b\nmax = a;'),
('Q10 valid', 'while (a < 10)\na = a + 1;'),
('Q10 invalid', 'while (a < 10\na = a + 1;'),
('Q11 invalid lexical', 'sum = a + 10 @ b;'),
('Q13 valid', 'int a;\na = b + c * 10;\nif (a > 20)\nb = a + 5;'),
('Q13 invalid', 'int a\na = b + * 10;'),
('Q14 valid', 'a = b + c * 10;'),
('Q14 invalid', 'a = b + * 10;'),
('Q15 valid', 'x = (a + b) * (c - d);'),
('Q15 invalid', 'x = (a + b * (c - d);'),
('Q16 valid', 'if (a > b)\nx = a + 10;'),
('Q16 invalid', 'if (a > )\nx = a + 10;'),
('Q17 valid', 'if (x > 10)\ny = x + 5;\nelse\ny = x - 5;'),
('Q17 invalid', 'if (x > 10)\ny = x + 5;\nelse\ny=;'),
('Q18 valid', 'int a;\nint b;\na = 10;\nb = a * 2 + 5;'),
('Q18 invalid', 'int a\nint b;\na = 10;\nb = a * + 5;'),
('ATM', 'int balance;\nint amount;\nint remaining;\nremaining = balance - amount;\nif (balance >= amount)\nstatus = 1;\nelse\nstatus = 0;'),
('Shopping', 'int price;\nint discount;\nint amount;\nint finalPrice;\nint category;\nprice = 2000;\ndiscount = 10;\namount = price - (price * discount / 100);\nfinalPrice = amount + 50;\nif (finalPrice > 1500)\ncategory = 1;\nelse\ncategory = 2;'),
('Payroll', "int employeeId;\nfloat salary;\nfloat taxRate;\nchar grade;\nemployeeId = 101;\nsalary = 45000.50;\ntaxRate = 10.5;\ngrade = 'A';\ntaxRate = salary * 0.10;\nsalary = employeeId + taxRate;\nemployeeId = salary;\ngrade = taxRate;\nsalary = grade + taxRate;"),
('Calculator unary', '-10 + 5 * 2'),
]

for name, source in cases:
    print('\n###', name)
    lexer=Lexer(source); tokens, lexerrs=lexer.tokenize_with_errors()
    if lexerrs:
        print('LEXERR:', lexerrs[0]); continue
    try:
        tree, ast=Parser(tokens).parse()
    except ParserError as e:
        print('PARSEERR:', str(e)); continue
    sem=SemanticAnalyzer(ast).analyze()
    tac=IntermediateCodeGenerator(ast).generate()
    opt=CodeOptimizer(tac).optimize()
    try:
        target=CodeGenerator(opt).generate()
        print('OK', 'sem=', sem['success'], 'tac=', len(tac['instructions']), 'target=', target['instruction_count'])
        if name in {'Q2 valid','Q3 valid','Q5 valid','Q6 valid','Q7 valid','Q9 valid','Q10 valid','Shopping','ATM','Calculator unary'}:
            print('\n'.join(i['code'] for i in tac['instructions']))
    except Exception as e:
        print('CODEGENERR:', type(e).__name__, e)
