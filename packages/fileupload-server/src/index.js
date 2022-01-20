const express = require('express');
const { open, mkdir, unlink } = require('fs/promises');
const fs = require('fs');
const cors = require('cors');
const formData = require('express-form-data');
const os = require('os');

const { SqliteDB } = require('./sqlite');
const { query } = require('express');
const app = express();
const port = 9080;
const db = new SqliteDB('./fileupload.db');
const tempDir = './temp';
const filesDir = './files'
const mergingFileset = new Set();

const options = {
  uploadDir: os.tmpdir(),
  autoClean: true
}

clearDB();
initSqliteDB();


app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(formData.parse(options));
app.use(formData.format());
app.use(formData.stream());
app.use(formData.union());

app.get("/", (req, res) => {
  res.send("chunks file upload.\n\n" + req.get("user-agent"))
});

app.post("/fileupload/info", (req, res) => {
  try {
    const { filename, size, hash, chunkSize } = req.body;
    db.query(`SELECT id,name,status,chunkSize FROM files WHERE filehash ='${hash}'`, async (rows) => {
      if (rows.length === 0) {
        console.log('upload new file ' + filename + '......');
        await db.insert(`INSERT INTO files(name, filehash,size,status,chunkSize) VALUES(?,?,?,?,?)`, [[filename, hash, size, 1, chunkSize]]);
        db.query(`SELECT id FROM files WHERE filehash='${hash}'`, rows => {
          res.send(JSON.stringify({ success: true, data: { uploadType: 'NOT_EXIST', id: rows[0].id } }));
        })
      } else {
        let { id, status, chunkSize } = rows[0];
        if (status === 2 || status === 3) {
          res.send(JSON.stringify({ success: true, data: { uploadType: 'EXIST', id } }))
        } else {
          db.query(`SELECT chunkIndex,hash,start,end,uploaded,size FROM chunks WHERE fileId='${id}' ORDER BY chunkIndex ASC `, (rows) => {
            const data = {
              success: true,
              data: {
                uploadType: 'PATIAL',
                id,
                chunkSize,
                chunks: rows.map(item => ({
                  hash: item.hash,
                  start: item.start,
                  uploaded: item.end,
                  isFinished: item.uploaded == 1,
                  index: item.chunkIndex,
                  size: item.size
                }))
              }
            };
            res.send(JSON.stringify(data));
          })
        }
      }
    })
  } catch (err) {
    res.status(500).send(err);
  }
});

// handle chunk upload 
app.post('/fileupload/chunk', async (req, res) => {
  const { file, slice, start, end, fileSlice, index, fileId } = req.body;
  const path = `${tempDir}/${file}-${index}-${slice}`
  let fp;
  try {
    console.log('write stream to slice file. ', index);
    let chunk = await queryChunk(slice, fileId, index);
    if (!chunk) {
      chunk = {
        size: end - start,
        fileId: Number(fileId),
        uploaded: 0,
        start: Number(start),
        chunkIndex: Number(index),
        hash: slice
      }
      await insertChunk(chunk);
    }

    fp = await open(path, 'a')
    const stream = fp.createWriteStream();
    fileSlice.pipe(stream).on("finish", async () => {
      let chunk = await queryChunk(slice, fileId, index);
      await db.execute(`UPDATE chunks SET uploaded=1, end=${chunk.start + chunk.size} WHERE id=${chunk.id}`)
      checkAndMergeFile(fileId);
      fp.close();
      res.send(JSON.stringify({ success: true }));

    })
  } catch (err) {
    console.log(err)
  } finally {
  }
})




app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})


function clearDB() {
  const tables = ['files', 'chunks'];
  tables.forEach(table => {
    db.execute(`DROP TABLE ${table}`);
  })
}

function initSqliteDB() {
  // create tables
  const createFileInfoTableSql = 'create table if not exists files(id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR(128) NOT NULL, filehash CHAR(256) NOT NULL, size INTEGER NOT NULL, status INTEGER NOT NULL,chunkSize INTEGER NOT NULL)';
  const createChunkTableSql = 'CREATE TABLE if not exists chunks(id INTEGER PRIMARY KEY AUTOINCREMENT,hash CHAR(256) NOT NULL, size INTEGER NOT NULL, fileId INTEGER NOT NULL, uploaded INTEGER DEFAULT 0, start INTEGER NOT NULL, end INTEGER NOT NULL, chunkIndex INTEGER NOT NULL);';
  const sqls = [createFileInfoTableSql, createChunkTableSql];
  sqls.forEach(sql => {
    db.createTable(sql);
  })
}


async function queryChunk(hash, fileId, index) {
  return new Promise((resolve, reject) => {
    try {
      db.query(`SELECT id,size,fileId,uploaded,start,end,chunkIndex FROM chunks WHERE hash='${hash}' AND fileId=${fileId} AND chunkIndex=${index}`,
        (rows) => {
          resolve(rows.length === 1 ? rows[0] : null);
        });
    } catch (err) {
      reject(err);
    }
  });
}

async function queryChunks(fileId) {
  return new Promise((resolve, reject) => {
    try {
      db.query(`SELECT id,size,fileId,uploaded,start,end,chunkIndex,hash FROM chunks WHERE fileId='${fileId}' ORDER BY chunkIndex ASC`, rows => {
        resolve(rows);
      })
    } catch (err) {
      reject(err);
    }
  });
}

async function insertChunk(chunk) {
  await db.insert('INSERT INTO chunks(hash,size,fileId,start,end,chunkIndex) VALUES (?,?,?,?,?,?) ',
    [[chunk.hash, chunk.size, chunk.fileId, chunk.start, chunk.start, chunk.chunkIndex]]);
}

async function queryFile(id) {
  return new Promise((resolve, reject) => {
    try {
      db.query(`SELECT id,filehash,name,size,status,chunkSize FROM files WHERE id=${id}`, (rows) => {
        if (rows.length) {
          resolve(rows[0]);
        } else {
          reject(null);
        }
      })
    } catch (err) {
      reject(err);
    }
  })
}


async function checkAndMergeFile(id) {
  console.log('check file ......')
  try {
    const file = await queryFile(id);
    const chunks = await queryChunks(id);
    // 如果切片数据等于文件的切片数量，并且每个切片均上传完成，判断文件已完成上传，开启合并文件
    const count = Math.ceil(Number(file.size) / Number(file.chunkSize))
    if (file.status === 1 && count === chunks.length && chunks.every(item => Number(item.uploaded) === 1)) {
      if (mergingFileset.has(id)) {
        return
      }
      mergingFileset.add(id)
      db.execute(`UPDATE files SET status=2 WHERE id=${id}`);
      console.log('start merge file......')
      await copyFileToStore(file, chunks);
      mergingFileset.delete(id)
    }
  } catch (err) {
    if (mergingFileset.has(id)) {
      mergingFileset.delete(id)
    }
    console.log('merge file error:', err);
  }
}

async function copyFileToStore(file, chunks) {
  //await mkdir(filesDir);
  let targetFilePath = `${filesDir}/${file.name}`;
  if (fs.existsSync(targetFilePath)) {
    await unlink(targetFilePath);
  }
  const tfp = await open(targetFilePath, 'a');
  const tfstream = tfp.createWriteStream();
  await mergeSlices(file.id,chunks, file.filehash, tfstream)
  tfp.close();
}

async function mergeSlices(fileId,chunks, filehash, tfstream) {
  try {
    let current = 0;
    let count = chunks.length;
    while (current < count) {
      console.log(current, count)
      await mergeSliceToFile(tfstream, chunks[current], filehash)
      console.log(current);
      current += 1;
    }
    console.log('merge suceess');
    db.execute(`UPDATE files SET status=3 WHERE id=${fileId}`);
  } catch (err) {
    console.log(err)
    // todo 
  }
}

async function mergeSliceToFile(tfstream, chunk, filehash,) {
      let sFilePath = `${tempDir}/${filehash}-${chunk.chunkIndex}-${chunk.hash}`;
      let sofp = await open(sFilePath, 'r');
      let sourceStream = sofp.createReadStream();
      console.log(sFilePath);
      sourceStream.pipe(tfstream)
}

async function removeSlice(chunk, filehash) {
  let sFilePath = `${tempDir}/${filehash}-${chunk.chunkIndex}-${chunk.hash}`;
  unlink(sFilePath);
}

