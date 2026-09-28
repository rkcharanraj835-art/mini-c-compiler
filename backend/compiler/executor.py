class ExecutionError(Exception): pass


class Executor:
    """Small interpreter for the supported Mini-C AST, used only to show program output."""
    def __init__(self, ast): self.ast=ast; self.env={}; self.output=[]
    def run(self):
        self.exec_node(self.ast); return {"success":True,"variables":self.env.copy(),"output":self.output}
    def exec_node(self,node):
        if node.node_type in {"Program","Block"}:
            for c in node.children:self.exec_node(c)
        elif node.node_type=="Declaration": self.env.setdefault(node.value,0)
        elif node.node_type=="DeclarationList":
            for c in node.children:self.exec_node(c)
        elif node.node_type=="Assignment": self.env[node.value]=self.eval(node.children[0])
        elif node.node_type=="IfElse":
            if self.cond(node.children[0]):self.exec_node(node.children[1])
            else:self.exec_node(node.children[2])
        elif node.node_type=="If":
            if self.cond(node.children[0]):self.exec_node(node.children[1])
        elif node.node_type=="While":
            guard=0
            while self.cond(node.children[0]):
                self.exec_node(node.children[1]); guard+=1
                if guard>10000:raise ExecutionError("Loop execution limit exceeded")
        elif node.node_type=="ExpressionStatement":
            self.output.append(self.eval(node.children[0]))
    def eval(self,n):
        t=n.node_type
        if t=="Integer":return int(n.value)
        if t=="Float":return float(n.value)
        if t=="Char":return n.value[1:-1]
        if t=="Bool":return n.value=="true"
        if t=="Identifier":return self.env.get(n.value,0)
        if t=="UnaryExpression":return -self.eval(n.children[0])
        if t=="BinaryExpression":
            a,b=self.eval(n.children[0]),self.eval(n.children[1])
            if n.value=="+": return a+b
            if n.value=="-": return a-b
            if n.value=="*": return a*b
            if n.value=="/":
                if isinstance(a, int) and isinstance(b, int): return a//b
                return a/b
            if n.value=="%": return a%b
        if t=="Condition": return self.cond(n)
        return 0
    def cond(self,n):
        a,b=self.eval(n.children[0]),self.eval(n.children[1]); return {">":a>b,"<":a<b,">=":a>=b,"<=":a<=b,"==":a==b,"!=":a!=b}[n.value]
