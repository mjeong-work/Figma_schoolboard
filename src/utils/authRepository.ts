export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  verified: boolean;
  status: UserStatus;
  avatar?: string;
  graduationYear?: string;
  createdAt: number;
}

export interface AuthRepository {
  getAllUsers: () => AuthUserRecord[];
  findByEmail: (email: string) => AuthUserRecord | null;
  findById: (id: string) => AuthUserRecord | null;
  createUser: (user: AuthUserRecord) => void;
  updateUser: (id: string, updates: Partial<AuthUserRecord>) => AuthUserRecord | null;
}

const DB_STORAGE_KEY = 'campusconnect_db_users';
const LEGACY_STORAGE_KEY = 'campusconnect_users';

const seedUsers = (): AuthUserRecord[] => [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@university.edu',
    // Demo-only password. Replace with secure hash in production.
    password: 'password',
    role: 'Administrator',
    department: 'Administration',
    verified: true,
    status: 'approved',
    createdAt: Date.now(),
  },
];

const parseStoredUsers = (raw: string | null): AuthUserRecord[] | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthUserRecord[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

const writeUsers = (users: AuthUserRecord[]) => {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(users));
};

const normalizeLegacyUser = (legacy: any): AuthUserRecord => ({
  id: String(legacy.id ?? Date.now()),
  name: String(legacy.name ?? 'Unknown User'),
  email: String(legacy.email ?? ''),
  password: String(legacy.password ?? 'password'),
  role: String(legacy.role ?? 'Current Student'),
  department: String(legacy.department ?? 'Undeclared'),
  verified: Boolean(legacy.verified),
  status: (legacy.status ?? 'pending') as UserStatus,
  avatar: legacy.avatar,
  graduationYear: legacy.graduationYear,
  createdAt: Number(legacy.createdAt ?? Date.now()),
});

const readUsers = (): AuthUserRecord[] => {
  const dbUsers = parseStoredUsers(localStorage.getItem(DB_STORAGE_KEY));
  if (dbUsers && dbUsers.length > 0) {
    return dbUsers;
  }

  // one-time migration for old localStorage key
  const legacyUsers = parseStoredUsers(localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacyUsers && legacyUsers.length > 0) {
    const migrated = legacyUsers.map(normalizeLegacyUser);
    writeUsers(migrated);
    return migrated;
  }

  const seeded = seedUsers();
  writeUsers(seeded);
  return seeded;
};

export const localAuthRepository: AuthRepository = {
  getAllUsers: () => readUsers(),

  findByEmail: (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    return (
      readUsers().find((user) => user.email.toLowerCase() === normalizedEmail) ?? null
    );
  },

  findById: (id: string) => {
    return readUsers().find((user) => user.id === id) ?? null;
  },

  createUser: (user: AuthUserRecord) => {
    const users = readUsers();
    users.push(user);
    writeUsers(users);
  },

  updateUser: (id: string, updates: Partial<AuthUserRecord>) => {
    const users = readUsers();
    const index = users.findIndex((user) => user.id === id);

    if (index === -1) return null;

    const updated = {
      ...users[index],
      ...updates,
      id: users[index].id,
      email: users[index].email,
    };

    users[index] = updated;
    writeUsers(users);
    return updated;
  },
};

export const AUTH_DB_STORAGE_KEY = DB_STORAGE_KEY;
