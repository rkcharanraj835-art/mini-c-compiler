class CodeGenerator:
    """Generate educational pseudo-assembly from optimized TAC.

    The generator deliberately accepts both normal TAC and TAC whose
    operation metadata was retained after an optimization changed the
    right-hand side into a simple value.
    """

    JUMPS = {">": "JG", "<": "JL", ">=": "JGE", "<=": "JLE", "==": "JE", "!=": "JNE"}
    ARITH = {"+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD"}

    def __init__(self, result):
        self.result = result or {}
        self.out = []
        self.regs = 0

    def emit(self, code, operation="instruction"):
        self.out.append({
            "index": len(self.out) + 1,
            "code": code,
            "operation": operation,
        })

    def new_register(self):
        self.regs += 1
        return f"R{self.regs}"

    def generate(self):
        self.out = []
        self.regs = 0

        for instruction in self.result.get("instructions", []):
            self.generate_instruction(instruction)

        return {
            "success": True,
            "target_type": "Educational Pseudo Assembly",
            "instructions": self.out,
            "instruction_count": len(self.out),
            "register_count": self.regs,
        }

    def generate_instruction(self, instruction):
        code = str(instruction.get("code", "")).strip()
        operation = instruction.get("operation", "instruction")

        if not code:
            return

        if operation == "label":
            self.emit(code.upper(), "label")
            return

        if operation == "jump":
            self.emit(code.upper(), "jump")
            return

        if operation == "conditional_jump":
            self.generate_conditional_jump(code)
            return

        # Comparison instructions can appear in some educational TAC forms.
        if operation == "comparison":
            self.generate_comparison_assignment(code)
            return

        if operation in {"assignment", "move", "arithmetic", "unary"}:
            self.generate_assignment_like(code, operation)
            return

        if " = " in code:
            self.generate_assignment_like(code, operation)
            return

        self.emit(code, operation)

    def generate_assignment_like(self, code, operation):
        if "=" not in code:
            self.emit(code, operation)
            return

        target, expression = [part.strip() for part in code.split("=", 1)]
        parts = expression.split()

        # Unary minus: t1 = -a
        if len(parts) == 1 and parts[0].startswith("-") and len(parts[0]) > 1:
            register = self.new_register()
            operand = parts[0][1:]
            self.emit(f"MOV {register}, {operand}", "move")
            self.emit(f"NEG {register}", "unary")
            self.emit(f"MOV {target}, {register}", "move")
            return

        # Normal simple assignment / optimized constant.
        if len(parts) == 1:
            self.emit(f"MOV {target}, {parts[0]}", "move")
            return

        # Standard TAC arithmetic: target = left op right
        if len(parts) == 3 and parts[1] in self.ARITH:
            left, operator, right = parts
            register = self.new_register()
            self.emit(f"MOV {register}, {left}", "move")
            self.emit(f"{self.ARITH[operator]} {register}, {right}", "arithmetic")
            self.emit(f"MOV {target}, {register}", "move")
            return

        # Be defensive with any educational TAC we haven't modeled yet.
        self.emit(f"MOV {target}, {expression}", "move")

    def generate_conditional_jump(self, code):
        parts = code.split()
        # if left op right goto label
        if len(parts) == 6 and parts[0] == "if":
            _, left, operator, right, _, label = parts
            self.emit(f"CMP {left}, {right}", "compare")
            self.emit(f"{self.JUMPS.get(operator, 'JMP')} {label}", "conditional_jump")
            return

        self.emit(code, "conditional_jump")

    def generate_comparison_assignment(self, code):
        # Educational comparison TAC: t1 = a > b
        if "=" not in code:
            self.emit(code, "comparison")
            return

        target, expression = [part.strip() for part in code.split("=", 1)]
        parts = expression.split()
        if len(parts) == 3 and parts[1] in self.JUMPS:
            left, operator, right = parts
            self.emit(f"CMP {left}, {right}", "compare")
            self.emit(f"{self.JUMPS[operator]} {target}", "conditional_jump")
            return

        self.emit(f"MOV {target}, {expression}", "move")
