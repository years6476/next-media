import {
  ref,
  set,
  onValue,
  onDisconnect,
  off,
} from "firebase/database";
import { rtdb } from "../config";
import { UserPresence } from "@/types";

export const initPresence = (userId: string): void => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  const connectedRef = ref(rtdb, ".info/connected");

  onValue(connectedRef, async (snap) => {
    if (snap.val() === true) {
      await set(presenceRef, { online: true, lastSeen: Date.now() });
      onDisconnect(presenceRef).set({ online: false, lastSeen: Date.now() });
    }
  });
};

export const setOffline = async (userId: string): Promise<void> => {
  await set(ref(rtdb, `presence/${userId}`), {
    online: false,
    lastSeen: Date.now(),
  });
};

export const subscribeToPresence = (
  userId: string,
  callback: (presence: UserPresence) => void
): (() => void) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  const listener = onValue(presenceRef, (snap) => {
    callback(snap.exists() ? snap.val() : { online: false, lastSeen: 0 });
  });
  return () => off(presenceRef, "value", listener);
};

export const setTyping = async (
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  await set(ref(rtdb, `typing/${chatId}/${userId}`), isTyping);
  if (isTyping) {
    setTimeout(() => set(ref(rtdb, `typing/${chatId}/${userId}`), false), 5000);
  }
};

export const subscribeToTyping = (
  chatId: string,
  currentUserId: string,
  callback: (typingUsers: string[]) => void
): (() => void) => {
  const typingRef = ref(rtdb, `typing/${chatId}`);
  const listener = onValue(typingRef, (snap) => {
    if (!snap.exists()) return callback([]);
    const data = snap.val();
    const users = Object.entries(data)
      .filter(([id, val]) => id !== currentUserId && val)
      .map(([id]) => id);
    callback(users);
  });
  return () => off(typingRef, "value", listener);
};
