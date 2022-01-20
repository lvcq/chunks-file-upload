import { FileUploadProgress } from './model';
export declare class ChunksFileUpload {
    private chunkSize;
    private server;
    private http;
    private uploadingMap;
    private progressSubject;
    progress$: import("rxjs").Observable<FileUploadProgress>;
    constructor(options?: ChunksFileUploadOptions);
    /**
     * 开始上传文件
     */
    upload(file: File): Promise<void>;
    pause(file: File): void;
}
export interface ChunksFileUploadOptions {
    chunkSize?: number;
    server?: string;
}
//# sourceMappingURL=chunks-file-upload.d.ts.map