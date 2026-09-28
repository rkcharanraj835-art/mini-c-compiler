from dataclasses import dataclass


class SemanticError(Exception):
    pass


@dataclass
class Symbol:
    name: str
    data_type: str
    scope: str = "Global"
    value: object = None
    implicit: bool = False

    def to_dict(self):
        return {"name": self.name, "data_type": self.data_type, "scope": self.scope, "value": self.value, "implicit": self.implicit}


class SemanticAnalyzer:
    """Educational semantic analysis with a permissive Mini-C symbol table.

    Undeclared identifiers are added as implicit int symbols so the standalone
    PDF expression/compiler exercises (which use a, b, c without declarations)
    can continue to TAC. Explicit declarations still enforce redeclaration and
    type compatibility.
    """

    def __init__(self, ast):
        self.ast = ast
        self.symbols = {}
        self.order = []
        self.errors = []
        self.constants = {}

    def analyze(self):
        try:
            self.visit(self.ast)
        except SemanticError as exc:
            self.errors.append(str(exc))
        return {
            "success": not self.errors,
            "symbols": [s.to_dict() for s in self.order],
            "errors": self.errors,
        }

    def visit(self, node):
        if node is None: return "void"
        t = node.node_type
        if t == "Program" or t == "Block":
            for c in node.children:
                try:
                    self.visit(c)
                except SemanticError as exc:
                    self.errors.append(str(exc))
            return "void"
        if t == "Declaration":
            typ = node.children[0].value
            if node.value in self.symbols and not self.symbols[node.value].implicit:
                raise SemanticError(f"Identifier '{node.value}' is redeclared.")
            if node.value in self.symbols and self.symbols[node.value].implicit:
                sym = self.symbols[node.value]; sym.data_type = typ; sym.implicit = False
            else:
                sym = Symbol(node.value, typ); self.symbols[node.value] = sym; self.order.append(sym)
            return "void"
        if t == "DeclarationList":
            for c in node.children: self.visit(c)
            return "void"
        if t == "Assignment":
            expr_type = self.expression_type(node.children[0])
            target = self.ensure_symbol(node.value)
            if not self.compatible(target.data_type, expr_type):
                raise SemanticError(f"Cannot assign {expr_type} to {target.data_type}")
            value = self.evaluate(node.children[0])
            if value is not None: target.value = value
            return target.data_type
        if t == "IfElse" or t == "If":
            self.condition_type(node.children[0])
            self.visit(node.children[1])
            if t == "IfElse": self.visit(node.children[2])
            return "void"
        if t == "While":
            self.condition_type(node.children[0]); self.visit(node.children[1]); return "void"
        if t == "ExpressionStatement":
            return self.expression_type(node.children[0])
        return self.expression_type(node)

    def ensure_symbol(self, name):
        if name not in self.symbols:
            sym = Symbol(name, "int", implicit=True)
            self.symbols[name] = sym; self.order.append(sym)
        return self.symbols[name]

    def expression_type(self, node):
        t = node.node_type
        if t == "Integer": return "int"
        if t == "Float": return "float"
        if t == "Char": return "char"
        if t == "Bool": return "bool"
        if t == "Identifier": return self.ensure_symbol(node.value).data_type
        if t == "UnaryExpression": return self.expression_type(node.children[0])
        if t == "BinaryExpression":
            a, b = self.expression_type(node.children[0]), self.expression_type(node.children[1])
            if "char" in {a, b} and a != b: raise SemanticError(f"Incompatible operands: char {node.value} {b if a == 'char' else a}")
            if a == "float" or b == "float": return "float"
            return "int"
        if t == "Condition":
            self.condition_type(node); return "bool"
        return "void"

    def condition_type(self, node):
        self.expression_type(node.children[0]); self.expression_type(node.children[1]); return "bool"

    def compatible(self, target, source):
        if target == source: return True
        if target == "float" and source == "int": return True
        return False

    def evaluate(self, node):
        t = node.node_type
        if t == "Integer": return int(node.value)
        if t == "Float": return float(node.value)
        if t == "Char": return node.value[1:-1] if len(node.value) >= 2 else node.value
        if t == "Identifier": return self.symbols.get(node.value).value
        if t == "UnaryExpression":
            v = self.evaluate(node.children[0]); return -v if v is not None else None
        if t == "BinaryExpression":
            a, b = self.evaluate(node.children[0]), self.evaluate(node.children[1])
            if a is None or b is None: return None
            try:
                if node.value == "+": return a + b
                if node.value == "-": return a - b
                if node.value == "*": return a * b
                if node.value == "/":
                    if isinstance(a, int) and isinstance(b, int): return a // b
                    return a / b
                if node.value == "%": return a % b
            except ZeroDivisionError: return None
        return None
