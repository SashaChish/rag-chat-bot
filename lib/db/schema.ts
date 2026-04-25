import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const documentsTable = pgTable("documents", {
  id: uuid("id").primaryKey(),
  filename: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadDate: text("upload_date").notNull(),
  chunkCount: integer("chunk_count").notNull(),
  content: text("content"),
});
