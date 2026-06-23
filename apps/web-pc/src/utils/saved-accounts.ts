const SAVED_ACCOUNTS_KEY = 'volix-saved-accounts';
const MAX_SAVED_ACCOUNTS = 5;

export interface SavedAccount {
  id: string;
  token: string;
  email: string;
  nickname?: string;
  avatar?: string;
  updatedAt: number;
}

const normalizeAccount = (value: unknown): SavedAccount | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = record.id;
  const token = record.token;
  const email = record.email;
  if ((typeof id !== 'string' && typeof id !== 'number') || typeof token !== 'string' || typeof email !== 'string') {
    return null;
  }
  return {
    id: String(id),
    token,
    email,
    nickname: typeof record.nickname === 'string' ? record.nickname : undefined,
    avatar: typeof record.avatar === 'string' ? record.avatar : undefined,
    updatedAt: typeof record.updatedAt === 'number' ? record.updatedAt : 0,
  };
};

export const getSavedAccounts = (): SavedAccount[] => {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeAccount)
      .filter((item): item is SavedAccount => item !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SAVED_ACCOUNTS);
  } catch {
    return [];
  }
};

const persistAccounts = (accounts: SavedAccount[]) => {
  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, MAX_SAVED_ACCOUNTS)));
  } catch {
    /* ignore storage errors */
  }
};

export const upsertSavedAccount = (account: Omit<SavedAccount, 'updatedAt'>): void => {
  const id = String(account.id);
  if (!id || !account.token || !account.email) {
    return;
  }
  const next: SavedAccount = { ...account, id, updatedAt: Date.now() };
  const others = getSavedAccounts().filter(item => item.id !== id);
  persistAccounts([next, ...others]);
};

export const removeSavedAccount = (id: string): SavedAccount[] => {
  const next = getSavedAccounts().filter(item => item.id !== String(id));
  persistAccounts(next);
  return next;
};
