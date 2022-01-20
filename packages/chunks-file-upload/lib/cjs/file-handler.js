"use strict";
/**
 *  文件上传处理器
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHandler = void 0;
var hash_1 = require("./hash");
var model_1 = require("./model");
var FileHandler = /** @class */ (function () {
    function FileHandler(options) {
        this.filename = '';
        this.size = 0;
        this.status = model_1.FileHandlerStatus.INITIAL;
        this.chunks = [];
        this.precent = 0;
        this.hash = '';
        this.id = '';
        this.chunkMap = new Map();
        this.messageSubject = null;
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
    FileHandler.prototype.startUpload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, fileInfo, _b, uploadType, id, chunkSize, chunks, err_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.status === model_1.FileHandlerStatus.UPLOADING || this.status === model_1.FileHandlerStatus.SUCCESS) {
                            this.emitStatus();
                            return [2 /*return*/];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, , 6]);
                        if (!!this.hash) return [3 /*break*/, 3];
                        this.status = model_1.FileHandlerStatus.COMPUTE_HASH;
                        this.emitStatus();
                        _a = this;
                        return [4 /*yield*/, (0, hash_1.getFileHash)(this.file)];
                    case 2:
                        _a.hash = _c.sent();
                        _c.label = 3;
                    case 3:
                        /**
                         * 从服务器获取文件信息
                         */
                        this.status = model_1.FileHandlerStatus.UPLOADING;
                        this.emitStatus();
                        console.log('----get file info-----');
                        return [4 /*yield*/, this.http.sendFileinfo({
                                filename: this.filename,
                                hash: this.hash,
                                size: this.size,
                                chunkSize: this.chunkSize
                            })];
                    case 4:
                        fileInfo = _c.sent();
                        if (!fileInfo.success || !fileInfo.data) {
                            console.log(fileInfo.message);
                            this.status = model_1.FileHandlerStatus.FAIL;
                            return [2 /*return*/];
                        }
                        _b = fileInfo.data, uploadType = _b.uploadType, id = _b.id, chunkSize = _b.chunkSize, chunks = _b.chunks;
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
                        return [3 /*break*/, 6];
                    case 5:
                        err_1 = _c.sent();
                        this.status = model_1.FileHandlerStatus.FAIL;
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    FileHandler.prototype.notNeedUpload = function () {
        this.status = model_1.FileHandlerStatus.SUCCESS;
        this.precent = 100;
        this.emitStatus();
    };
    FileHandler.prototype.resumeUpload = function (chunkSize, chunks) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.chunkSize = chunkSize;
                        this.chunks = [];
                        chunks.forEach(function (_a) {
                            var hash = _a.hash, start = _a.start, uploaded = _a.uploaded, index = _a.index, isFinished = _a.isFinished, size = _a.size;
                            var chunk = {
                                hash: hash,
                                start: start,
                                end: start + size,
                                uploaded: uploaded,
                                precent: (uploaded - start) / size,
                                status: isFinished ? model_1.ChunkStatus.COMPLETE : model_1.ChunkStatus.TO_BE_UPLOAD,
                                xhr: null,
                                index: index
                            };
                            _this.chunks.push(chunk);
                            _this.chunkMap.set("".concat(hash, "-").concat(index), chunk);
                        });
                        this.chunkUpdate();
                        return [4 /*yield*/, this.sliceFileAndUpload()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    FileHandler.prototype.sliceFileAndUpload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, currentChunk, _loop_1, this_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chunks = Math.ceil(this.size / this.chunkSize);
                        currentChunk = 0;
                        _loop_1 = function () {
                            var start, end, fileSlice, sliceHash, chunk, key, sliceData, _b, xhr, response;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        start = this_1.chunkSize * currentChunk;
                                        end = (start + this_1.chunkSize >= this_1.size) ? this_1.size : (start + this_1.chunkSize);
                                        fileSlice = File.prototype.slice.call(this_1.file, start, end);
                                        return [4 /*yield*/, (0, hash_1.getBlobHash)(fileSlice)];
                                    case 1:
                                        sliceHash = _c.sent();
                                        key = "".concat(sliceHash, "-").concat(currentChunk);
                                        if (this_1.chunkMap.has(key)) {
                                            chunk = this_1.chunkMap.get(key);
                                        }
                                        else {
                                            chunk = {
                                                hash: sliceHash,
                                                start: start,
                                                uploaded: start,
                                                end: end,
                                                precent: 0,
                                                status: model_1.ChunkStatus.TO_BE_UPLOAD,
                                                xhr: null,
                                                index: currentChunk
                                            };
                                            this_1.chunks.push(chunk);
                                            this_1.chunkMap.set(key, chunk);
                                        }
                                        if (chunk.status !== model_1.ChunkStatus.COMPLETE) {
                                            sliceData = fileSlice;
                                            chunk.status = model_1.ChunkStatus.UPLOADING;
                                            if (chunk.uploaded > chunk.start) {
                                                sliceData = File.prototype.slice.call(this_1.file, chunk.uploaded, chunk.end);
                                            }
                                            _b = this_1.http.sendChunk({
                                                id: String(this_1.id),
                                                fileHash: this_1.hash,
                                                sliceHash: sliceHash,
                                                start: start,
                                                end: end,
                                                fileSlice: sliceData,
                                                index: currentChunk
                                            }), xhr = _b.xhr, response = _b.response;
                                            chunk.xhr = xhr;
                                            response.then(function (res) {
                                                if (res && res.success) {
                                                    chunk.status = model_1.ChunkStatus.COMPLETE;
                                                    chunk.uploaded = end;
                                                    chunk.precent = 100;
                                                }
                                                else {
                                                    chunk.status = model_1.ChunkStatus.FAIL;
                                                }
                                                chunk.xhr = null;
                                                _this.chunkUpdate();
                                            }).catch(function () {
                                                chunk.status = _this.status === model_1.FileHandlerStatus.SUSPEND ? model_1.ChunkStatus.CANCEL : model_1.ChunkStatus.FAIL;
                                                chunk.xhr = null;
                                                _this.chunkUpdate();
                                            });
                                        }
                                        currentChunk += 1;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 1;
                    case 1:
                        if (!(currentChunk < chunks)) return [3 /*break*/, 3];
                        return [5 /*yield**/, _loop_1()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FileHandler.prototype.emitStatus = function () {
        var _a;
        var message = {
            filename: this.filename,
            percent: this.precent,
            status: this.status,
            chunks: this.chunks.map(function (item) { return ({
                status: item.status,
                index: item.index,
                precent: item.precent
            }); }).sort(function (a, b) { return a.index - b.index; })
        };
        (_a = this.messageSubject) === null || _a === void 0 ? void 0 : _a.next(message);
    };
    FileHandler.prototype.chunkUpdate = function () {
        this.updatePercent();
        this.updateStatus();
        this.emitStatus();
    };
    FileHandler.prototype.updatePercent = function () {
        var upload = this.chunks.reduce(function (a, b) { return a + (b.uploaded - b.start); }, 0);
        var precent = (upload / this.size) * 100;
        if (precent) {
            this.precent = precent;
        }
    };
    FileHandler.prototype.updateStatus = function () {
        if (this.status === model_1.FileHandlerStatus.SUSPEND && this.chunks.some(function (item) { return item.status === model_1.ChunkStatus.CANCEL; })) {
            this.status = model_1.FileHandlerStatus.SUSPEND;
        }
        if (this.chunks.some(function (item) { return item.status === model_1.ChunkStatus.UPLOADING; })) {
            this.status = model_1.FileHandlerStatus.UPLOADING;
        }
        else if (this.chunks.some(function (item) { return item.status === model_1.ChunkStatus.FAIL; })) {
            this.status = model_1.FileHandlerStatus.FAIL;
        }
        else if (this.chunks.every(function (item) { return item.status === model_1.ChunkStatus.COMPLETE; })) {
            if (this.chunks.length === Math.ceil(this.size / this.chunkSize)) {
                this.status = model_1.FileHandlerStatus.SUCCESS;
            }
        }
    };
    /**
     * 暂停功能，上传中的切片调用 xhr.abort()
     */
    FileHandler.prototype.pause = function () {
        this.chunks.filter(function (item) { return item.status === model_1.ChunkStatus.UPLOADING; })
            .forEach(function (item) {
            if (item.xhr) {
                item.xhr.abort();
            }
        });
        this.status = model_1.FileHandlerStatus.SUSPEND;
        this.emitStatus();
    };
    return FileHandler;
}());
exports.FileHandler = FileHandler;
