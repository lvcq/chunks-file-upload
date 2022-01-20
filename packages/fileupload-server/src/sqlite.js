const fs = require('fs');
const sqlite3 = require("sqlite3").verbose();


class SqliteDB {
  constructor(file) {
    this.db = new sqlite3.Database(file);
    const exist = fs.existsSync(file);
    if (!exist) {
      console.log("create db file.");
      fs.openSync(file, 'w');
    }
  }

  createTable(sql) {
    this.db.serialize(() => {
      this.db.run(sql, (err) => {
        if (err !== null) {
          throw err;
        }
      })
    })
  }

  insert(sql, datalist) {
    return new Promise((resolve, reject) => {
      try {
        this.db.serialize(() => {
          const stmt = this.db.prepare(sql);
          for (let i = 0; i < datalist.length; i++) {
            stmt.run(datalist[i]);
          }
          stmt.finalize((err)=>{
            if(err!=null){
              reject(err);
            }else{
              resolve();
            }
          });
        });
      } catch (err) {
        reject(err);
      }
    })
  }

  query(sql, callback) {
    this.db.all(sql, (err, rows) => {
      if (err !== null) {
        throw err;
      }
      if (callback) {
        callback(rows);
      }
    })
  }

  execute(sql) {
    return new Promise((resolve,reject)=>{
      this.db.run(sql, (err) => {
        if (err !== null) {
          reject(err);
        }else{
          resolve();
        }
      })
    })
  }

  close() {
    this.db.close();
  }
}

module.exports = {SqliteDB};
