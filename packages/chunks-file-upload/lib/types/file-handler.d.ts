/**
 *  文件上传处理器
 */
import { Subject } from "rxjs";
import { HttpRequest } from "./http-request";
import { FileUploadProgress, ChunkStatus } from './model';
export declare class FileHandler {
    private file;
    private http;
    private filename;
    private size;
    private status;
    private chunks;
    private chunkSize;
    private precent;
    private hash;
    private id;
    private chunkMap;
    private messageSubject;
    constructor(options: FileHandlerOptions);
    /**
     *   启动上传流程
     * 第一步：计算文件hash(比较耗时)
     * 第二步：将文件信息发送到服务器，
     *        1. 如果文件已完全上传到服务器，返回已上传，上传流程结束；
     *        2. 如果文件部分上传，用服务器中的信息覆盖文件信息，记录已上传部分，然后上传未上传部分；
     *        3. 如果文件在服务器中不存在，启动全新的上传流程。
     */
    startUpload(): Promise<void>;
    private notNeedUpload;
    private resumeUpload;
    private sliceFileAndUpload;
    private emitStatus;
    private chunkUpdate;
    private updatePercent;
    private updateStatus;
    /**
     * 暂停功能，上传中的切片调用 xhr.abort()
     */
    pause(): void;
}
export interface FileHandlerOptions {
    file: File;
    http: HttpRequest;
    chunkSize: number;
    messageSubject: Subject<FileUploadProgress>;
}
export interface ChunkInfo {
    hash: string;
    start: number;
    end: number;
    uploaded: number;
    precent: number;
    status: ChunkStatus;
    xhr: XMLHttpRequest | null;
    index: number;
}
export interface ChunkResponse {
    hash: string;
    start: number;
    uploaded: number;
    index: number;
    isFinished: boolean;
    size: number;
}
export interface FileInfoResponse {
    success: boolean;
    message?: string;
    data?: {
        uploadType: 'NOT_EXIST' | 'PATIAL' | 'EXIST';
        id: string;
        chunkSize: number;
        chunks: Array<ChunkResponse>;
    };
}
//# sourceMappingURL=file-handler.d.ts.map