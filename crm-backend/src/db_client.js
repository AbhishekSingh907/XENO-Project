const fs = require('fs');
const path = require('path');

class JSONDatabase {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.tables = {};
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  _getFilePath(tableName) {
    return path.join(this.dataDir, `${tableName}.json`);
  }

  _loadTable(tableName) {
    if (this.tables[tableName]) {
      return this.tables[tableName];
    }

    const filePath = this._getFilePath(tableName);
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        this.tables[tableName] = JSON.parse(data);
      } catch (err) {
        console.error(`Error loading table ${tableName}:`, err);
        this.tables[tableName] = [];
      }
    } else {
      this.tables[tableName] = [];
    }

    return this.tables[tableName];
  }

  _saveTable(tableName) {
    const filePath = this._getFilePath(tableName);
    const data = this.tables[tableName] || [];
    try {
      // Atomic write: write to temp file then rename
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      console.error(`Error saving table ${tableName}:`, err);
    }
  }

  find(tableName, queryFn) {
    const table = this._loadTable(tableName);
    if (!queryFn) return table;
    return table.filter(queryFn);
  }

  findOne(tableName, queryFn) {
    const table = this._loadTable(tableName);
    return table.find(queryFn);
  }

  insert(tableName, record) {
    const table = this._loadTable(tableName);
    // Auto-generate ID if not present
    if (!record.id) {
      record.id = `${tableName.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    record.createdAt = record.createdAt || new Date().toISOString();
    record.updatedAt = record.updatedAt || new Date().toISOString();
    
    table.push(record);
    this._saveTable(tableName);
    return record;
  }

  insertMany(tableName, records) {
    const table = this._loadTable(tableName);
    const processed = records.map((record, index) => {
      if (!record.id) {
        record.id = `${tableName.substring(0, 3)}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`;
      }
      record.createdAt = record.createdAt || new Date().toISOString();
      record.updatedAt = record.updatedAt || new Date().toISOString();
      return record;
    });

    this.tables[tableName] = table.concat(processed);
    this._saveTable(tableName);
    return processed;
  }

  update(tableName, queryFn, updateFields) {
    const table = this._loadTable(tableName);
    let updatedCount = 0;
    
    this.tables[tableName] = table.map(record => {
      if (queryFn(record)) {
        updatedCount++;
        return {
          ...record,
          ...updateFields,
          updatedAt: new Date().toISOString()
        };
      }
      return record;
    });

    if (updatedCount > 0) {
      this._saveTable(tableName);
    }
    return updatedCount;
  }

  delete(tableName, queryFn) {
    const table = this._loadTable(tableName);
    const initialLength = table.length;
    this.tables[tableName] = table.filter(record => !queryFn(record));
    
    if (this.tables[tableName].length !== initialLength) {
      this._saveTable(tableName);
      return initialLength - this.tables[tableName].length;
    }
    return 0;
  }

  clear(tableName) {
    this.tables[tableName] = [];
    this._saveTable(tableName);
  }
}

const db = new JSONDatabase(path.join(__dirname, '..', 'data'));

module.exports = db;
