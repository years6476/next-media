import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  DocumentSnapshot,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import { Post } from "@/types";

const COL = "posts";

export const createPost = async (
  data: Omit<Post, "id" | "createdAt" | "updatedAt" | "likesCount" | "commentsCount" | "sharesCount">
): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", data.authorId), {
    postsCount: increment(1),
  });
  return ref.id;
};

export const getPost = async (postId: string): Promise<Post | null> => {
  const snap = await getDoc(doc(db, COL, postId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Post) : null;
};

export const updatePost = async (
  postId: string,
  data: Partial<Post>
): Promise<void> => {
  await updateDoc(doc(db, COL, postId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deletePost = async (
  postId: string,
  authorId: string
): Promise<void> => {
  await deleteDoc(doc(db, COL, postId));
  await updateDoc(doc(db, "users", authorId), { postsCount: increment(-1) });
};

export const getPostsByUser = async (
  userId: string,
  lastPost?: DocumentSnapshot,
  pageSize = 12
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> => {
  const constraints: any[] = [
    where("authorId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  ];
  if (lastPost) constraints.push(startAfter(lastPost));

  const snap = await getDocs(query(collection(db, COL), ...constraints));
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
};

export const getFeedPosts = async (
  followingIds: string[],
  lastPost?: DocumentSnapshot,
  pageSize = 10
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> => {
  if (!followingIds.length) return { posts: [], lastDoc: null };

  const chunks: string[][] = [];
  for (let i = 0; i < followingIds.length; i += 30)
    chunks.push(followingIds.slice(i, i + 30));

  let all: Post[] = [];

  for (const chunk of chunks) {
    const constraints: any[] = [
      where("authorId", "in", chunk),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(pageSize),
    ];
    if (lastPost) constraints.push(startAfter(lastPost));

    const snap = await getDocs(query(collection(db, COL), ...constraints));
    all = [...all, ...snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))];
  }

  all.sort((a, b) => {
    const at = (a.createdAt as any)?.toMillis?.() || 0;
    const bt = (b.createdAt as any)?.toMillis?.() || 0;
    return bt - at;
  });

  return { posts: all.slice(0, pageSize), lastDoc: null };
};

export const subscribeToPost = (
  postId: string,
  callback: (post: Post | null) => void
): Unsubscribe => {
  return onSnapshot(doc(db, COL, postId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Post) : null);
  });
};
