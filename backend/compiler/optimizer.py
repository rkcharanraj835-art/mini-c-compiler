import re


class CodeOptimizer:
    def __init__(self, intermediate_result):
        self.input=intermediate_result; self.constants={}; self.optimizations=[]

    def optimize(self):
        out=[]
        for ins in self.input.get("instructions",[]):
            code=ins["code"]; op=ins.get("operation","instruction"); new=self.optimize_instruction(code,op)
            out.append({"index":len(out)+1,"code":new,"operation":op})
        return {"success":True,"instructions":out,"optimizations":self.optimizations,"optimization_count":len(self.optimizations)}

    def optimize_instruction(self,code,op):
        if op in {"label","jump"}: return code
        if op=="conditional_jump":
            m=re.match(r"if (.+) (>=|<=|==|!=|>|<) (.+) goto (L\d+)",code)
            if not m:return code
            l,o,r,label=m.groups(); l=self.replace(l); r=self.replace(r)
            if self.integer(l) and self.integer(r):
                result=self.compare(int(l),o,int(r)); new=f"goto {label}" if result else f"# condition always false: {code}"
                self.optimizations.append({"type":"Constant Condition","original":code,"optimized":new}); return new
            return f"if {l} {o} {r} goto {label}"
        if " = " not in code:return code
        target,expr=map(str.strip,code.split("=",1)); replaced=self.replace(expr)
        parts=re.fullmatch(r"(-?\d+(?:\.\d+)?) ([+\-*/%]) (-?\d+(?:\.\d+)?)",replaced)
        if parts:
            a,o,b=parts.groups(); result=self.calc(float(a) if '.' in a else int(a),o,float(b) if '.' in b else int(b))
            if result is not None:
                result=self.format(result); new=f"{target} = {result}"; self.constants[target]=result
                if new!=code:self.optimizations.append({"type":"Constant Folding","original":code,"optimized":new})
                return new
        if self.integer(replaced) or self.float(replaced): self.constants[target]=float(replaced) if '.' in replaced else int(replaced)
        elif replaced in self.constants:
            self.constants[target]=self.constants[replaced]; replaced=self.format(self.constants[replaced]); self.optimizations.append({"type":"Constant Propagation","original":code,"optimized":f"{target} = {replaced}"})
        else:self.constants.pop(target,None)
        return f"{target} = {replaced}"

    def replace(self,s):
        return " ".join(self.format(self.constants[t]) if t in self.constants else t for t in s.split())
    @staticmethod
    def integer(s): return bool(re.fullmatch(r"-?\d+",s))
    @staticmethod
    def float(s): return bool(re.fullmatch(r"-?\d+\.\d+",s))
    @staticmethod
    def format(v):
        return str(int(v)) if isinstance(v,float) and v.is_integer() else str(v)
    @staticmethod
    def calc(a,o,b):
        try:
            return {"+":lambda:a+b,"-":lambda:a-b,"*":lambda:a*b,"/":lambda:a/b,"%":lambda:a%b}[o]()
        except (ZeroDivisionError,KeyError): return None
    @staticmethod
    def compare(a,o,b): return {">":a>b,"<":a<b,">=":a>=b,"<=":a<=b,"==":a==b,"!=":a!=b}[o]
