import type {
  AuthenticatedUser,
  AuthProvider,
  AuthSession,
  RefreshedAuthSession,
} from "../../../application/ports/out/auth-provider.js";
import type { GeneradorDeIds } from "../../../application/ports/out/generador-de-ids.js";
import { User } from "../../../domain/entities/user.js";
import {
  ConflictoError,
  CredencialesInvalidasError,
  NoAutenticadoError,
} from "../../../domain/errors.js";
import type { Email } from "../../../domain/value-objects/email.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";
import type { InMemoryUserRepository } from "../persistence/memory/in-memory-user-repository.js";

/** Same lifetime Supabase Auth gives access tokens by default. */
const ACCESS_TOKEN_SECONDS = 3600;

/**
 * In-memory implementation of the port. Used by tests and to develop without a database.
 * Saving into the users repository mimics the on_auth_user_created trigger.
 * Passwords are kept in plain text: this adapter must never back real users.
 */
export class InMemoryAuthProvider implements AuthProvider {
  private readonly roles = new Map<string, UserRole>();
  private readonly passwords = new Map<string, string>();
  /** Access token -> user id. */
  private readonly accessTokens = new Map<string, string>();
  /** Refresh token -> user id. */
  private readonly refreshTokens = new Map<string, string>();

  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly ids: GeneradorDeIds,
  ) {}

  async register(email: Email, password: string, role?: UserRole): Promise<string> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictoError("A user with that email already exists");
    }
    const id = this.ids.generar();
    await this.users.save(User.create({ id, email }));
    this.passwords.set(id, password);
    if (role) this.roles.set(id, role);
    return id;
  }

  async remove(id: string): Promise<void> {
    this.roles.delete(id);
    this.passwords.delete(id);
    for (const [token, userId] of this.accessTokens) {
      if (userId === id) this.accessTokens.delete(token);
    }
    for (const [token, userId] of this.refreshTokens) {
      if (userId === id) this.refreshTokens.delete(token);
    }
    await this.users.delete(id);
  }

  async logIn(email: Email, password: string): Promise<AuthSession> {
    const user = await this.users.findByEmail(email);
    if (!user || this.passwords.get(user.id) !== password) {
      throw new CredencialesInvalidasError();
    }
    return this.issueSession(user.id);
  }

  async refreshSession(refreshToken: string): Promise<RefreshedAuthSession> {
    const userId = this.refreshTokens.get(refreshToken);
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) throw new NoAutenticadoError();
    this.refreshTokens.delete(refreshToken);
    return { ...this.issueSession(user.id), email: user.email.value };
  }

  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const userId = this.accessTokens.get(accessToken);
    if (!userId) throw new NoAutenticadoError();
    return { userId, role: this.roleOf(userId) };
  }

  private issueSession(userId: string): AuthSession {
    const accessToken = this.ids.generar();
    const refreshToken = this.ids.generar();
    this.accessTokens.set(accessToken, userId);
    this.refreshTokens.set(refreshToken, userId);
    return {
      userId,
      role: this.roleOf(userId),
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_SECONDS,
    };
  }

  /** Not part of the port: lets tests check the role a user was registered with. */
  roleOf(id: string): UserRole | null {
    return this.roles.get(id) ?? null;
  }
}
