interface UUIDOptions {
    node?: any[];
    clockseq?: number;
    msecs?: number|Date;
    nsecs?: number;
}

interface UUID {
    v4(options?: UUIDOptions): string;
}

declare var uuid: UUID;

declare module "node-uuid" {
    export = uuid;
}