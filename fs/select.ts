import {Observable} from "rxjs";
import * as minimatch from "minimatch";
import * as Rx from "rxjs";
import * as fsExtra from "fs-extra";
import * as path from "path";
import * as fs from "fs";
import * as Bluebird from "bluebird";
import {isDirectory} from "./helpers";

const readdir = Bluebird.promisify(fs.readdir);

export function walk(dir: string): FileSet {
    return new FileSet(dir);
}

interface FileSetPipe {
    run(dir: string, obs: Observable<string>): Observable<string>;
}

class FileFilter implements FileSetPipe {
    glob: string;

    constructor(glob: string) {
        this.glob = glob;
    }

    run(dir: string, obs: Observable<string>): Observable<string> {
        return obs.filter(file => minimatch(file, this.glob));
    }
}

class FileInclude implements FileSetPipe {
    glob: string;

    constructor(glob: string) {
        this.glob = glob;
    }

    run(dir: string, obs: Observable<string>): Observable<string> {
        return Rx.Observable.concat(obs, FileSet.scan(dir, this.glob, "", {files: true, dirs: false, recursive: true}));
    }
}

// class IncludeDirsExcept implements FileSetPipe {
//     constructor(public excludeList: string[]) {
//     }
//
//     run(dir: string, obs: Observable<string>): Observable<string> {
//         return Rx.Observable.concat(obs, FileSet.scanDirs(dir).filter(dir => {
//             for(let exclude of this.excludeList) {
//                 if(minimatch(dir, exclude)) {
//                     return false;
//                 }
//             }
//
//             return true;
//         }));
//     }
// }

class FileExclude implements FileSetPipe {
    glob: string;

    constructor(glob: string) {
        this.glob = glob;
    }

    run(dir: string, obs: Observable<string>): Observable<string> {
        return obs.filter(file => !minimatch(file, this.glob));
    }
}

interface ScanOptions {
    recursive?: boolean,
    dirs?: boolean,
    files?: boolean
}

class Scan implements FileSetPipe {
    constructor(public glob: string, public options: ScanOptions) {
    }

    run(root: string, obs: Observable<string>): Observable<string> {
        //console.log("Scan.run: " + root);

        return obs.map(x => {
            //console.log("XXX", x);
            return x;
        }).flatMap(relFile => {
            relFile = (relFile == "." ? "" : relFile);
            console.log("relFile", relFile);
            const full = (root!=="" ? root + "/" : "") + relFile;
            //console.log("ZZZ", full);
            return FileSet.scan(full, relFile, this.glob, this.options)
        });
        //return Rx.Observable.concat(obs, FileSet.scan(dir, this.glob, this.options));
    }
}

class CopyTo implements FileSetPipe {
    dest: string;

    constructor(dest: string) {
        this.dest = dest;
    }

    run(dir: string, obs) {
        return obs.flatMap(file => {
            return Rx.Observable.create(observer=> {
                fsExtra.copy(file, this.dest + "\\" + path.parse(file).base, function(err) {
                    if(err) {
                        observer.error(err);
                        return;
                    }

                    observer.next(file);

                    observer.complete();
                });
            });
        });
    }
}

class FileSet {
    dir: string;
    pipes: FileSetPipe[];

    constructor(dir: string) {
        this.dir = dir;
        this.pipes = [];
    }

    filter(glob: string) {
        this.pipes.push(new FileFilter(glob));

        return this;
    }

    // includeDirsExcept(excludeList: string[]) {
    //     this.pipes.push(new IncludeDirsExcept(excludeList));
    //
    //     return this;
    // }

    include(glob: string) {
        this.pipes.push(new FileInclude(glob));

        return this;
    }

    exclude(glob) {
        this.pipes.push(new FileExclude(glob));

        return this;
    }

    scan(glob?: string|ScanOptions, options?: ScanOptions) {
        if(typeof glob === "string") {
            this.pipes.push(new Scan(glob, options));
        }
        else {
            this.pipes.push(new Scan("**", glob));
        }

        return this;
    }

    subscribe(callback) {
        //const root = path.resolve(this.dir);
        //console.log("root", this.dir);
        let obs = Rx.Observable.of(".");

        for(let pipe of this.pipes) {
            obs = pipe.run(this.dir, obs);
        }

        obs.subscribe(callback);
    }

    copyTo(dest) {
        this.pipes.push(new CopyTo(dest));

        return this;
    }

    static scan(dir: string, glob: string, base: string, options: ScanOptions): Observable<string> {
        //console.log("scan: " + dir);

        return Rx.Observable.create(observer => {
            FileSet.doScan(dir, glob, base, observer, options).then(() => {
                observer.complete();
            }, err => {
                observer.error(err);
            });
        });
    }

    static async doScan(dir, glob, base, observer, options: ScanOptions) {
        const files = await readdir(dir);
        const promises = [];

        options.files = (options.files===false ? false : true);
        options.dirs = (options.dirs===true ? true : false);
        options.recursive = (options.recursive===false ? false : true);

        for (let file of files) {
            let filePath = path.join(dir, file);
            let relPath = (base ? base + "/" + file : file);

            if(await isDirectory(filePath)) {
                if(options.dirs) {
                    observer.next(relPath);
                }

                if(options.recursive) {
                    promises.push(FileSet.doScan(filePath, glob, relPath, observer, options));
                }
            }
            else if(options.files && minimatch(relPath, glob)) {
                observer.next(relPath);
            }
        }

        return Promise.all(promises);
    }
}
