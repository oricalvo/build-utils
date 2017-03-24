import * as fs from "fs";
import * as fsExtra from "fs-extra/lib";
import * as glob from "glob";
import * as Bluebird from "bluebird";
import * as path from "path";
import * as minimatch from "minimatch";

Bluebird.promisifyAll(fs);
Bluebird.promisifyAll(fsExtra);

export function directoryExists(dir) {
    return fs["statAsync"](dir).then(stat => {
        return stat.isDirectory();
    });
}

export function fileExists(path) {
    return isFile(path);
}

export async function isFile(path): Promise<boolean> {
    try {
        const stat = await getStat(path);
        return stat.isFile();
    }
    catch(err) {
        if(err.code == "ENOENT") {
            return false;
        }

        throw err;
    }
}

export function getStat(path) {
    return fs["statAsync"](path);
}

export async function isDirectory(path): Promise<boolean> {
    const stat = await getStat(path);
    return stat.isDirectory();
}

export async function deleteDirectory(path) {
    try {
        const isDir = await isDirectory(path);
        if (!isDir) {
            throw new Error("Specified path \"" + path + "\" is not a directory");
        }

        await fsExtra.removeAsync(path);
    }
    catch(err) {
        if(err.code == "ENOENT") {
            return;
        }

        throw err;
    }
}

export function createDirectory(path) {
    return fsExtra.mkdirAsync(path);
}

function getGlobBase(pattern) {
    let base = "";
    const parts = pattern.split("/");
    for(let part of parts) {
        if(!glob.hasMagic(part)) {
            if(base != "") {
                base += "/";
            }

            base += part;
        }
    }

    return base;
}

export async function copyGlob(pattern, dest) {
    const base = getGlobBase(pattern);
    const files = await searchGlob(pattern);
    return copyFiles(files, base, dest);
}

export function deleteGlob(pattern) {
    return new Promise(function(resolve, reject) {
        glob(pattern, {}, function (er, files) {
            Promise.all(files.map(file => {
                deleteFile(file);
            })).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    });
}

export function copyFile(from, to, ignoreDir = false) {
    return Promise.resolve().then(()=> {
        return fs["statAsync"](from).then(stat => {
            if (stat.isDirectory()) {
                if (!ignoreDir) {
                    throw new Error("Specified path is a directory");
                }
            }
            else {
                return fsExtra["copyAsync"](from, to);
            }
        });
    });
}

export function copyFiles(files, base, dest) {
    return Promise.all(files.map(file => {
        const relativeName = file.substring(base.length);
        return copyFile(file, path.posix.join(dest, relativeName), true)
    }));
}

export async function deleteFile(path) {
    try {
        const isDir = await isFile(path);
        if (!isDir) {
            throw new Error("Specified path \"" + path + "\" is not a file");
        }

        await fsExtra.remove(path);
    }
    catch(err) {
        if(err.code == "ENOENT") {
            return;
        }

        throw err;
    }
}

export function readFile(path, enc) {
    return fs["readFileAsync"](path, enc).then(res => {
        return res;
    });
}

export function writeFile(path, data, enc) {
    return fs["writeFileAsync"](path, data, enc);
}

export async function readJSONFile(path) {
    const text = await readFile(path, "utf8");
    const obj = JSON.parse(text);
    return obj;
}

export async function writeJSONFile(path, obj) {
    const text = JSON.stringify(obj, null, 2);
    await writeFile(path, text, "utf8");
}

export const searchGlob: (pattern: string)=>Promise<string[]> = Bluebird.promisify(glob);

export function excludeFiles(files, pattern) {
    return files.filter(file => {
        return !minimatch(file, pattern);
    });
}

export function appendFile(path: string, text: string) {
    return fs["appendFileAsync"](path, text);
}
