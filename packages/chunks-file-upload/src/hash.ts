import {async} from 'rxjs';
import SparkMD5 from 'spark-md5'

export function getFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    const chunkSize = 100 * 1024 * 1024; // 100M
    const spark = new SparkMD5.ArrayBuffer();
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    fileReader.onload = function (e) {
      spark.append(e.target?.result as any);
      currentChunk += 1;
      if (currentChunk < chunks) {
        loadFileChunk(currentChunk, chunkSize, file, fileReader);
      } else {
        resolve(spark.end());
      }
    };
    fileReader.onerror = function (err) {
      reject(err);
    }
    loadFileChunk(currentChunk, chunkSize, file, fileReader)
  });
}

function loadFileChunk(current: number, size: number, file: File, fileReader: FileReader) {
  const start = current * size;
  const end = ((start + size) >= file.size) ? file.size : start + size;
  fileReader.readAsArrayBuffer(File.prototype.slice.call(file, start, end));
}

export async function getBlobHash(data: Blob): Promise<string> {
  const spark = new SparkMD5.ArrayBuffer();
  const buffer = await data.arrayBuffer();
  spark.append(buffer);
  return spark.end();
}
