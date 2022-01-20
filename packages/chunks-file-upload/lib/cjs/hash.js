"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlobHash = exports.getFileHash = void 0;
var spark_md5_1 = __importDefault(require("spark-md5"));
function getFileHash(file) {
    return new Promise(function (resolve, reject) {
        var fileReader = new FileReader();
        var chunkSize = 100 * 1024 * 1024; // 100M
        var spark = new spark_md5_1.default.ArrayBuffer();
        var chunks = Math.ceil(file.size / chunkSize);
        var currentChunk = 0;
        fileReader.onload = function (e) {
            var _a;
            spark.append((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
            currentChunk += 1;
            if (currentChunk < chunks) {
                loadFileChunk(currentChunk, chunkSize, file, fileReader);
            }
            else {
                resolve(spark.end());
            }
        };
        fileReader.onerror = function (err) {
            reject(err);
        };
        loadFileChunk(currentChunk, chunkSize, file, fileReader);
    });
}
exports.getFileHash = getFileHash;
function loadFileChunk(current, size, file, fileReader) {
    var start = current * size;
    var end = ((start + size) >= file.size) ? file.size : start + size;
    fileReader.readAsArrayBuffer(File.prototype.slice.call(file, start, end));
}
function getBlobHash(data) {
    return __awaiter(this, void 0, void 0, function () {
        var spark, buffer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    spark = new spark_md5_1.default.ArrayBuffer();
                    return [4 /*yield*/, data.arrayBuffer()];
                case 1:
                    buffer = _a.sent();
                    spark.append(buffer);
                    return [2 /*return*/, spark.end()];
            }
        });
    });
}
exports.getBlobHash = getBlobHash;
