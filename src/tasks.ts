export type Task<T> = ()=>Promise<T>;

interface PendingTask {
    task: Task<any>;
    resolve;
    reject;
}

export class LimitConcurrency {
    private pending: PendingTask[] = [];
    private running: number = 0;
    private waitPromise: Promise<void> = null;
    private waitResolve = null;

    constructor(private limit: number) {
    }

    run<T>(task: Task<T>): Promise<T> {
        return new Promise((resolve, reject)=> {
            if(this.running >= this.limit) {
                this.pending.push({
                    task,
                    resolve,
                    reject
                });

                return;
            }

            this.process(task, resolve, reject);
        });
    }

    wait(): Promise<void> {
        if(this.running == 0 && this.pending.length==0) {
            return Promise.resolve();
        }

        if(!this.waitPromise) {
            this.waitPromise = <any>new Promise((resolve, reject) => {
                this.waitResolve = resolve;
            });
        }

        return this.waitPromise;
    }

    private process(task: Task<any>, resolve, reject) {
        ++this.running;

        const promise = task();

        if(!promise || !promise.then) {
            resolve(promise);

            --this.running;
            this.more();
            return;
        }

        promise.then(res => {
            resolve(res);

            --this.running;
            this.more();
        }).catch(err => {
            reject();

            --this.running;
            this.more();
        });
    }

    private more() {
        process.nextTick(()=> {
            if(this.pending.length > 0) {
                const pendingTask = this.pending.pop();

                this.process(pendingTask.task, pendingTask.resolve, pendingTask.reject)
            }
            else if(this.running == 0) {
                if(this.waitResolve) {
                    this.waitResolve();
                    this.waitResolve = null;
                    this.waitPromise = null;
                }
            }
        });
    }
}
