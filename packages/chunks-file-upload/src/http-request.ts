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
  index: number
}

export class HttpRequest {
  private server: string;

  constructor(options: HttpRequestOptions) {
    this.server = options.server;
  }

  sendChunk(params: ChunkParams) {
    const url = this.server + '/fileupload/chunk';
    const data = new FormData();
    data.append('file', params.fileHash);
    data.append('slice', params.sliceHash);
    data.append('start', String(params.start));
    data.append('end', String(params.end));
    data.append('fileSlice', params.fileSlice);
    data.append('index', String(params.index));
    data.append('fileId', params.id);
    const { xhr, promiseObj } = this.httpSend(url, 'POST', data, {}, (ev) => { console.log(ev) });
    return {
      xhr,
      response: promiseObj.then(text => JSON.parse(text))
    }
  }

  async sendFileinfo(params: FileInfo) {
    const data = JSON.stringify(params);
    const url = this.server + '/fileupload/info';
    const resText: string = await this.httpSend(url, "POST", data).promiseObj;
    return JSON.parse(resText)
  }

  private httpSend(url: string,
    method = "GET",
    data: string | FormData = "",
    headers: { [key: string]: string } = {},
    onProgress: ((ev: any) => void) | null = null): { promiseObj: Promise<string>, xhr: XMLHttpRequest } {
    const xhr = new XMLHttpRequest();
    const promiseObj: Promise<string> = new Promise((resolve, reject) => {

      let contentType = 'application/json;charset=utf8';
      if (headers['Content-Type']) {
        contentType = headers['Content-Type']
      }
      xhr.open(method, url, true);
      if (typeof data === 'string') {
        xhr.setRequestHeader('Content-Type', contentType);
      }
      if (['GET'].indexOf(method.toUpperCase()) > -1) {
        xhr.send();
      } else {
        xhr.send(data);
      }
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          resolve(xhr.responseText);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(xhr.status);
        }
        xhr.onerror = () => {
          reject('ajax error');
        }
        if (onProgress) {
          xhr.onprogress = (ev) => {
            onProgress.call(xhr, ev);
          }
        }
      }
    });
    return {
      promiseObj,
      xhr
    }
  }


}

export interface HttpRequestOptions {
  server: string;
}
