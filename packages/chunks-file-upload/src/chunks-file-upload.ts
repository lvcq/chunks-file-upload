import {DEFAULT_CHUNK_SIZE, DEFAULT_SERVER} from './constants';
import {BehaviorSubject} from 'rxjs';
import {HttpRequest} from './http-request';
import { FileHandler } from './file-handler';
import { FileHandlerStatus, FileUploadProgress } from './model';

export class ChunksFileUpload {

  private chunkSize = DEFAULT_CHUNK_SIZE;
  private server = DEFAULT_SERVER;
  private http: HttpRequest;
  private uploadingMap:WeakMap<File,FileHandler>= new WeakMap();

  private progressSubject = new BehaviorSubject<FileUploadProgress>({
    filename: '',
    percent: 0,
    status: FileHandlerStatus.INITIAL,
    chunks:[]
  });

  progress$ = this.progressSubject.asObservable();

  constructor(options?: ChunksFileUploadOptions) {
    this.chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE;
    this.server = options?.server || DEFAULT_SERVER;
    this.http = new HttpRequest({server: this.server});
    
  }

  /**
   * 开始上传文件
   */
  async upload(file: File) {
    const fh= this.uploadingMap.get(file)
    if(fh){
      fh.startUpload();
    }else{
      this.uploadingMap.set(file,new FileHandler({
        file,
        http:this.http,
        chunkSize:this.chunkSize,
        messageSubject: this.progressSubject
      }))
    }
  }

  pause(file:File){
    const fh = this.uploadingMap.get(file);
    if(fh){
      fh.pause();
    }
  }
}

export interface ChunksFileUploadOptions {
  /* 文件切片大小，默认`10M` */
  chunkSize?: number;
  /* 服务器地址，默认为`/` */
  server?: string;
}
