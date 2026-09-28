from dataclasses import dataclass


@dataclass
class TACInstruction:
    index: int
    code: str
    operation: str

    def to_dict(self): return {"index": self.index, "code": self.code, "operation": self.operation}


class IntermediateCodeGenerator:
    def __init__(self, ast):
        self.ast = ast; self.instructions = []; self.temp = 0; self.label = 0

    def new_temp(self): self.temp += 1; return f"t{self.temp}"
    def new_label(self): self.label += 1; return f"L{self.label}"
    def emit(self, code, operation="instruction"):
        self.instructions.append(TACInstruction(len(self.instructions)+1, code, operation))

    def generate(self):
        self.instructions=[]; self.temp=0; self.label=0; self.visit(self.ast)
        return {"success": True, "instructions":[i.to_dict() for i in self.instructions], "temporary_count":self.temp, "label_count":self.label}

    def visit(self, node):
        if node is None: return None
        t=node.node_type
        if t in {"Program", "Block"}:
            for c in node.children: self.visit(c)
        elif t == "Declaration": pass
        elif t == "DeclarationList":
            for c in node.children: self.visit(c)
        elif t == "Assignment":
            r=self.expression(node.children[0]); self.emit(f"{node.value} = {r}", "assignment")
        elif t == "ExpressionStatement":
            r = self.expression(node.children[0])
            self.emit(f"# result = {r}", "expression_result")
        elif t == "IfElse": self.gen_if(node)
        elif t == "If": self.gen_if(node)
        elif t == "While": self.gen_while(node)

    def expression(self,node):
        t=node.node_type
        if t in {"Integer","Float","Char","Bool","Identifier"}: return str(node.value)
        if t == "Condition":
            left=self.expression(node.children[0]); right=self.expression(node.children[1]); temp=self.new_temp(); self.emit(f"{temp} = {left} {node.value} {right}", "comparison"); return temp
        if t == "UnaryExpression":
            operand=self.expression(node.children[0]); temp=self.new_temp(); self.emit(f"{temp} = -{operand}", "unary"); return temp
        if t == "BinaryExpression":
            left=self.expression(node.children[0]); right=self.expression(node.children[1]); temp=self.new_temp(); self.emit(f"{temp} = {left} {node.value} {right}", "arithmetic"); return temp
        return ""

    def condition(self,node):
        return self.expression(node.children[0]), node.value, self.expression(node.children[1])

    def gen_if(self,node):
        left,op,right=self.condition(node.children[0]); true_l=self.new_label(); false_l=self.new_label(); end_l=self.new_label()
        self.emit(f"if {left} {op} {right} goto {true_l}", "conditional_jump")
        self.emit(f"goto {false_l}", "jump")
        self.emit(f"{true_l}:", "label"); self.visit(node.children[1])
        self.emit(f"goto {end_l}", "jump")
        self.emit(f"{false_l}:", "label")
        if node.node_type == "IfElse": self.visit(node.children[2])
        self.emit(f"{end_l}:", "label")

    def gen_while(self,node):
        start=self.new_label(); body=self.new_label(); end=self.new_label()
        self.emit(f"{start}:", "label")
        left,op,right=self.condition(node.children[0])
        self.emit(f"if {left} {op} {right} goto {body}", "conditional_jump")
        self.emit(f"goto {end}", "jump")
        self.emit(f"{body}:", "label"); self.visit(node.children[1]); self.emit(f"goto {start}", "jump"); self.emit(f"{end}:", "label")
