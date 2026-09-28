from dataclasses import dataclass, field
from typing import Any


class ParserError(Exception):
    def __init__(self, message, line=None, column=None):
        self.message = message
        self.line = line
        self.column = column
        suffix = f" at line {line}, column {column}" if line is not None else ""
        super().__init__(f"{message}{suffix}")


@dataclass
class ASTNode:
    node_type: str
    value: Any = None
    children: list = field(default_factory=list)
    line: int | None = None
    column: int | None = None

    def to_dict(self):
        return {"node_type": self.node_type, "value": self.value, "children": [c.to_dict() for c in self.children]}


@dataclass
class ParseNode:
    name: str
    children: list = field(default_factory=list)
    terminal: bool = False
    value: Any = None

    def to_dict(self):
        return {"name": self.name, "children": [c.to_dict() for c in self.children], "terminal": self.terminal, "value": self.value}


class Parser:
    TYPES = {"int", "float", "double", "char", "bool", "string"}
    RELATIONAL = {">", "<", ">=", "<=", "==", "!="}
    ADDITIVE = {"+", "-"}
    MULTIPLICATIVE = {"*", "/", "%"}

    def __init__(self, tokens):
        self.tokens = tokens
        self.current = 0

    def parse(self):
        statements = []
        tree_children = []
        while not self.check("EOF"):
            parse_node, ast = self.parse_statement()
            tree_children.append(parse_node)
            statements.append(ast)
        return ParseNode("Program", tree_children), ASTNode("Program", children=statements)

    def parse_statement(self):
        if self.check_lexeme(";"):
            tok = self.advance()
            return self.node(tok), ASTNode("EmptyStatement")
        if self.check_lexeme_in(self.TYPES):
            return self.parse_declaration()
        if self.check_lexeme("if"):
            return self.parse_if()
        if self.check_lexeme("while"):
            return self.parse_while()
        if self.check_lexeme("{"):
            return self.parse_block()
        if self.check("IDENTIFIER"):
            # An identifier followed by '=' is an assignment; otherwise this
            # can be a standalone arithmetic/relational expression (calculator
            # and relational-expression exercises in the PDF).
            if self.peek(1).lexeme == "=":
                return self.parse_assignment_statement()
            return self.parse_expression_statement()
        if self.check("INTEGER_LITERAL") or self.check("FLOAT_LITERAL") or self.check_lexeme("(") or self.check_lexeme("-"):
            return self.parse_expression_statement()
        tok = self.peek()
        raise self.error(tok, f"Unexpected token '{tok.lexeme}'")

    def parse_expression_statement(self):
        left = self.parse_expression()
        if self.peek().lexeme in self.RELATIONAL:
            op = self.advance()
            if self.peek().lexeme in self.RELATIONAL:
                raise self.error(self.peek(), "Invalid relational operator")
            if self.peek().lexeme in {";", ")", "EOF"}:
                raise self.error(self.peek(), f"Missing operand after '{op.lexeme}'")
            right = self.parse_expression()
            expr = ASTNode("Condition", value=op.lexeme, children=[left, right])
        else:
            expr = left
        if self.check_lexeme(";"):
            self.advance()
        return ParseNode("Expression", [self.node_from_ast(expr)]), ASTNode("ExpressionStatement", children=[expr])

    def parse_declaration(self):
        type_tok = self.advance()
        identifiers = []
        first = self.expect("IDENTIFIER", "Invalid identifier")
        identifiers.append(first)
        while self.match_lexeme(","):
            if not self.check("IDENTIFIER"):
                raise self.error(self.peek(), "Invalid identifier")
            identifiers.append(self.advance())
        if not self.check_lexeme(";"):
            raise self.error(self.peek(), "Missing ';' after declaration")
        semi = self.advance()
        parse_children = [self.node(type_tok)]
        for i, ident in enumerate(identifiers):
            parse_children.append(self.node(ident))
            if i < len(identifiers) - 1:
                parse_children.append(ParseNode(",", terminal=True, value=","))
        parse_children.append(self.node(semi))
        decls = [ASTNode("Declaration", value=ident.lexeme, children=[ASTNode("Type", value=type_tok.lexeme)], line=ident.line, column=ident.column) for ident in identifiers]
        ast = decls[0] if len(decls) == 1 else ASTNode("DeclarationList", children=decls, line=type_tok.line, column=type_tok.column)
        return ParseNode("Declaration", parse_children), ast

    def parse_assignment_statement(self):
        assignment = self.parse_assignment()
        if not self.check_lexeme(";"):
            raise self.error(self.peek(), "Missing ';' after assignment")
        semi = self.advance()
        return ParseNode("Assignment", [self.node_from_ast(assignment), self.node(semi)]), assignment

    def parse_assignment(self):
        ident = self.expect("IDENTIFIER", "Expected an identifier")
        if not self.check_lexeme("="):
            raise self.error(self.peek(), "Expected assignment operator '='")
        eq = self.advance()
        if self.check_lexeme_in({";", ")", "else", "}"}):
            raise self.error(self.peek(), "Missing expression after '='")
        expr = self.parse_expression()
        return ASTNode("Assignment", value=ident.lexeme, children=[expr], line=ident.line, column=ident.column)

    def parse_if(self):
        if_tok = self.advance()
        if not self.match_lexeme("("):
            raise self.error(self.peek(), "Expected '(' after 'if'")
        condition = self.parse_condition()
        if not self.check_lexeme(")"):
            raise self.error(self.peek(), "Missing ')'")
        self.advance()
        then_parse, then_ast = self.parse_statement()
        if not self.match_lexeme("else"):
            return ParseNode("If", [self.node(if_tok), self.node_from_ast(condition), then_parse]), ASTNode("If", children=[condition, then_ast])
        else_parse, else_ast = self.parse_statement()
        return ParseNode("IfElse", [self.node(if_tok), self.node_from_ast(condition), then_parse, ParseNode("else", terminal=True, value="else"), else_parse]), ASTNode("IfElse", children=[condition, then_ast, else_ast])

    def parse_while(self):
        tok = self.advance()
        if not self.match_lexeme("("):
            raise self.error(self.peek(), "Expected '(' after 'while'")
        condition = self.parse_condition()
        if not self.check_lexeme(")"):
            raise self.error(self.peek(), "Missing ')'")
        self.advance()
        body_parse, body_ast = self.parse_statement()
        return ParseNode("While", [self.node(tok), self.node_from_ast(condition), body_parse]), ASTNode("While", children=[condition, body_ast])

    def parse_block(self):
        left = self.advance()
        children = []
        ast_children = []
        while not self.check("EOF") and not self.check_lexeme("}"):
            pn, an = self.parse_statement(); children.append(pn); ast_children.append(an)
        if not self.check_lexeme("}"):
            raise self.error(self.peek(), "Missing '}'")
        right = self.advance(); children.append(self.node(right))
        return ParseNode("Block", [self.node(left)] + children), ASTNode("Block", children=ast_children)

    def parse_condition(self):
        left = self.parse_expression()
        tok = self.peek()
        if tok.lexeme not in self.RELATIONAL:
            if tok.lexeme in {";", ")", "EOF"}:
                raise self.error(tok, "Missing relational operator")
            raise self.error(tok, "Invalid relational operator")
        op = self.advance()
        if self.peek().lexeme in self.RELATIONAL or self.peek().lexeme in {")", ";", "EOF"}:
            raise self.error(self.peek(), f"Missing operand after '{op.lexeme}'")
        right = self.parse_expression()
        return ASTNode("Condition", value=op.lexeme, children=[left, right], line=op.line, column=op.column)

    def parse_expression(self):
        node = self.parse_term()
        while self.peek().lexeme in self.ADDITIVE:
            op = self.advance()
            if self.peek().lexeme in self.ADDITIVE | self.MULTIPLICATIVE | self.RELATIONAL | {";", ")", "EOF"}:
                raise self.error(self.peek(), f"Unexpected operator '{self.peek().lexeme}'" if self.peek().lexeme in self.ADDITIVE | self.MULTIPLICATIVE else "Invalid expression")
            right = self.parse_term()
            node = ASTNode("BinaryExpression", value=op.lexeme, children=[node, right], line=op.line, column=op.column)
        return node

    def parse_term(self):
        node = self.parse_unary()
        while self.peek().lexeme in self.MULTIPLICATIVE:
            op = self.advance()
            if self.peek().lexeme in self.ADDITIVE | self.MULTIPLICATIVE | self.RELATIONAL | {";", ")", "EOF"}:
                raise self.error(self.peek(), f"Unexpected operator '{self.peek().lexeme}'" if self.peek().lexeme in self.ADDITIVE | self.MULTIPLICATIVE else "Invalid expression")
            right = self.parse_unary()
            node = ASTNode("BinaryExpression", value=op.lexeme, children=[node, right], line=op.line, column=op.column)
        return node

    def parse_unary(self):
        if self.match_lexeme("-"):
            operand = self.parse_unary()
            return ASTNode("UnaryExpression", value="-", children=[operand])
        return self.parse_factor()

    def parse_factor(self):
        tok = self.peek()
        if self.check("IDENTIFIER"):
            self.advance(); return ASTNode("Identifier", value=tok.lexeme, line=tok.line, column=tok.column)
        if self.check("INTEGER_LITERAL"):
            self.advance(); return ASTNode("Integer", value=tok.lexeme, line=tok.line, column=tok.column)
        if self.check("FLOAT_LITERAL"):
            self.advance(); return ASTNode("Float", value=tok.lexeme, line=tok.line, column=tok.column)
        if self.check("CHAR_LITERAL"):
            self.advance(); return ASTNode("Char", value=tok.lexeme, line=tok.line, column=tok.column)
        if self.check("BOOLEAN_LITERAL"):
            self.advance(); return ASTNode("Bool", value=tok.lexeme, line=tok.line, column=tok.column)
        if self.match_lexeme("("):
            expr = self.parse_expression()
            if not self.check_lexeme(")"):
                raise self.error(self.peek(), "Missing ')'")
            self.advance(); return expr
        if tok.lexeme in self.ADDITIVE | self.MULTIPLICATIVE:
            raise self.error(tok, f"Unexpected operator '{tok.lexeme}'")
        if tok.lexeme == ")":
            raise self.error(tok, "Missing expression")
        raise self.error(tok, "Invalid expression")

    def node(self, token):
        return ParseNode(token.lexeme, terminal=True, value=token.lexeme)

    def node_from_ast(self, ast):
        if ast is None: return ParseNode("Empty")
        children = [self.node_from_ast(c) for c in ast.children]
        return ParseNode(ast.node_type, children=children, value=ast.value)

    def check(self, token_type): return self.peek().token_type == token_type
    def check_lexeme(self, lexeme): return self.peek().lexeme == lexeme
    def check_lexeme_in(self, values): return self.peek().lexeme in values
    def match_lexeme(self, lexeme):
        if self.check_lexeme(lexeme): self.advance(); return True
        return False
    def expect(self, token_type, message):
        if self.check(token_type): return self.advance()
        raise self.error(self.peek(), message)
    def advance(self):
        token = self.peek()
        if not self.check("EOF"): self.current += 1
        return token
    def peek(self, offset=0):
        index = min(self.current + offset, len(self.tokens) - 1)
        return self.tokens[index]
    @staticmethod
    def error(token, message): return ParserError(message, token.line, token.column)
