import type { InferInsertModel } from "drizzle-orm";
import type { documentsTable } from "./schema";

export type DocumentEntry = InferInsertModel<typeof documentsTable>;
