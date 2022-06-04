import { BasicREPL } from "../repl";

import { Type } from "../ast";
import { importObject, addLibs } from "./import-object.test";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { typeCheck } from "./helpers.test";
import { expect } from "chai";


// localStorage.js
/*
global.localStorage = {
    data: {},
    getItem(key) {
        // throw new Error("Call gewtItme");
        return this.data[key];
    },
    setItem(key, value) {
        // throw new Error("Call setItem");
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    length: 0,
    clear() {
        this.data = {}
    },
    key(index: number): string {
        return ""
    }
};
*/


describe("File System testing", () => {
    assertTCFail("read fail (need one more argument)", `
    f:File = None
    f = open(0, 0)
    f.read()
    f.close()`);


    const s8 = `
    f:File = None
    f = open(0, 0)
    f.write()
    f.close()`;
    assertTCFail("not correct mode for write", s8);

    const s9 = `
    f:File = None
    f = open(0, 3)
    f.read(1)
    f.write(1)
    f.close()`
    assertTC("open/read/write/close/pass type check", s9, { tag: 'none' });
})

describe("Node FilSystem testing", () => {
    const nfs1 = `
    f:File = None
    f = open(1, 3)
    f.read(1)
    f.write(1)
    f.close()`
    assertTC("open/read/write/close success in node", nfs1, { tag: 'none' });

    assertPrint("node fs read correct1", `
    x : int  = 0
    f:File = None
    f = open(2, 3)
    f.write(1)
    x = f.read(1)
    f.close()
    print(x)`, [`1`]);

    assertPrint("node fs read correct2", `
    x : int  = 0
    f:File = None
    f = open(3, 3)
    f.write(1)
    f.write(2)
    x = f.read(1)
    f.close()
    print(x)`, [`2`]);
    assertPrint("node fs write/close/read success", `
    x : int  = 0
    f1:File = None
    f2:File = None
    f1 = open(4,2)
    f1.write(1)
    f1.close()
    f2 = open(4,1)
    x = f2.read(1)
    f2.close()
    print(x)`, [`1`]);

    assertFail("read EOF", `
    x : int  = 0
    f:File = None
    f = open(5, 1)
    x = f.read(1)
    f.close()`);
})
/*
assertPrint("simple read write",
`
f:File = None
f = open(0, 3)
f.write(5)
f.seek(0)
print(f.read(1))
`, [`5`]),
assertFail("read fail",
`
f:File = None
f = open(0, 3)
f.read(0)
f.close()`)
*/
