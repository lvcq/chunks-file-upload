"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkStatus = exports.FileHandlerStatus = void 0;
var FileHandlerStatus;
(function (FileHandlerStatus) {
    /** 初始状态 */
    FileHandlerStatus["INITIAL"] = "initial";
    /** 计算文件hash */
    FileHandlerStatus["COMPUTE_HASH"] = "compute_hash";
    /** 上传中 */
    FileHandlerStatus["UPLOADING"] = "uploading";
    /** 上传成功 */
    FileHandlerStatus["SUCCESS"] = "success";
    /** 上传失败 */
    FileHandlerStatus["FAIL"] = "fail";
    /** 暂停中 */
    FileHandlerStatus["SUSPEND"] = "suspend";
})(FileHandlerStatus = exports.FileHandlerStatus || (exports.FileHandlerStatus = {}));
var ChunkStatus;
(function (ChunkStatus) {
    ChunkStatus["TO_BE_UPLOAD"] = "to be upload";
    ChunkStatus["UPLOADING"] = "uploading";
    ChunkStatus["COMPLETE"] = "complete";
    ChunkStatus["FAIL"] = "fail";
    ChunkStatus["CANCEL"] = "cancel";
})(ChunkStatus = exports.ChunkStatus || (exports.ChunkStatus = {}));
