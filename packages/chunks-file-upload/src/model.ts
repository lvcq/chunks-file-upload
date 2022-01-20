export enum FileHandlerStatus {
    /** 初始状态 */
    INITIAL = 'initial',
    /** 计算文件hash */
    COMPUTE_HASH= 'compute_hash',
    /** 上传中 */
    UPLOADING = 'uploading',
    /** 上传成功 */
    SUCCESS = 'success',
    /** 上传失败 */
    FAIL = 'fail',
    /** 暂停中 */
    SUSPEND = 'suspend'
}

export enum ChunkStatus {
    TO_BE_UPLOAD= 'to be upload',
    UPLOADING = 'uploading',
    COMPLETE = 'complete',
    FAIL = 'fail',
    CANCEL = 'cancel'
}

export interface FileUploadProgress {
    /* 文件名称 */
    filename: string;
    percent: number;
    status: FileHandlerStatus;
    chunks:Array<{
        status:ChunkStatus,
        index:number,
        precent:number
    }>
}
  