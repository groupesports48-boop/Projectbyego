import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data folder and db file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  ign?: string;
  bio?: string;
  role?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  token: string;
  createdAt: string;
}

interface MatchRecord {
  id: string;
  userId: string;
  name?: string;
  matchDate: string;
  matchTime: string;
  matchType: 'Solo' | 'Duo' | 'Squad';
  whatsappGroupId?: string;
  whatsappUrl?: string;
  notes?: string;
  isCompleted?: boolean;
  createdAt: string;
}

interface GroupRecord {
  id: string;
  userId: string;
  name: string;
  url: string;
  note?: string;
  createdAt: string;
}

interface ResultRecord {
  id: string;
  userId: string;
  matchDate: string;
  matchTime?: string;
  matchType: 'Solo' | 'Duo' | 'Squad';
  result: 'WIN' | 'LOSS';
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
  createdAt: string;
}

interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'schedule' | 'system';
  timestamp: string;
  read: boolean;
  matchId?: string;
}

interface DbSchema {
  users: Record<string, UserRecord>;
  matches: Record<string, MatchRecord[]>;
  groups: Record<string, GroupRecord[]>;
  results: Record<string, ResultRecord[]>;
  notifications: Record<string, NotificationRecord[]>;
}

function getInitialDb(): DbSchema {
  return {
    users: {},
    matches: {},
    groups: {},
    results: {},
    notifications: {},
  };
}

function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db:', err);
    return getInitialDb();
  }
}

function writeDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing db:', err);
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_destroyed_esports_salt').digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const app = express();
app.use(express.json({ limit: '35mb' }));

// Auth Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const db = readDb();
  const user = Object.values(db.users).find((u) => u.token === token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  (req as any).user = user;
  next();
}

// Helper to sanitize user object
function sanitizeUser(u: UserRecord) {
  const { passwordHash, token, ...safe } = u;
  return safe;
}

// ================= AUTH ROUTES =================
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { fullName, email, password, confirmPassword } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const db = readDb();
  const existing = Object.values(db.users).find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userId = 'usr_' + crypto.randomUUID();
  const token = generateToken();
  const newUser: UserRecord = {
    id: userId,
    fullName: fullName.trim(),
    email: cleanEmail,
    passwordHash: hashPassword(password),
    ign: '',
    bio: '',
    role: 'Rusher',
    avatarUrl: '',
    bannerUrl: '',
    token,
    createdAt: new Date().toISOString(),
  };

  db.users[userId] = newUser;
  db.matches[userId] = [];
  db.groups[userId] = [];
  db.results[userId] = [];
  db.notifications[userId] = [
    {
      id: 'notif_' + crypto.randomUUID(),
      userId,
      title: 'Welcome to DESTROYED eSports',
      message: 'Your personal Free Fire esports management dashboard is ready. Clean slate initialized.',
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ];

  writeDb(db);

  return res.status(201).json({
    user: sanitizeUser(newUser),
    token,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = readDb();
  const user = Object.values(db.users).find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Refresh token for session persistence
  user.token = generateToken();
  writeDb(db);

  return res.json({
    user: sanitizeUser(user),
    token: user.token,
  });
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/logout', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  if (db.users[user.id]) {
    db.users[user.id].token = generateToken(); // Invalidate old token
    writeDb(db);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// ================= MATCH PLANNER ROUTES =================
app.get('/api/matches', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  const matches = db.matches[user.id] || [];
  res.json(matches);
});

app.post('/api/matches', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { name, matchDate, matchTime, matchType, whatsappGroupId, whatsappUrl, notes } = req.body;

  if (!matchDate || !matchTime || !matchType) {
    return res.status(400).json({ error: 'Match date, time, and type (Solo/Duo/Squad) are required.' });
  }

  if (!['Solo', 'Duo', 'Squad'].includes(matchType)) {
    return res.status(400).json({ error: 'Invalid match type. Must be Solo, Duo, or Squad.' });
  }

  // Validate WhatsApp URL if provided directly
  let validUrl = whatsappUrl?.trim();
  if (validUrl && !validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
    validUrl = 'https://' + validUrl;
  }

  const db = readDb();
  const newMatch: MatchRecord = {
    id: 'mat_' + crypto.randomUUID(),
    userId: user.id,
    name: name?.trim() || undefined,
    matchDate,
    matchTime,
    matchType,
    whatsappGroupId: whatsappGroupId || undefined,
    whatsappUrl: validUrl || undefined,
    notes: notes?.trim() || undefined,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };

  const list = db.matches[user.id] || [];
  list.unshift(newMatch);
  db.matches[user.id] = list;

  // Create schedule notification
  const notifs = db.notifications[user.id] || [];
  notifs.unshift({
    id: 'notif_' + crypto.randomUUID(),
    userId: user.id,
    title: 'Match Scheduled',
    message: `${newMatch.name || newMatch.matchType + ' Match'} scheduled for ${newMatch.matchDate} at ${newMatch.matchTime} IST.`,
    type: 'schedule',
    timestamp: new Date().toISOString(),
    read: false,
    matchId: newMatch.id,
  });
  db.notifications[user.id] = notifs;

  writeDb(db);
  res.status(201).json(newMatch);
});

app.put('/api/matches/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const matchId = req.params.id;
  const db = readDb();
  const list = db.matches[user.id] || [];
  const idx = list.findIndex((m) => m.id === matchId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const { name, matchDate, matchTime, matchType, whatsappGroupId, whatsappUrl, notes, isCompleted } = req.body;

  let validUrl = whatsappUrl !== undefined ? whatsappUrl?.trim() : list[idx].whatsappUrl;
  if (validUrl && !validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
    validUrl = 'https://' + validUrl;
  }

  list[idx] = {
    ...list[idx],
    name: name !== undefined ? name?.trim() : list[idx].name,
    matchDate: matchDate || list[idx].matchDate,
    matchTime: matchTime || list[idx].matchTime,
    matchType: matchType || list[idx].matchType,
    whatsappGroupId: whatsappGroupId !== undefined ? whatsappGroupId : list[idx].whatsappGroupId,
    whatsappUrl: validUrl || undefined,
    notes: notes !== undefined ? notes?.trim() : list[idx].notes,
    isCompleted: isCompleted !== undefined ? isCompleted : list[idx].isCompleted,
  };

  db.matches[user.id] = list;
  writeDb(db);
  res.json(list[idx]);
});

app.delete('/api/matches/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const matchId = req.params.id;
  const db = readDb();
  const list = db.matches[user.id] || [];
  const filtered = list.filter((m) => m.id !== matchId);

  if (list.length === filtered.length) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  db.matches[user.id] = filtered;
  writeDb(db);
  res.json({ success: true, message: 'Match deleted.' });
});

// ================= WHATSAPP GROUP ROUTES =================
app.get('/api/whatsapp-groups', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  res.json(db.groups[user.id] || []);
});

app.post('/api/whatsapp-groups', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { name, url, note } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'Group name and valid WhatsApp URL are required.' });
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    new URL(formattedUrl);
  } catch {
    return res.status(400).json({ error: 'Please enter a valid URL (e.g. https://chat.whatsapp.com/...).' });
  }

  const db = readDb();
  const newGroup: GroupRecord = {
    id: 'grp_' + crypto.randomUUID(),
    userId: user.id,
    name: name.trim(),
    url: formattedUrl,
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const groups = db.groups[user.id] || [];
  groups.unshift(newGroup);
  db.groups[user.id] = groups;
  writeDb(db);

  res.status(201).json(newGroup);
});

app.put('/api/whatsapp-groups/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const groupId = req.params.id;
  const db = readDb();
  const groups = db.groups[user.id] || [];
  const idx = groups.findIndex((g) => g.id === groupId);

  if (idx === -1) {
    return res.status(404).json({ error: 'WhatsApp group not found.' });
  }

  const { name, url, note } = req.body;
  let formattedUrl = url ? url.trim() : groups[idx].url;
  if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  groups[idx] = {
    ...groups[idx],
    name: name !== undefined ? name.trim() : groups[idx].name,
    url: formattedUrl,
    note: note !== undefined ? note?.trim() : groups[idx].note,
  };

  db.groups[user.id] = groups;
  writeDb(db);
  res.json(groups[idx]);
});

app.delete('/api/whatsapp-groups/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const groupId = req.params.id;
  const db = readDb();
  const groups = db.groups[user.id] || [];
  const filtered = groups.filter((g) => g.id !== groupId);

  if (groups.length === filtered.length) {
    return res.status(404).json({ error: 'WhatsApp group not found.' });
  }

  db.groups[user.id] = filtered;
  writeDb(db);
  res.json({ success: true, message: 'WhatsApp group deleted.' });
});

// ================= MATCH HISTORY / RESULTS ROUTES =================
app.get('/api/results', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  const results = db.results[user.id] || [];
  res.json(results);
});

app.post('/api/results', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const {
    matchDate,
    matchTime,
    matchType,
    result,
    placement,
    kills,
    damage,
    notes,
    screenshotUrl,
    matchScheduleId,
    entryFee,
    prizeMoney,
    extraExpenses,
    expenseNotes,
  } = req.body;

  if (!matchDate || !matchType || !result) {
    return res.status(400).json({ error: 'Match date, match type, and result (WIN/LOSS) are required.' });
  }

  if (!['Solo', 'Duo', 'Squad'].includes(matchType)) {
    return res.status(400).json({ error: 'Match type must be Solo, Duo, or Squad.' });
  }

  if (!['WIN', 'LOSS'].includes(result)) {
    return res.status(400).json({ error: 'Result must be WIN or LOSS.' });
  }

  const db = readDb();
  const newResult: ResultRecord = {
    id: 'res_' + crypto.randomUUID(),
    userId: user.id,
    matchDate,
    matchTime: matchTime || undefined,
    matchType,
    result,
    placement: placement !== undefined && placement !== null ? Number(placement) : undefined,
    kills: kills !== undefined && kills !== null ? Number(kills) : undefined,
    damage: damage !== undefined && damage !== null ? Number(damage) : undefined,
    notes: notes?.trim() || undefined,
    screenshotUrl: screenshotUrl || undefined,
    matchScheduleId: matchScheduleId || undefined,
    entryFee: entryFee !== undefined && entryFee !== null ? Math.max(0, Number(entryFee) || 0) : undefined,
    prizeMoney: prizeMoney !== undefined && prizeMoney !== null ? Math.max(0, Number(prizeMoney) || 0) : undefined,
    extraExpenses: extraExpenses !== undefined && extraExpenses !== null ? Math.max(0, Number(extraExpenses) || 0) : undefined,
    expenseNotes: expenseNotes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const results = db.results[user.id] || [];
  results.unshift(newResult);
  db.results[user.id] = results;

  // If associated with a scheduled match, mark it completed
  if (matchScheduleId) {
    const matches = db.matches[user.id] || [];
    const mIdx = matches.findIndex((m) => m.id === matchScheduleId);
    if (mIdx !== -1) {
      matches[mIdx].isCompleted = true;
      db.matches[user.id] = matches;
    }
  }

  writeDb(db);
  res.status(201).json(newResult);
});

app.put('/api/results/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const resultId = req.params.id;
  const db = readDb();
  const results = db.results[user.id] || [];
  const idx = results.findIndex((r) => r.id === resultId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Match result record not found.' });
  }

  const {
    matchDate,
    matchTime,
    matchType,
    result,
    placement,
    kills,
    damage,
    notes,
    screenshotUrl,
    entryFee,
    prizeMoney,
    extraExpenses,
    expenseNotes,
  } = req.body;

  results[idx] = {
    ...results[idx],
    matchDate: matchDate || results[idx].matchDate,
    matchTime: matchTime !== undefined ? matchTime : results[idx].matchTime,
    matchType: matchType || results[idx].matchType,
    result: result || results[idx].result,
    placement: placement !== undefined ? (placement !== null ? Number(placement) : undefined) : results[idx].placement,
    kills: kills !== undefined ? (kills !== null ? Number(kills) : undefined) : results[idx].kills,
    damage: damage !== undefined ? (damage !== null ? Number(damage) : undefined) : results[idx].damage,
    notes: notes !== undefined ? notes?.trim() : results[idx].notes,
    screenshotUrl: screenshotUrl !== undefined ? screenshotUrl : results[idx].screenshotUrl,
    entryFee: entryFee !== undefined ? (entryFee !== null ? Math.max(0, Number(entryFee) || 0) : undefined) : results[idx].entryFee,
    prizeMoney: prizeMoney !== undefined ? (prizeMoney !== null ? Math.max(0, Number(prizeMoney) || 0) : undefined) : results[idx].prizeMoney,
    extraExpenses: extraExpenses !== undefined ? (extraExpenses !== null ? Math.max(0, Number(extraExpenses) || 0) : undefined) : results[idx].extraExpenses,
    expenseNotes: expenseNotes !== undefined ? expenseNotes?.trim() : results[idx].expenseNotes,
  };

  db.results[user.id] = results;
  writeDb(db);
  res.json(results[idx]);
});

// Dedicated Profit & Loss route for updating financial records for any match
app.put('/api/profit-loss/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const resultId = req.params.id;
  const db = readDb();
  const results = db.results[user.id] || [];
  const idx = results.findIndex((r) => r.id === resultId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Match result not found.' });
  }

  const { entryFee, prizeMoney, extraExpenses, expenseNotes } = req.body;

  results[idx] = {
    ...results[idx],
    entryFee: entryFee !== undefined ? Math.max(0, Number(entryFee) || 0) : results[idx].entryFee,
    prizeMoney: prizeMoney !== undefined ? Math.max(0, Number(prizeMoney) || 0) : results[idx].prizeMoney,
    extraExpenses: extraExpenses !== undefined ? Math.max(0, Number(extraExpenses) || 0) : results[idx].extraExpenses,
    expenseNotes: expenseNotes !== undefined ? String(expenseNotes).trim() : results[idx].expenseNotes,
  };

  db.results[user.id] = results;
  writeDb(db);
  res.json(results[idx]);
});

app.delete('/api/results/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const resultId = req.params.id;
  const db = readDb();
  const results = db.results[user.id] || [];
  const filtered = results.filter((r) => r.id !== resultId);

  if (results.length === filtered.length) {
    return res.status(404).json({ error: 'Result record not found.' });
  }

  db.results[user.id] = filtered;
  writeDb(db);
  res.json({ success: true, message: 'Result record deleted.' });
});

// ================= PROFILE ROUTES =================
app.get('/api/profile', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  res.json(sanitizeUser(user));
});

app.put('/api/profile', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { fullName, ign, bio, role, avatarUrl, bannerUrl } = req.body;

  const db = readDb();
  const current = db.users[user.id];
  if (!current) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (fullName !== undefined && fullName.trim()) current.fullName = fullName.trim();
  if (ign !== undefined) current.ign = ign.trim();
  if (bio !== undefined) current.bio = bio.trim();
  if (role !== undefined) current.role = role;
  if (avatarUrl !== undefined) current.avatarUrl = avatarUrl;
  if (bannerUrl !== undefined) current.bannerUrl = bannerUrl;

  db.users[user.id] = current;
  writeDb(db);
  res.json(sanitizeUser(current));
});

// ================= NOTIFICATIONS ROUTES =================
app.get('/api/notifications', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  const notifs = db.notifications[user.id] || [];
  res.json(notifs);
});

app.post('/api/notifications/read', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  const notifs = db.notifications[user.id] || [];
  notifs.forEach((n) => {
    n.read = true;
  });
  db.notifications[user.id] = notifs;
  writeDb(db);
  res.json({ success: true, notifs });
});

app.delete('/api/notifications', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDb();
  db.notifications[user.id] = [];
  writeDb(db);
  res.json({ success: true, message: 'Notifications cleared.' });
});

// ================= OCR SCREENSHOT EXTRACTION ROUTE =================
app.post('/api/ocr/analyze', authMiddleware, async (req: Request, res: Response) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided for OCR analysis.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      fallback: true,
      message: 'GEMINI_API_KEY is not configured. Please enter match results manually.',
      extracted: {
        result: 'WIN',
        matchType: 'Squad',
        placement: 1,
        kills: 0,
        damage: 0,
        confidence: 0,
        detectedText: '',
      },
    });
  }

  try {
    const ai = new GoogleGenAI();
    // Clean base64 header if present
    const cleanData = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mediaMimeType = mimeType || 'image/png';

    const prompt = `You are an expert Free Fire esports match scorecard OCR analyzer.
Analyze the provided screenshot of a Garena Free Fire match end/result screen, scorecard, or match summary.
Extract the following information accurately:
1. Result: Was it a WIN (Booyah! / Victory / 1st place) or LOSS (Defeat / eliminated / Rank 2 or lower)?
2. Placement / Rank: e.g. 1 for Booyah, 2, 3, etc.
3. Kills: total kills by the player or team shown.
4. Total Damage: damage points dealt if visible.
5. Match Type: Solo, Duo, or Squad (based on player list, lobby icons, or HUD). Default to Squad if unsure.
6. Detected summary text: key lines recognized on screen.

Respond ONLY with valid JSON in this exact structure:
{
  "result": "WIN" or "LOSS",
  "placement": number or null,
  "kills": number or null,
  "damage": number or null,
  "matchType": "Solo" or "Duo" or "Squad",
  "confidence": number between 50 and 99,
  "detectedText": "short text excerpt of what you saw"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanData,
                mimeType: mediaMimeType,
              },
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    // Extract JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid OCR response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return res.json({
      success: true,
      extracted: {
        result: parsed.result === 'WIN' ? 'WIN' : 'LOSS',
        placement: typeof parsed.placement === 'number' ? parsed.placement : 1,
        kills: typeof parsed.kills === 'number' ? parsed.kills : 0,
        damage: typeof parsed.damage === 'number' ? parsed.damage : 0,
        matchType: ['Solo', 'Duo', 'Squad'].includes(parsed.matchType) ? parsed.matchType : 'Squad',
        confidence: parsed.confidence || 90,
        detectedText: parsed.detectedText || 'Recognized from scoreboard screenshot.',
      },
    });
  } catch (error: any) {
    console.error('OCR Error:', error?.message || error);
    return res.status(200).json({
      fallback: true,
      message: 'Automatic OCR could not fully read the image. Please verify and edit the fields below manually.',
      extracted: {
        result: 'WIN',
        matchType: 'Squad',
        placement: 1,
        kills: 0,
        damage: 0,
        confidence: 40,
        detectedText: 'Could not automatically parse image.',
      },
    });
  }
});

// Vite Integration Setup
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DESTROYED eSports] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
