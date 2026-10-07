import { createDb } from "../src/database/knex.js";
import { config } from "../src/config.js";

function group(rows, keyFn) {
  const result = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(row);
  }
  return result;
}

export async function buildDatabaseContract() {
  const db = createDb();

  try {
    const schemas = config.contractSchemas;

    const columns = await db("information_schema.columns")
      .whereIn("table_schema", schemas)
      .select(
        "table_schema",
        "table_name",
        "column_name",
        "ordinal_position",
        "data_type",
        "udt_name",
        "is_nullable",
        "column_default",
        "character_maximum_length",
        "numeric_precision",
        "numeric_scale",
      )
      .orderBy([
        { column: "table_schema", order: "asc" },
        { column: "table_name", order: "asc" },
        { column: "ordinal_position", order: "asc" },
      ]);

    const primaryKeys = await db.raw(
      `
        SELECT
          ns.nspname AS table_schema,
          tbl.relname AS table_name,
          att.attname AS column_name,
          ord.ordinality AS position
        FROM pg_constraint con
        JOIN pg_class tbl ON tbl.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        JOIN unnest(con.conkey) WITH ORDINALITY AS ord(attnum, ordinality) ON true
        JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = ord.attnum
        WHERE con.contype = 'p'
          AND ns.nspname = ANY(?::text[])
        ORDER BY ns.nspname, tbl.relname, ord.ordinality
      `,
      [schemas],
    );

    const foreignKeys = await db.raw(
      `
        SELECT
          src_ns.nspname AS table_schema,
          src.relname AS table_name,
          src_att.attname AS column_name,
          dst_ns.nspname AS foreign_schema,
          dst.relname AS foreign_table,
          dst_att.attname AS foreign_column,
          con.conname AS constraint_name
        FROM pg_constraint con
        JOIN pg_class src ON src.oid = con.conrelid
        JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
        JOIN pg_class dst ON dst.oid = con.confrelid
        JOIN pg_namespace dst_ns ON dst_ns.oid = dst.relnamespace
        JOIN unnest(con.conkey) WITH ORDINALITY AS src_key(attnum, ordinality) ON true
        JOIN unnest(con.confkey) WITH ORDINALITY AS dst_key(attnum, ordinality)
          ON dst_key.ordinality = src_key.ordinality
        JOIN pg_attribute src_att ON src_att.attrelid = src.oid AND src_att.attnum = src_key.attnum
        JOIN pg_attribute dst_att ON dst_att.attrelid = dst.oid AND dst_att.attnum = dst_key.attnum
        WHERE con.contype = 'f'
          AND src_ns.nspname = ANY(?::text[])
        ORDER BY src_ns.nspname, src.relname, con.conname, src_key.ordinality
      `,
      [schemas],
    );

    const pkByTable = group(
      primaryKeys.rows,
      (row) => `${row.table_schema}.${row.table_name}`,
    );
    const fkByTable = group(
      foreignKeys.rows,
      (row) => `${row.table_schema}.${row.table_name}`,
    );

    const contract = { version: 1, schemas: {} };

    for (const column of columns) {
      const schema = contract.schemas[column.table_schema] ||= { tables: {} };
      const table = schema.tables[column.table_name] ||= {
        columns: {},
        primaryKey: [],
        foreignKeys: [],
      };

      table.columns[column.column_name] = {
        position: column.ordinal_position,
        dataType: column.data_type,
        nativeType: column.udt_name,
        nullable: column.is_nullable === "YES",
        default: column.column_default,
        maxLength: column.character_maximum_length,
        precision: column.numeric_precision,
        scale: column.numeric_scale,
      };
    }

    for (const [schemaName, schema] of Object.entries(contract.schemas)) {
      for (const [tableName, table] of Object.entries(schema.tables)) {
        const key = `${schemaName}.${tableName}`;
        table.primaryKey = (pkByTable.get(key) || []).map((row) => row.column_name);
        table.foreignKeys = (fkByTable.get(key) || []).map((row) => ({
          name: row.constraint_name,
          column: row.column_name,
          references: {
            schema: row.foreign_schema,
            table: row.foreign_table,
            column: row.foreign_column,
          },
        }));
      }
    }

    return contract;
  } finally {
    await db.destroy();
  }
}
