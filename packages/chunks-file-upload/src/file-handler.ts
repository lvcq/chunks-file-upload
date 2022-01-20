/**
 *  文件上传处理器
 */

import { Subject } from "rxjs";
import { getBlobHash, getFileHash } from "./hash";
import { HttpRequest } from "./http-request";
import { FileUploadProgress, FileHandlerStatus, ChunkStatus } from './model';

export class FileHandler {
    private file: File;
    private http: HttpRequest;
    private filename = '';
    private size = 0;
    private status: FileHandlerStatus = FileHandlerStatus.INITIAL;
    private chunks: Array<ChunkInfo> = [];
    private chunkSize: number;
    private precent = 0;
    private hash = '';
    private id: string | number = ''
    private chunkMap: Map<string, ChunkInfo> = new Map();
    private messageSubject: Subject<FileUploadProgress> | null = null;

    constructor(options: FileHandlerOptions) {
        this.file = options.file;
        this.http = options.http;
        this.chunkSize = options.chunkSize;
        this.filename = this.file.name;
        this.size = this.file.size;
        this.messageSubject = options.messageSubject;
        this.startUpload();
    }

    /**
     *   启动上传流程
     * 第一步：计算文件hash(比较耗时)
     * 第二步：将文件信息发送到服务器，
     *        1. 如果文件已完全上传到服务器，返回已上传，上传流程结束；
     *        2. 如果文件部分上传，用服务器中的信息覆盖文件信息，记录已上传部分，然后上传未上传部分；
     *        3. 如果文件在服务器中不存在，启动全新的上传流程。
     */
    async startUpload() {
        if (this.status === FileHandlerStatus.UPLOADING || this.status === FileHandlerStatus.SUCCESS) {
            this.emitStatus();
            return;
        }
        try {
            /**
             * 计算文件hash
             */
            if (!this.hash) {
                this.status = FileHandlerStatus.COMPUTE_HASH;
                this.emitStatus();
                this.hash = await getFileHash(this.file);
            }
            /**
             * 从服务器获取文件信息
             */
            this.status = FileHandlerStatus.UPLOADING;
            this.emitStatus();
            console.log('----get file info-----');
            const fileInfo: FileInfoResponse = await this.http.sendFileinfo({
                filename: this.filename,
                hash: this.hash,
                size: this.size,
                chunkSize: this.chunkSize
            })
            if (!fileInfo.success || !fileInfo.data) {
                console.log(fileInfo.message);
                this.status = FileHandlerStatus.FAIL;
                return;
            }
            const { uploadType, id, chunkSize, chunks } = fileInfo.data;
            this.id = id;
            console.log('type::::', uploadType);
            switch (uploadType) {
                case 'NOT_EXIST' /* 新上传文件，服务器中不存在该文件 */:
                    this.sliceFileAndUpload();
                    break;
                case 'PATIAL':
                    this.resumeUpload(chunkSize, chunks);
                    break;
                case 'EXIST':
                    this.notNeedUpload();
                    break;
            }
        } catch (err) {
            this.status = FileHandlerStatus.FAIL;
        }
    }

    private notNeedUpload() {
        this.status = FileHandlerStatus.SUCCESS;
        this.precent = 100;
        this.emitStatus();
    }

    private async resumeUpload(chunkSize: number, chunks: Array<ChunkResponse>) {
        this.chunkSize = chunkSize;
        this.chunks = [];
        chunks.forEach(({ hash, start, uploaded, index, isFinished, size }) => {
            const chunk: ChunkInfo = {
                hash,
                start,
                end: start + size,
                uploaded,
                precent: (uploaded - start) / size,
                status: isFinished ? ChunkStatus.COMPLETE : ChunkStatus.TO_BE_UPLOAD,
                xhr: null,
                index
            };
            this.chunks.push(chunk);
            this.chunkMap.set(`${hash}-${index}`, chunk);
        })
        this.chunkUpdate();
        await this.sliceFileAndUpload();

    }

    private async sliceFileAndUpload() {
        const chunks = Math.ceil(this.size / this.chunkSize);
        let currentChunk = 0;
        while (currentChunk < chunks) {
            const start = this.chunkSize * currentChunk;
            const end = (start + this.chunkSize >= this.size) ? this.size : (start + this.chunkSize);
            const fileSlice = File.prototype.slice.call(this.file, start, end);
            const sliceHash = await getBlobHash(fileSlice);
            /**
             * 通过hash判断是否已经缓存
             */
            let chunk: ChunkInfo;
            const key = `${sliceHash}-${currentChunk}`;
            if (this.chunkMap.has(key)) {
                chunk = this.chunkMap.get(key) as ChunkInfo;
            } else {
                chunk = {
                    hash: sliceHash,
                    start,
                    uploaded: start,
                    end,
                    precent: 0,
                    status: ChunkStatus.TO_BE_UPLOAD,
                    xhr: null,
                    index: currentChunk
                };
                this.chunks.push(chunk);
                this.chunkMap.set(key, chunk);
            }
            if (chunk.status !== ChunkStatus.COMPLETE) {
                let sliceData = fileSlice;
                chunk.status = ChunkStatus.UPLOADING
                if (chunk.uploaded > chunk.start) {
                    sliceData = File.prototype.slice.call(this.file, chunk.uploaded, chunk.end);
                }
                const { xhr, response } = this.http.sendChunk({
                    id: String(this.id),
                    fileHash: this.hash,
                    sliceHash,
                    start,
                    end,
                    fileSlice: sliceData,
                    index: currentChunk
                });
                chunk.xhr = xhr;
                response.then(res => {
                    if (res && res.success) {
                        chunk.status = ChunkStatus.COMPLETE;
                        chunk.uploaded = end;
                        chunk.precent = 100;
                    } else {
                        chunk.status = ChunkStatus.FAIL;
                    }
                    chunk.xhr = null;
                    this.chunkUpdate();
                }).catch(() => {
                    chunk.status = this.status === FileHandlerStatus.SUSPEND ? ChunkStatus.CANCEL : ChunkStatus.FAIL;
                    chunk.xhr = null;
                    this.chunkUpdate();
                })
            }
            currentChunk += 1;
        }
    }

    private emitStatus() {
        const message: FileUploadProgress = {
            filename: this.filename,
            percent: this.precent,
            status: this.status,
            chunks: this.chunks.map(item => ({
                status: item.status,
                index: item.index,
                precent: item.precent
            })).sort((a, b) => a.index - b.index)
        }
        this.messageSubject?.next(message)
    }

    private chunkUpdate() {
        this.updatePercent();
        this.updateStatus();
        this.emitStatus();
    }
    private updatePercent() {
        const upload = this.chunks.reduce((a, b) => { return a + (b.uploaded - b.start) }, 0);
        const precent = (upload / this.size) * 100
        if (precent) {
            this.precent = precent;
        }
    }

    private updateStatus() {
        if(this.status===FileHandlerStatus.SUSPEND && this.chunks.some(item=>item.status===ChunkStatus.CANCEL)){
            this.status = FileHandlerStatus.SUSPEND;
        }
        if (this.chunks.some(item => item.status === ChunkStatus.UPLOADING)) {
            this.status = FileHandlerStatus.UPLOADING;
        } else if (this.chunks.some(item => item.status === ChunkStatus.FAIL)) {
            this.status = FileHandlerStatus.FAIL;
        } else if (this.chunks.every(item => item.status === ChunkStatus.COMPLETE)) {
            if (this.chunks.length === Math.ceil(this.size / this.chunkSize)) {
                this.status = FileHandlerStatus.SUCCESS;
            }
        }
    }

    /**
     * 暂停功能，上传中的切片调用 xhr.abort()
     */
    pause() {
        this.chunks.filter(item => item.status === ChunkStatus.UPLOADING)
            .forEach(item => {
                if (item.xhr) {
                    item.xhr.abort();
                }
            });
        this.status = FileHandlerStatus.SUSPEND;
        this.emitStatus();
    }

}

export interface FileHandlerOptions {
    file: File;
    http: HttpRequest,
    chunkSize: number,
    messageSubject: Subject<FileUploadProgress>
}



export interface ChunkInfo {
    hash: string;
    start: number;
    end: number;
    uploaded: number;
    precent: number;
    status: ChunkStatus,
    xhr: XMLHttpRequest | null;
    index: number;
}

export interface ChunkResponse {
    hash: string,
    start: number,
    uploaded: number,
    index: number,
    isFinished: boolean,
    size: number
}

export interface FileInfoResponse {
    success: boolean;
    message?: string;
    data?: {
        uploadType: 'NOT_EXIST' | 'PATIAL' | 'EXIST';
        id: string;
        chunkSize: number;
        chunks: Array<ChunkResponse>
    }
}