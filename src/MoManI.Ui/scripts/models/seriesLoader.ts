export class SeriesLoader<T> {
    totalCount: number;
    loadedCount: number;
    loading: boolean;
    requests: (() => ng.IPromise<T>)[];
    results: T[];
    deferred: ng.IDeferred<T[]>;

    constructor($q: angular.IQService, requests: (() => ng.IPromise<T>)[]) {
        this.requests = requests;
        this.results = [];
        this.totalCount = this.requests.length;
        this.loadedCount = 0;
        this.deferred = $q.defer<T[]>();
    }

    load = (): ng.IPromise<T[]> => {
        this.loading = true;
        this.loadNextItem();
        return this.deferred.promise;
    }

    private loadNextItem = () => {
        if (this.loadedCount === this.totalCount) {
            this.loading = false;
            this.deferred.resolve(this.results);
            return;
        }
        this.requests[this.loadedCount]().then((res) => {
            this.loadedCount++;
            this.results.push(res);
            this.loadNextItem();
        });
    }
}