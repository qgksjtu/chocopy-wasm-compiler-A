/**************************
 * TypeScript      Side   *
 **************************/

var memory: WebAssembly.Memory;

export function setMemory(m: WebAssembly.Memory) {
    memory = m;
}

// What is the type for this open File
export type OpenFile = {
    filePath: string,
    currentPosition: number,   // the position of the current pointer
    mode: FileMode,            // the mode of this file  
    fileSize: number
}

enum FileMode {
    OPEN,   // Just open the file
    R_ONLY, // read only mode
    W_APPEND,  // append the data to the end
    RW,     // read and write mode
    W_CURR, // write to the current position. If wwe have data in the current position, we overwrite that piece of data  
}

export const buildin_file_libs = `
(func $buildin_open (import "imports" "buildin_open") (param i32) (param i32) (result i32))
(func $buildin_read (import "imports" "buildin_read") (param i32) (param i32) (result i32))
(func $buildin_write (import "imports" "buildin_write") (param i32) (param i32) (result i32))
(func $buildin_close (import "imports" "buildin_close") (param i32) (result i32))
(func $buildin_seek (import "imports" "buildin_seek") (param i32) (param i32) (result i32))
`;


export function exportFileBuildinFunc() {

}

let fdCounter = 0;
let fs = new Map<number, OpenFile>(); // track current open files


export function modeTranslator(mode: string): number {
    if (mode === "r") {
        return FileMode.R_ONLY
    }
    else if (mode === "r+") {
        return FileMode.RW
    }
    else if (mode === "w") {
        return FileMode.W_CURR
    }
    else if (mode === "w+") {
        return FileMode.W_APPEND
    }
    return -1
}

export function readStringFromMemory(address: number): string {
    return ""
}

/*
 * TODO Later: The input to open should be some value for string
 * right now pretend that we are creating a file without a fname string
 * 
 * ct: for the mode, we might need to create a 'mode translator' to translate from Python mode to our mode
 */
export function open(fileNameAddress: number, modeStringAddress: number): number {
    let fname = readStringFromMemory(fileNameAddress);
    let mode = readStringFromMemory(modeStringAddress);
    // check if the file exists, if not create a new one
    if (window.localStorage.getItem(fname) === null) {
        window.localStorage.setItem(fname, JSON.stringify([]));
    }
    fs.set(fdCounter++, {
        filePath: fname, // a dummy address. If we have string we should read the address
        currentPosition: 0,
        mode: modeTranslator(mode), // random mode
        fileSize: 0, // according to the current test case we should assign 0
    });

    return fdCounter - 1;
}

export function read(fd: number, numByte: number): number {
    numByte = 1; // DUMMY VALUE

    let file = checkFDExistence(fd);
    let data = window.localStorage.getItem(file.filePath);

    if (!data) {
        throw new Error("RUNTIME ERROR: EOF");
    }

    let dataArray: Array<number> = JSON.parse(data);

    file.fileSize = dataArray.length;

    if (file.currentPosition >= file.fileSize) {
        throw new Error("RUNTIME ERROR: EOF");
    }

    return dataArray[file.currentPosition];
}

export function write(fd: number, c: number): number {
    const file = checkFDExistence(fd);

    // check mode
    if (file.mode === FileMode.OPEN || file.mode === FileMode.R_ONLY) {
        throw new Error(`RUNTIME ERROR: file with fd = ${fd} is not writable (mode = ${file.mode})`);
    }

    let data = window.localStorage.getItem(file.filePath);
    let dataArray: Array<number> = data ? JSON.parse(data) : [];

    if (file.mode === FileMode.W_APPEND) {
        dataArray.push(c);
        file.currentPosition = dataArray.length;
    } else if (file.mode === FileMode.W_CURR || file.mode === FileMode.RW) {
        if (file.currentPosition === dataArray.length) { // append data to the end of the file
            dataArray.push(c);
            file.currentPosition = dataArray.length;
        } else {                                        // write data to the currentPosition 
            dataArray[file.currentPosition] = c;
            file.currentPosition++;
        }
    } else {
        throw new Error(`RUNTIME ERROR: Unknown write mode ${file.mode}`);
    }

    file.fileSize = dataArray.length;
    window.localStorage.setItem(file.filePath, JSON.stringify(dataArray));
    return - 1;
}

/**
 * What should we do when we close the file?
 * If it is dirty than, we should write the file to filePath
 * @param fd 
 */
export function close(fd: number) {
    const f = checkFDExistence(fd);

    // remove this file from file descriptor
    fs.delete(fd);
}

export function seek(fd: number, pos: number) {
    const file = checkFDExistence(fd);

    // check the boundary of the position
    if (pos < 0 || pos > file.fileSize) {
        throw new Error(`RUNTIME ERROR: invalid seek position ${pos}, valid range [0, ${file.fileSize}]`);
    }
    file.currentPosition = pos;

}

/**
 * Helper functions (private functions)
 */
function checkFDExistence(fd: number): OpenFile {
    if (!fs.has(fd)) {
        throw new Error(`RUNTIME ERROR: file with id = ${fd} does not exists`);
    }
    return fs.get(fd);
}

