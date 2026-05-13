'use strict';

const path = require('path');

const SEGMENT_TABLE_NAME = 'volix_115_file_segment';

const resolveCloud115FileTableName = async queryInterface => {
  const tables = await queryInterface.showAllTables();
  const names = tables.map(item => (typeof item === 'string' ? item : item.tableName)).filter(Boolean);

  if (names.includes('volix_115_file')) {
    return 'volix_115_file';
  }

  if (names.includes('115_file')) {
    return '115_file';
  }

  throw new Error('找不到 115 文件表（volix_115_file / 115_file）');
};

const normalizeFolderPath = folderPath => {
  const normalized = path.posix.normalize(`/${String(folderPath || '').trim().replace(/^\/+/, '')}`);
  if (normalized === '/' || normalized === '.') {
    return '/';
  }
  return normalized.replace(/\/+$/, '');
};

const getFilePathSegments = fullPath => {
  const normalizedPath = normalizeFolderPath(fullPath);
  if (normalizedPath === '/') {
    return [];
  }

  const parentPath = path.posix.dirname(normalizedPath);
  if (!parentPath || parentPath === '/' || parentPath === '.') {
    return [];
  }

  const parts = parentPath.split('/').filter(Boolean);
  return parts.map((_, index) => `/${parts.slice(0, index + 1).join('/')}`);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map(item => (typeof item === 'string' ? item : item.tableName)).filter(Boolean);

    if (!tableNames.includes(SEGMENT_TABLE_NAME)) {
      await queryInterface.createTable(SEGMENT_TABLE_NAME, {
        id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
        pc: { type: Sequelize.STRING, allowNull: false },
        cid: { type: Sequelize.STRING, allowNull: true },
        segment: { type: Sequelize.STRING, allowNull: false },
        depth: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      });
    }

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "${SEGMENT_TABLE_NAME}_pc_segment_uq_idx" ON "${SEGMENT_TABLE_NAME}" ("pc", "segment")`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${SEGMENT_TABLE_NAME}_segment_idx" ON "${SEGMENT_TABLE_NAME}" ("segment")`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${SEGMENT_TABLE_NAME}_cid_segment_idx" ON "${SEGMENT_TABLE_NAME}" ("cid", "segment")`
    );

    const fileTableName = await resolveCloud115FileTableName(queryInterface);
    const fileRows = await queryInterface.sequelize.query(
      `SELECT "pc", "cid", "full_path" FROM "${fileTableName}" WHERE "full_path" IS NOT NULL AND "full_path" <> ''`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!Array.isArray(fileRows) || fileRows.length === 0) {
      return;
    }

    const now = new Date();
    const segmentRows = [];

    for (const file of fileRows) {
      const pc = String(file.pc || '').trim();
      if (!pc) {
        continue;
      }

      const cid = String(file.cid || '').trim();
      const segments = getFilePathSegments(String(file.full_path || ''));
      for (let index = 0; index < segments.length; index++) {
        segmentRows.push({
          pc,
          cid,
          segment: segments[index],
          depth: index + 1,
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (segmentRows.length === 0) {
      return;
    }

    const chunkSize = 500;
    for (let start = 0; start < segmentRows.length; start += chunkSize) {
      await queryInterface.bulkInsert(SEGMENT_TABLE_NAME, segmentRows.slice(start, start + chunkSize), {
        ignoreDuplicates: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${SEGMENT_TABLE_NAME}_cid_segment_idx"`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${SEGMENT_TABLE_NAME}_segment_idx"`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${SEGMENT_TABLE_NAME}_pc_segment_uq_idx"`);

    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map(item => (typeof item === 'string' ? item : item.tableName)).filter(Boolean);
    if (tableNames.includes(SEGMENT_TABLE_NAME)) {
      await queryInterface.dropTable(SEGMENT_TABLE_NAME);
    }
  },
};
