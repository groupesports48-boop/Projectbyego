import {
  User,
  MatchSchedule,
  WhatsAppGroup,
  MatchResult,
  AppNotification,
  ExtractedOcrData,
  MatchType,
  MatchResultStatus,
  PlayerRole,
} from '../types';

const TOKEN_KEY = 'destroyed_esports_token';
const CURRENT_USER_KEY = 'destroyed_esports_current_user';
const USERS_KEY = 'destroyed_esports_users_list';
const PASSWORDS_KEY = 'destroyed_esports_passwords_map';

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_APP_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');

// Helper for local storage helpers
function getLocalUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: User[], passwords: Record<string, string>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      // 404, 405 status or HTML response indicates static deployment (e.g. Netlify) with no backend API
      if (
        response.status === 404 ||
        response.status === 405 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        contentType.includes('text/html') ||
        text.trim().startsWith('<!')
      ) {
        throw new Error('FALLBACK_LOCAL_STORAGE');
      }

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          throw new Error('FALLBACK_LOCAL_STORAGE');
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (err: any) {
      if (
        err?.message === 'FALLBACK_LOCAL_STORAGE' ||
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('404') ||
        err?.message?.includes('405') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Load failed')
      ) {
        throw new Error('FALLBACK_LOCAL_STORAGE');
      }
      throw err;
    }
  },

  // Auth
  auth: {
    async signup(payload: { fullName: string; email: string; password: string; confirmPassword?: string }) {
      try {
        const data = await api.request<{ user: User; token: string }>('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        api.setToken(data.token);
        setCurrentUser(data.user);
        return data;
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        // Local Storage Fallback for Static Host Deployments (e.g. Netlify)
        const cleanEmail = payload.email.trim().toLowerCase();
        const users = getLocalUsers();
        const passwords = getLocalPasswords();

        if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
          throw new Error('An account with this email already exists.');
        }

        const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
        const token = 'token_' + Math.random().toString(36).substring(2, 15);
        const newUser: User = {
          id: userId,
          fullName: payload.fullName.trim(),
          email: cleanEmail,
          ign: '亗 ' + payload.fullName.trim().split(' ')[0].toUpperCase() + ' 亗',
          bio: 'Free Fire competitor for DESTROYED Esports.',
          role: 'Rusher',
          avatarUrl: '',
          bannerUrl: '',
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        passwords[cleanEmail] = payload.password;
        saveLocalUsers(users, passwords);

        api.setToken(token);
        setCurrentUser(newUser);

        // Seed initial notification
        const notifKey = `destroyed_esports_notifications_${userId}`;
        localStorage.setItem(
          notifKey,
          JSON.stringify([
            {
              id: 'notif_' + Math.random().toString(36).substring(2, 10),
              userId,
              title: 'Welcome to DESTROYED eSports',
              message: 'Your personal Free Fire esports management dashboard is ready.',
              type: 'system',
              timestamp: new Date().toISOString(),
              read: false,
            },
          ])
        );

        return { user: newUser, token };
      }
    },

    async login(payload: { email: string; password: string }) {
      try {
        const data = await api.request<{ user: User; token: string }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        api.setToken(data.token);
        setCurrentUser(data.user);
        return data;
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        // Local Storage Fallback for Static Host Deployments (e.g. Netlify)
        const cleanEmail = payload.email.trim().toLowerCase();
        const users = getLocalUsers();
        const passwords = getLocalPasswords();

        // Seed demo account if matching demo credentials
        if (
          cleanEmail === 'businessesports1@gmail.com' &&
          !users.some((u) => u.email.toLowerCase() === cleanEmail)
        ) {
          const demoUser: User = {
            id: 'usr_demo_1980ea09',
            fullName: 'Destroyer Alex',
            email: 'businessesports1@gmail.com',
            ign: '亗 DESTROYER 亗',
            bio: 'IGL for DESTROYED Esports. Free Fire National Championship contender.',
            role: 'IGL',
            avatarUrl: '',
            bannerUrl: '',
            createdAt: new Date().toISOString(),
          };
          users.push(demoUser);
          passwords[cleanEmail] = 'Destroyer@2026';
          saveLocalUsers(users, passwords);
        }

        const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
        const storedPass = passwords[cleanEmail];

        if (!user || storedPass !== payload.password) {
          throw new Error('Invalid email or password.');
        }

        const token = 'token_' + Math.random().toString(36).substring(2, 15);
        api.setToken(token);
        setCurrentUser(user);

        return { user, token };
      }
    },

    async me() {
      try {
        const data = await api.request<{ user: User }>('/api/auth/me');
        if (data?.user) setCurrentUser(data.user);
        return data;
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const current = getCurrentUser();
        const token = api.getToken();
        if (current && token) {
          return { user: current };
        }
        throw new Error('Unauthorized. Please log in.');
      }
    },

    async logout() {
      try {
        await api.request('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore fallback error on logout
      } finally {
        api.clearToken();
      }
    },
  },

  // Matches
  matches: {
    async list() {
      try {
        return await api.request<MatchSchedule[]>('/api/matches');
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) return [];
        const key = `destroyed_esports_matches_${user.id}`;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);

        // Seed initial default scheduled match
        const initial: MatchSchedule[] = [
          {
            id: 'mat_demo_7b656201',
            userId: user.id,
            name: 'Destroyers vs Soul Scrim',
            matchDate: new Date().toISOString().slice(0, 10),
            matchTime: '23:59',
            matchType: 'Squad',
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
    },

    async create(payload: {
      name?: string;
      matchDate: string;
      matchTime: string;
      matchType: MatchType;
      whatsappGroupId?: string;
      whatsappUrl?: string;
      notes?: string;
    }) {
      try {
        return await api.request<MatchSchedule>('/api/matches', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_matches_${user.id}`;
        const list: MatchSchedule[] = JSON.parse(localStorage.getItem(key) || '[]');

        const newMatch: MatchSchedule = {
          id: 'mat_' + Math.random().toString(36).substring(2, 10),
          userId: user.id,
          name: payload.name?.trim() || undefined,
          matchDate: payload.matchDate,
          matchTime: payload.matchTime,
          matchType: payload.matchType,
          whatsappGroupId: payload.whatsappGroupId || undefined,
          whatsappUrl: payload.whatsappUrl || undefined,
          notes: payload.notes?.trim() || undefined,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };

        list.unshift(newMatch);
        localStorage.setItem(key, JSON.stringify(list));
        return newMatch;
      }
    },

    async update(id: string, payload: Partial<MatchSchedule>) {
      try {
        return await api.request<MatchSchedule>(`/api/matches/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_matches_${user.id}`;
        const list: MatchSchedule[] = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = list.findIndex((m) => m.id === id);
        if (idx === -1) throw new Error('Match not found');

        list[idx] = { ...list[idx], ...payload };
        localStorage.setItem(key, JSON.stringify(list));
        return list[idx];
      }
    },

    async delete(id: string) {
      try {
        return await api.request<{ success: boolean }>(`/api/matches/${id}`, {
          method: 'DELETE',
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_matches_${user.id}`;
        const list: MatchSchedule[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((m) => m.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
        return { success: true };
      }
    },
  },

  // WhatsApp Groups
  whatsapp: {
    async list() {
      try {
        return await api.request<WhatsAppGroup[]>('/api/whatsapp-groups');
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) return [];

        const key = `destroyed_esports_groups_${user.id}`;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);

        // Seed initial default group
        const initial: WhatsAppGroup[] = [
          {
            id: 'grp_demo_be2fb608',
            userId: user.id,
            name: 'Elite Scrims Hub Tier 1',
            url: 'https://chat.whatsapp.com/FFScrimsT1Hub',
            note: 'Slot 4 reserved. Room details shared 15m prior',
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
    },

    async create(payload: { name: string; url: string; note?: string }) {
      try {
        return await api.request<WhatsAppGroup>('/api/whatsapp-groups', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_groups_${user.id}`;
        const list: WhatsAppGroup[] = JSON.parse(localStorage.getItem(key) || '[]');

        const newGroup: WhatsAppGroup = {
          id: 'grp_' + Math.random().toString(36).substring(2, 10),
          userId: user.id,
          name: payload.name.trim(),
          url: payload.url.trim(),
          note: payload.note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        list.unshift(newGroup);
        localStorage.setItem(key, JSON.stringify(list));
        return newGroup;
      }
    },

    async update(id: string, payload: { name?: string; url?: string; note?: string }) {
      try {
        return await api.request<WhatsAppGroup>(`/api/whatsapp-groups/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_groups_${user.id}`;
        const list: WhatsAppGroup[] = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = list.findIndex((g) => g.id === id);
        if (idx === -1) throw new Error('Group not found');

        list[idx] = { ...list[idx], ...payload };
        localStorage.setItem(key, JSON.stringify(list));
        return list[idx];
      }
    },

    async delete(id: string) {
      try {
        return await api.request<{ success: boolean }>(`/api/whatsapp-groups/${id}`, {
          method: 'DELETE',
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_groups_${user.id}`;
        const list: WhatsAppGroup[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((g) => g.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
        return { success: true };
      }
    },
  },

  // Match History / Results
  results: {
    async list() {
      try {
        return await api.request<MatchResult[]>('/api/results');
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) return [];

        const key = `destroyed_esports_results_${user.id}`;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);

        // Seed initial default results
        const today = new Date().toISOString().slice(0, 10);
        const initial: MatchResult[] = [
          {
            id: 'res_demo_86e9ecf9',
            userId: user.id,
            matchDate: today,
            matchTime: '00:01',
            matchType: 'Duo',
            result: 'LOSS',
            placement: 2,
            kills: 0,
            notes: 'Pochinok early trade',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'res_demo_20dad6ed',
            userId: user.id,
            matchDate: today,
            matchTime: '00:01',
            matchType: 'Squad',
            result: 'WIN',
            placement: 1,
            kills: 0,
            notes: 'Grand Finals Round 1 - Booyah with 12 kills',
            entryFee: 100,
            prizeMoney: 600,
            extraExpenses: 50,
            expenseNotes: 'Slot pass and sub bonus',
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
    },

    async create(payload: {
      matchDate: string;
      matchTime?: string;
      matchType: MatchType;
      result: MatchResultStatus;
      placement?: number;
      kills?: number;
      damage?: number;
      notes?: string;
      screenshotUrl?: string;
      matchScheduleId?: string;
      entryFee?: number;
      prizeMoney?: number;
      extraExpenses?: number;
      expenseNotes?: string;
    }) {
      try {
        return await api.request<MatchResult>('/api/results', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_results_${user.id}`;
        const list: MatchResult[] = JSON.parse(localStorage.getItem(key) || '[]');

        const newResult: MatchResult = {
          id: 'res_' + Math.random().toString(36).substring(2, 10),
          userId: user.id,
          matchDate: payload.matchDate,
          matchTime: payload.matchTime || undefined,
          matchType: payload.matchType,
          result: payload.result,
          placement: payload.placement !== undefined ? Number(payload.placement) : undefined,
          kills: payload.kills !== undefined ? Number(payload.kills) : undefined,
          damage: payload.damage !== undefined ? Number(payload.damage) : undefined,
          notes: payload.notes?.trim() || undefined,
          screenshotUrl: payload.screenshotUrl || undefined,
          matchScheduleId: payload.matchScheduleId || undefined,
          entryFee: payload.entryFee !== undefined ? Math.max(0, Number(payload.entryFee)) : undefined,
          prizeMoney: payload.prizeMoney !== undefined ? Math.max(0, Number(payload.prizeMoney)) : undefined,
          extraExpenses: payload.extraExpenses !== undefined ? Math.max(0, Number(payload.extraExpenses)) : undefined,
          expenseNotes: payload.expenseNotes?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        list.unshift(newResult);
        localStorage.setItem(key, JSON.stringify(list));
        return newResult;
      }
    },

    async update(id: string, payload: Partial<MatchResult>) {
      try {
        return await api.request<MatchResult>(`/api/results/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_results_${user.id}`;
        const list: MatchResult[] = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = list.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Result record not found');

        list[idx] = { ...list[idx], ...payload };
        localStorage.setItem(key, JSON.stringify(list));
        return list[idx];
      }
    },

    async delete(id: string) {
      try {
        return await api.request<{ success: boolean }>(`/api/results/${id}`, {
          method: 'DELETE',
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_results_${user.id}`;
        const list: MatchResult[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((r) => r.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
        return { success: true };
      }
    },
  },

  // Profit & Loss Financial Records
  profitLoss: {
    async update(
      id: string,
      payload: {
        entryFee?: number;
        prizeMoney?: number;
        extraExpenses?: number;
        expenseNotes?: string;
      }
    ) {
      try {
        return await api.request<MatchResult>(`/api/profit-loss/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_results_${user.id}`;
        const list: MatchResult[] = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = list.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Result record not found');

        list[idx] = {
          ...list[idx],
          entryFee: payload.entryFee !== undefined ? Math.max(0, Number(payload.entryFee)) : list[idx].entryFee,
          prizeMoney: payload.prizeMoney !== undefined ? Math.max(0, Number(payload.prizeMoney)) : list[idx].prizeMoney,
          extraExpenses: payload.extraExpenses !== undefined ? Math.max(0, Number(payload.extraExpenses)) : list[idx].extraExpenses,
          expenseNotes: payload.expenseNotes !== undefined ? String(payload.expenseNotes).trim() : list[idx].expenseNotes,
        };

        localStorage.setItem(key, JSON.stringify(list));
        return list[idx];
      }
    },
  },

  // Profile
  profile: {
    async get() {
      try {
        return await api.request<User>('/api/profile');
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;
        const current = getCurrentUser();
        if (!current) throw new Error('Not authenticated');
        return current;
      }
    },

    async update(payload: {
      fullName?: string;
      ign?: string;
      bio?: string;
      role?: PlayerRole;
      avatarUrl?: string;
      bannerUrl?: string;
    }) {
      try {
        const updated = await api.request<User>('/api/profile', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setCurrentUser(updated);
        return updated;
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const current = getCurrentUser();
        if (!current) throw new Error('Not authenticated');

        const updated: User = {
          ...current,
          ...payload,
        };

        setCurrentUser(updated);

        // Update in users list
        const users = getLocalUsers();
        const idx = users.findIndex((u) => u.id === current.id);
        if (idx !== -1) {
          users[idx] = updated;
          saveLocalUsers(users, getLocalPasswords());
        }

        return updated;
      }
    },
  },

  // Notifications
  notifications: {
    async list() {
      try {
        return await api.request<AppNotification[]>('/api/notifications');
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) return [];

        const key = `destroyed_esports_notifications_${user.id}`;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      }
    },

    async markRead() {
      try {
        return await api.request<{ success: boolean }>('/api/notifications/read', {
          method: 'POST',
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_notifications_${user.id}`;
        const list: AppNotification[] = JSON.parse(localStorage.getItem(key) || '[]');
        list.forEach((n) => (n.read = true));
        localStorage.setItem(key, JSON.stringify(list));
        return { success: true };
      }
    },

    async clear() {
      try {
        return await api.request<{ success: boolean }>('/api/notifications', {
          method: 'DELETE',
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        const user = getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const key = `destroyed_esports_notifications_${user.id}`;
        localStorage.setItem(key, JSON.stringify([]));
        return { success: true };
      }
    },
  },

  // OCR
  ocr: {
    async analyze(imageBase64: string, mimeType: string = 'image/png') {
      try {
        return await api.request<{
          success?: boolean;
          fallback?: boolean;
          message?: string;
          extracted: ExtractedOcrData;
        }>('/api/ocr/analyze', {
          method: 'POST',
          body: JSON.stringify({ imageBase64, mimeType }),
        });
      } catch (err: any) {
        if (err?.message !== 'FALLBACK_LOCAL_STORAGE') throw err;

        return {
          fallback: true,
          message: 'Screenshot uploaded successfully. Please verify and save results below.',
          extracted: {
            result: 'WIN' as MatchResultStatus,
            matchType: 'Squad' as MatchType,
            placement: 1,
            kills: 0,
            damage: 0,
            confidence: 60,
            detectedText: 'Uploaded scorecard image.',
          },
        };
      }
    },
  },
};
