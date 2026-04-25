import { eq } from "drizzle-orm";
import { db } from ".";
import { documentsTable } from "./schema";

export async function getAllDocuments() {
  return await db.select().from(documentsTable);
}

export async function deleteDocument(id: string) {
  return await db.delete(documentsTable).where(eq(documentsTable.id, id));
}

export async function getDocument(id: string) {
  return await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, id));
}
