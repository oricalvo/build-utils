import * as fs from "fs";
import * as fsExtra from "fs-extra/lib";
import * as glob from "glob";
import * as Bluebird from "bluebird";
import * as path from "path";
import * as minimatch from "minimatch";
import {promisifyNodeFn1} from "./promise";
import * as chokidar from "chokidar";
import {Stats} from "fs";

Bluebird.promisifyAll(fs);
Bluebird.promisifyAll(fsExtra);

export function getStat(path): Promise<Stats> {
    return fs["statAsync"](path);
}

export function directoryExists(dir) {
    return isDirectory(dir);
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

export async function isDirectory(path): Promise<boolean> {
    try {
        const stat = await getStat(path);
        return stat.isDirectory();
    }
    catch(err) {
        if(err.code == "ENOENT") {
            return false;
        }

        throw err;
    }
}

export async function deleteDirectory(path) {
    try {
        const isDir = await isDirectory(path);
        if (!isDir) {
            return;
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

export function ensureDirectory(path) {
    return fsExtra.ensureDirAsync(path);
}

function getGlobBase(pattern) {
    let base = "";
    let hasMagic = false;
    const parts = pattern.split("/");
    for(let part of parts) {
        if(!glob.hasMagic(part)) {
            if(base != "") {
                base += "/";
            }

            base += part;
        }
        else {
            hasMagic = true;
            break;
        }
    }

    if(!hasMagic) {
        return null;
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
        const info = await getStat(path);
        if(!info.isFile()) {
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

export async function writeJSONFile(path, obj, ident?) {
    const text = JSON.stringify(obj, null, ident);
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

export function replaceExt(filePath: string, ext: string) {
    const info  = path.parse(filePath);
    const res = path.join(info.dir, info.name + "." + ext);
    return res;
}

export const getDirectoryContent = promisifyNodeFn1<string, string[]>(fs.readdir);

export async function scanDirectoryTree(dirs: string|string[], callback: (file: string, index: number)=>void, concurrent: number): Promise<void> {
    if(typeof dirs == "string") {
        dirs = [dirs];
    }

    return <any>new Promise((resolve, reject) => {
        const pending = [];
        let running = 0;
        let count = 0;
        let err = null;

        for(const dir of dirs) {
            scan(dir);
        }

        async function scan(dir: string) {
            if (err) {
                return;
            }

            if (running >= concurrent) {
                pending.push(dir);
                return;
            }

            ++running;

            getDirectoryContent(dir).then(names => {
                if (err) {
                    return;
                }

                for (const name of names) {
                    const fullPath = path.join(dir, name);

                    ++running;

                    getStat(fullPath).then(stats => {
                        if (err) {
                            return;
                        }

                        if (stats.isDirectory()) {
                            scan(fullPath);
                        }
                        else if (stats.isFile()) {
                            try {
                                callback(fullPath, ++count);
                            }
                            catch(e) {
                                err = e;
                                reject(err);
                            }
                        }

                        --running;
                        more();
                    }).catch(e => {
                        if (err) {
                            return;
                        }

                        --running;

                        err = e;
                        reject(err);
                    });
                }

                --running;
            }).catch(e => {
                if (err) {
                    return;
                }

                --running;

                err = e;
                reject(err);
            });
        }

        function more() {
            process.nextTick(function () {
                if (pending.length > 0) {
                    const dir = pending.pop();

                    scan(dir);
                }
                else {
                    if (running == 0) {
                        done();
                    }
                }
            });
        }

        function done() {
        }
        resolve();
    });
}

export function watchGlob(pattern, dest) {
    const base = getGlobBase(pattern);
    let ready = false;

    const watcher = chokidar.watch(pattern, {
        persistent: true
    });

    function resolveTarget(filePath) {
        if(!base) {
            //
            //  pattern is not a glob but rather a file
            //  in that case dest should be full path to target
            //
            return dest;
        }

        const rel = path.relative(base, filePath);
        const target = path.join(dest, rel);
        return target;
    }

    function onAddOrChange(filePath) {
        if(!ready) {
            return;
        }

        const target = resolveTarget(filePath);
        console.log("Copying modified file from " + filePath + " to " + target);
        return copyFile(filePath, target);
    }

    function onUnlink(filePath) {
        if(!ready) {
            return;
        }

        const target = resolveTarget(filePath);
        console.log("Deleting file from " + target);
        return deleteFile(target);
    }

    watcher.on("add", onAddOrChange);
    watcher.on("change", onAddOrChange);
    watcher.on("unlink", onUnlink);

    watcher.on('ready', () => {
        //
        //  Ready is fired once chokidar finished travresing the file tree and raise add event
        //
        ready = true;
    });
}

export async function copyAssets(assets: Asset[], watch: boolean) {
    await Promise.all(assets.map(a => {
        if(!getGlobBase(a.source)) {
            return copyFile(a.source, a.target);
        }

        return copyGlob(a.source, a.target);
    }));

    if(watch) {
        Promise.all(assets.map(a => {
            return watchGlob(a.source, a.target);
        }));
    }
}

export interface Asset {
    source: string;
    target: string;
}

export function waitForFileCreation(folder: string, relativeFilePath: string) {
    return new Promise((resolve, reject)=> {
        const watcher = chokidar.watch(folder, {
            persistent: true
        });

        watcher
            .on("add", filePath => {
                if (filePath == path.normalize(path.join(folder, relativeFilePath))) {
                    resolve();

                    //
                    //  For somereason the close method does not work inside the current tick
                    //
                    process.nextTick(()=> {
                        watcher.close();
                    });
                }
            })
            .on("error", err => {
                reject(err);

                process.nextTick(()=> {
                    //
                    //  For somereason the close method does not work inside the current tick
                    //
                    watcher.close();
                });
            });
    });
}
