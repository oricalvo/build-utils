export function promisifyNodeFn1<T, R>(func): (arg: T) => Promise<R> {
    return function(arg: T): Promise<R> {
        return new Promise((resolve, reject) => {
            func(arg, function (err, res) {
                if(err) {
                    reject(err);
                    return;
                }

                resolve(res);
            });
        });
    }
}

export function promisifyNodeFn2<T1, T2, R>(func): (arg1: T1, arg2: T2) => Promise<R> {
    return function(arg1: T1, arg2: T2): Promise<R> {
        return new Promise((resolve, reject) => {
            func(arg1, arg2, function (err, res) {
                if(err) {
                    reject(err);
                    return;
                }

                resolve(res);
            });
        });
    }
}

export function promisifyNodeFn3<T1, T2, T3, R>(func): (arg1: T1, arg2: T2, arg3: T3) => Promise<R> {
    return function(arg1: T1, arg2: T2, arg3: T3): Promise<R> {
        return new Promise((resolve, reject) => {
            func(arg1, arg2, arg3, function (err, res) {
                if(err) {
                    reject(err);
                    return;
                }

                resolve(res);
            });
        });
    }
}

export function delay(ms): Promise<void> {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, ms);
    }) as any;
}

export class PromiseBuilder {
    static fromNodeStream(stream): PromiseBuilderOnStream {
        return new PromiseBuilderOnStream(stream);
    }
}

export class PromiseBuilderOnStream {
    private end;
    private begin;

    constructor(stream) {
        this.end = this.begin = stream;
    }

    pipe(pipe) {
        this.end = this.end.pipe(pipe);

        return this;
    }

    build() {
        var me = this;

        return new Promise(function (resolve, reject) {
            //
            //  Must read the stream completely (flowing mode), else, no end event will occur
            //
            me.end.resume();

            me.end.on('end', function () {
                resolve();
            });

            me.end.on('error', function (err) {
                me.begin.end();

                reject(err);
            });
        });
    }
}
