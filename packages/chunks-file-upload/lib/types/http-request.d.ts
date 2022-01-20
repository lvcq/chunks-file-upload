export interface FileInfo {
    filename: string;
    hash: string;
    size: number;
    chunkSize: number;
}
export interface ChunkParams {
    id: string;
    fileHash: string;
    sliceHash: string;
    start: number;
    end: number;
    fileSlice: Blob;
    index: number;
}
export declare class HttpRequest {
    private server;
    constructor(options: HttpRequestOptions);
    sendChunk(params: ChunkParams): {
        xhr: XMLHttpRequest;
        response: Promise<any>;
    };
    sendFileinfo(params: FileInfo): Promise<any>;
    private httpSend;
}
export interface HttpRequestOptions {
    server: string;
}
//# sourceMappingURL=http-request.d.ts.map