from dataclasses import dataclass


@dataclass
class Token:
    lexeme: str
    token_type: str
    line: int
    column: int

    def to_dict(self):
        return {
            "lexeme": self.lexeme,
            "token_type": self.token_type,
            "line": self.line,
            "column": self.column,
        }


class LexerError(Exception):
    def __init__(self, message, errors=None):
        self.message = message
        self.errors = errors or []
        super().__init__(message)


class Lexer:
    KEYWORDS = {
        "int": "KEYWORD",
        "float": "KEYWORD",
        "double": "KEYWORD",
        "char": "KEYWORD",
        "bool": "KEYWORD",
        "string": "KEYWORD",
        "if": "KEYWORD",
        "else": "KEYWORD",
        "while": "KEYWORD",
        "for": "KEYWORD",
        "return": "KEYWORD",
        "true": "BOOLEAN_LITERAL",
        "false": "BOOLEAN_LITERAL",
    }

    TWO_CHAR_OPERATORS = {
        ">=": "RELATIONAL_OPERATOR",
        "<=": "RELATIONAL_OPERATOR",
        "==": "RELATIONAL_OPERATOR",
        "!=": "RELATIONAL_OPERATOR",
        "&&": "LOGICAL_OPERATOR",
        "||": "LOGICAL_OPERATOR",
        "++": "INCREMENT_OPERATOR",
        "--": "DECREMENT_OPERATOR",
        "+=": "ASSIGNMENT_OPERATOR",
        "-=": "ASSIGNMENT_OPERATOR",
        "*=": "ASSIGNMENT_OPERATOR",
        "/=": "ASSIGNMENT_OPERATOR",
    }

    ONE_CHAR_TOKENS = {
        "+": "ARITHMETIC_OPERATOR",
        "-": "ARITHMETIC_OPERATOR",
        "*": "ARITHMETIC_OPERATOR",
        "/": "ARITHMETIC_OPERATOR",
        "%": "ARITHMETIC_OPERATOR",
        ">": "RELATIONAL_OPERATOR",
        "<": "RELATIONAL_OPERATOR",
        "=": "ASSIGNMENT_OPERATOR",
        ";": "SEPARATOR",
        ",": "SEPARATOR",
        "(": "LEFT_PAREN",
        ")": "RIGHT_PAREN",
        "{": "LEFT_BRACE",
        "}": "RIGHT_BRACE",
        "[": "LEFT_BRACKET",
        "]": "RIGHT_BRACKET",
        ":": "COLON",
        "?": "QUESTION_MARK",
        ".": "DOT",
        "!": "LOGICAL_OPERATOR",
    }

    def __init__(self, source: str):
        self.source = source
        self.index = 0
        self.line = 1
        self.column = 1
        self.errors = []

    def _advance(self):
        char = self.source[self.index]
        self.index += 1
        if char == "\n":
            self.line += 1
            self.column = 1
        else:
            self.column += 1
        return char

    def _peek(self, offset=0):
        pos = self.index + offset
        return self.source[pos] if 0 <= pos < len(self.source) else ""

    def tokenize(self):
        tokens = []
        while self.index < len(self.source):
            char = self._peek()

            if char.isspace():
                self._advance()
                continue

            start_line, start_column = self.line, self.column

            # C/C++ style comments
            if char == "/" and self._peek(1) == "/":
                self._advance(); self._advance()
                while self.index < len(self.source) and self._peek() != "\n":
                    self._advance()
                continue

            if char == "/" and self._peek(1) == "*":
                self._advance(); self._advance()
                while self.index < len(self.source):
                    if self._peek() == "*" and self._peek(1) == "/":
                        self._advance(); self._advance()
                        break
                    self._advance()
                else:
                    self.errors.append(self._error("Unterminated block comment", start_line, start_column))
                continue

            if char.isalpha() or char == "_":
                lexeme = self._read_identifier()
                token_type = self.KEYWORDS.get(lexeme, "IDENTIFIER")
                tokens.append(Token(lexeme, token_type, start_line, start_column))
                continue

            if char.isdigit():
                lexeme, token_type = self._read_number()
                tokens.append(Token(lexeme, token_type, start_line, start_column))
                continue

            if char == "'":
                lexeme = self._read_char_literal(start_line, start_column)
                tokens.append(Token(lexeme, "CHAR_LITERAL", start_line, start_column))
                continue

            if char == '"':
                lexeme = self._read_string_literal(start_line, start_column)
                tokens.append(Token(lexeme, "STRING_LITERAL", start_line, start_column))
                continue

            pair = char + self._peek(1)
            if pair in self.TWO_CHAR_OPERATORS:
                self._advance(); self._advance()
                tokens.append(Token(pair, self.TWO_CHAR_OPERATORS[pair], start_line, start_column))
                continue

            if char in self.ONE_CHAR_TOKENS:
                self._advance()
                tokens.append(Token(char, self.ONE_CHAR_TOKENS[char], start_line, start_column))
                continue

            # Keep scanning after an invalid character so lexical exercises can
            # display the INVALID token and the remaining token stream.
            self._advance()
            token = Token(char, "INVALID", start_line, start_column)
            tokens.append(token)
            self.errors.append(self._error(f"Invalid character '{char}'", start_line, start_column))

        tokens.append(Token("EOF", "EOF", self.line, self.column))
        if self.errors:
            raise LexerError(self.errors[0], self.errors)
        return tokens

    def tokenize_with_errors(self):
        """Always returns the token stream and lexical errors for the UI."""
        try:
            return self.tokenize(), []
        except LexerError as exc:
            # tokenize() has already appended EOF.
            # Re-run is unnecessary; reconstructing isn't needed because we keep tokens locally only.
            # This helper is implemented separately below for convenience.
            return self._tokenize_without_raising()

    def _tokenize_without_raising(self):
        # tokenize() logic is deterministic; perform one pass with error suppression.
        self.index = 0; self.line = 1; self.column = 1; self.errors = []
        tokens = []
        while self.index < len(self.source):
            char = self._peek()
            if char.isspace(): self._advance(); continue
            sl, sc = self.line, self.column
            if char == "/" and self._peek(1) == "/":
                self._advance(); self._advance()
                while self.index < len(self.source) and self._peek() != "\n": self._advance()
                continue
            if char == "/" and self._peek(1) == "*":
                self._advance(); self._advance()
                while self.index < len(self.source):
                    if self._peek() == "*" and self._peek(1) == "/": self._advance(); self._advance(); break
                    self._advance()
                continue
            if char.isalpha() or char == "_":
                lex = self._read_identifier(); tokens.append(Token(lex, self.KEYWORDS.get(lex, "IDENTIFIER"), sl, sc)); continue
            if char.isdigit():
                lex, typ = self._read_number(); tokens.append(Token(lex, typ, sl, sc)); continue
            if char == "'":
                lex = self._read_char_literal(sl, sc); tokens.append(Token(lex, "CHAR_LITERAL", sl, sc)); continue
            if char == '"':
                lex = self._read_string_literal(sl, sc); tokens.append(Token(lex, "STRING_LITERAL", sl, sc)); continue
            pair = char + self._peek(1)
            if pair in self.TWO_CHAR_OPERATORS:
                self._advance(); self._advance(); tokens.append(Token(pair, self.TWO_CHAR_OPERATORS[pair], sl, sc)); continue
            if char in self.ONE_CHAR_TOKENS:
                self._advance(); tokens.append(Token(char, self.ONE_CHAR_TOKENS[char], sl, sc)); continue
            self._advance(); tokens.append(Token(char, "INVALID", sl, sc)); self.errors.append(self._error(f"Invalid character '{char}'", sl, sc))
        tokens.append(Token("EOF", "EOF", self.line, self.column))
        return tokens, self.errors

    def _read_identifier(self):
        chars = []
        while self.index < len(self.source) and (self._peek().isalnum() or self._peek() == "_"):
            chars.append(self._advance())
        return "".join(chars)

    def _read_number(self):
        chars = []
        while self.index < len(self.source) and self._peek().isdigit(): chars.append(self._advance())
        if self._peek() == "." and self._peek(1).isdigit():
            chars.append(self._advance())
            while self.index < len(self.source) and self._peek().isdigit(): chars.append(self._advance())
            return "".join(chars), "FLOAT_LITERAL"
        return "".join(chars), "INTEGER_LITERAL"

    def _read_char_literal(self, line, column):
        chars = [self._advance()]
        escaped = False
        while self.index < len(self.source):
            c = self._advance(); chars.append(c)
            if c == "'" and not escaped: return "".join(chars)
            escaped = (c == "\\" and not escaped)
            if c == "\n" and not escaped: break
        self.errors.append(self._error("Unterminated character literal", line, column))
        return "".join(chars)

    def _read_string_literal(self, line, column):
        chars = [self._advance()]
        escaped = False
        while self.index < len(self.source):
            c = self._advance(); chars.append(c)
            if c == '"' and not escaped: return "".join(chars)
            escaped = (c == "\\" and not escaped)
            if c == "\n" and not escaped: break
        self.errors.append(self._error("Unterminated string literal", line, column))
        return "".join(chars)

    @staticmethod
    def _error(message, line, column):
        return f"{message} at line {line}, column {column}."
