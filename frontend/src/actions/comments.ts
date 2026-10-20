"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { CommentParentType } from "@/types";

export interface CommentRecord {
  id: string;
  parentType: CommentParentType;
  parentId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: Date;
}

export async function getComments(parentType: CommentParentType, parentId: string): Promise<CommentRecord[]> {
  await ensureDbReady();

  const comments = await db
    .select({
      comment: schema.comments,
      authorName: schema.members.name,
      authorRole: schema.members.role,
    })
    .from(schema.comments)
    .innerJoin(schema.members, eq(schema.comments.authorId, schema.members.id))
    .where(
      and(
        eq(schema.comments.parentType, parentType),
        eq(schema.comments.parentId, parentId)
      )
    )
    .orderBy(desc(schema.comments.createdAt));

  return comments.map(({ comment, authorName, authorRole }: any) => ({
    id: comment.id,
    parentType: comment.parentType as CommentParentType,
    parentId: comment.parentId,
    authorId: comment.authorId,
    authorName,
    authorRole,
    text: comment.text,
    createdAt: comment.createdAt,
  }));
}

export async function postComment(parentType: CommentParentType, parentId: string, text: string) {
  const actor = await requireAuth();
  await ensureDbReady();

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Comment text cannot be empty.");
  }

  const id = `c-${Date.now()}-${actor.id}`;
  await db.insert(schema.comments).values({
    id,
    parentType,
    parentId,
    authorId: actor.id,
    text: trimmed,
  });

  revalidatePath(`/resources/${parentId}`);
  return { success: true, id };
}
