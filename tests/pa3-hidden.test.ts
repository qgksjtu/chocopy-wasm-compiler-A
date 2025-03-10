import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("PA3 hidden tests", () => {

  assertTC("call-type-checking", `
class C(object):
  def f(self : C, x : int) -> int:
    return x * 2

c : C = None
c = C()
c.f(4) + c.f(c.f(2))
  `, NUM);

  assertTCFail("call-type-checking-fail", `
class C(object):
  def f(self : C, x : int) -> int:
    return x * 2

c : C = None
c = C()
if c.f(c.f(2)):
  pass
else:
  pass
  `);

  // Assignability tests, None into class (return, assign, field assign)
  assertTC("none-assign", `
class C(object):
  def f(self: C) -> int:
    return 0
c : C = None
c = None`, NONE);

  assertTC("none-return", `
class C(object):
  def none(self: C) -> C:
    return None
    
C().none()`, CLASS("C", []));

  assertTC("none-field-assign", `
class C(object):
  box : C = None
  
c : C = None
c = C()
c.box = None`, NONE);

  // Type-checking block of method (keep checking after return?)
  assertTCFail("return-after-return", `
class C(object):
  def f(self: C) -> int:
    return 1
    return False`);
  
  assertTCFail("tc-error-after-return", `
class C(object):
  def f(self: C) -> int:
    return 1
    1 - True`);
  
  assertTCFail("no-return-just-expr", `
class C(object):
  def f(self: C) -> int:
    1`);
  
  
  // What's the type of a block? (function without return should err)
  assertTC("top-level-type-none", `
x : int = 0
x = 5 + 5`, NONE);

  assertTC("top-level-class", `
class C(object):
  x : int = 0`, NONE);
  
  assertTCFail("return-id", `
class C(object):
  x : int = 0
  def f(self: C) -> int:
    x`);
  
  // Return in one branch of if but not the other
  assertTCFail("return-in-one-branch", `
class C(object):
  def f(self: C) -> int:
    if True:
      return 0
    else:
      pass`);

  assertTCFail("return-none-in-branch", `
class C(object):
  def f(self: C) -> int:
    if True:
      return 0
    else:
      return`
  );

  // Check none is none
  assertPrint("none-is-none", `
print(None is None)`, [`True`]);


  assertPrint("alias-is-same", `
class C(object):
  x : int = 0
  
c1 : C = None
c2 : C = None
c1 = C()
c2 = c1
print(c1 is c2)`, ['True']);


  // NullPointerException (access fields/methods of None dynamically when it's a class)
  assertTC("field-of-none-tc", `
class C(object):
  x : int = 0
c : C = None
c.x`, NUM);

  assertFail("field-of-none", `
class C(object):
  x : int = 0
c1 : C = None
c2 : C = None
c1 = C()
c2.x`);

  assertFail("method-of-none", `
class C(object):
  other : C = None
  def f(self:C, other: C):
    other.f(self)
  
c : C = None
c = C()
c.f(None)`);

  // Check objects not equal (same classes, different classes, compare to none)
  // Type-checking of is (can't use int/bool)
  assertTC("is-different-classes", `
class C1(object):
  x : int = 0
class C2(object):
  x : int = 0
  
C1() is C2()`, BOOL);

  assertTCFail("is-num", `
x : int = 0
y : int = 0
y = x
x is y`);

  // Type-checking of == (can't use none/object)
  assertTCFail("eq-int-bool", `
1 == True
  `)

  assertTCFail("eq-class", `
class C(object):
  x : int = 0
C() == C()`);

  // Type-checking binary expressions with equal sides (bool, classes, not int)
  assertTCFail("plus-bool", `
True + True`);

  // Type-check bad arguments in method call
  assertTCFail("int-arg-not-bool", `
class C(object):
  def f(self: C, x : int) -> int:
    return 0
    
C().f(True)`);

  // Type-check method calls in general


  // Check assignability of None to args
  assertTC("none-arg", `
class C(object):
  def new(self: C, other: C) -> C:
    return self

C().new(None)`, CLASS("C", []));

  // Does __init__ get called
  assertTCFail("init-no-args", `
class C(object):
  n : int = 0
  def __init__(self: C, n : int):
    self.n = n`);
  
  assertTCFail("init-ret-type-1", `
class C(object):
  n : int = 0
  def __init__(self: C) -> C:
    self.n = 1`);

  assertTC("init-ret-type-2", `
class C(object):
  n : int = 0
  def __init__(self: C):
    self.n = 1`, NONE);

  assertPrint("init-gets-called", `
class C(object):
  n : int = 0
  def __init__(self: C):
    self.n = 1
    
print(C().n)`, [`1`]);


  // Recursive method calls
  assertTC("recursive-call-tc", `
class C(object):
  def fib(self: C, n: int) -> int:
    if n <= 0:
      return 1
    else:
      return n * self.fib(n-1)

C().fib(5)`, NUM);

  assertTCFail("recursive-call-tc-fails", `
class C(object):
  def fib(self: C, n: int):
    if n <= 0:
      return 1
    else:
      return n * self.fib(n-1)

C().fib(5)`);

  assertPrint("recursive-call", 
`
class C(object):
  def fib(self: C, n: int) -> int:
    if n <= 0:
      return 1
    else:
      return n * self.fib(n-1)
print(C().fib(5))`, [`120`])

  // Linked list with sum method with None as empty – realistic example
  assertPrint("linked-list", 
`
class LinkedList(object):
  value : int = 0
  next: LinkedList = None
  def new(self: LinkedList, value: int, next: LinkedList) -> LinkedList:
    self.value = value
    self.next = next
    return self

  def sum(self: LinkedList) -> int:
    if self.next is None:
      return self.value
    else:
      return self.value + self.next.sum()
l: LinkedList = None
l = LinkedList().new(1, LinkedList().new(2, LinkedList().new(3, None)))
print(l.sum())
print(l.next.sum())`, ['6', '5']);

  assertTC(
    "linked-list-tc",
    `
class LinkedList(object):
  value : int = 0
  next: LinkedList = None
  def new(self: LinkedList, value: int, next: LinkedList) -> LinkedList:
    self.value = value
    self.next = next
    return self

  def sum(self: LinkedList) -> int:
    if self.next is None:
      return self.value
    else:
      return self.value + self.next.sum()

l: LinkedList = None
l = LinkedList().new(1, LinkedList().new(2, LinkedList().new(3, None)))
l.next.sum()`, NUM);

  // correct number of things on the stack
  assertPrint("many-literals", `
print(1)
2
print(3)
4`, ['1', '3']);

  assertTCFail("expr-not-ret-type", `
class C(object):
  def f(self: C) -> int:
    if True:
      return 0
    else:
      1`);
  
  assertPrint("many-ifs", `
class C(object):
  def f(self: C):
    if True:
      1
    else:
      0
    if False:
      0
    else:
      1
c : C = None
c = C()
print(c.f())`, ['None']);

});
