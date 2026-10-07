import path from "node:path";
import { randomUUID } from "node:crypto";

export function createFilesService({ db, storage }) {
  async function save({ buffer, fileName, contentType = null, uploadedBy = null }) {
    if (!Buffer.isBuffer(buffer)) throw new Error("file_buffer_required");
    if (!fileName) throw new Error("file_name_required");

    const id = randomUUID();
    const extension = path.extname(fileName).replace(/^\./, "") || null;
    const stored = await storage.save({ buffer, extension });

    try {
      await db("kernel.file").insert({
        id,
        file_name: fileName,
        content_type: contentType,
        size_bytes: buffer.length,
        extension,
        storage_driver: storage.driver,
        storage_path: stored.storagePath,
        uploaded_by: uploadedBy,
      });
    } catch (error) {
      await storage.remove(stored.storagePath).catch(() => {});
      throw error;
    }

    return metadata(id);
  }

  async function metadata(id) {
    return db("kernel.file").where({ id }).first();
  }

  async function read(id) {
    const file = await metadata(id);
    if (!file) return null;
    return {
      metadata: file,
      buffer: await storage.read(file.storage_path),
    };
  }

  async function remove(id) {
    const file = await metadata(id);
    if (!file) return false;

    await db.transaction(async (trx) => {
      await trx("kernel.file").where({ id }).del();
    });

    await storage.remove(file.storage_path);
    return true;
  }

  return { save, metadata, read, remove };
}
