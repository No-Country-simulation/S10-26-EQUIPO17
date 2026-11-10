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

/** Who a token belongs to. A refresh keeps the session, as Supabase does. */
interface TokenOwner {
  userId: string;
  sessionId: string;
}

/**
 * In-memory implementation of the port. Used by tests and to develop without a database.
 * Saving into the users repository mimics the on_auth_user_created trigger.
 * Passwords are kept in plain text: this adapter must never back real users.
 */
export class InMemoryAuthProvider implements AuthProvider {
  private readonly roles = new Map<string, UserRole>();
  private readonly passwords = new Map<string, string>();
  private readonly accessTokens = new Map<string, TokenOwner>();
  private readonly refreshTokens = new Map<string, TokenOwner>();

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
    this.revokeTokens((owner) => owner.userId === id);
    await this.users.delete(id);
  }

  async logIn(email: Email, password: string): Promise<AuthSession> {
    const user = await this.users.findByEmail(email);
    if (!user || this.passwords.get(user.id) !== password) {
      throw new CredencialesInvalidasError();
    }
    return this.issueSession({ userId: user.id, sessionId: this.ids.generar() });
  }

  async refreshSession(refreshToken: string): Promise<RefreshedAuthSession> {
    const owner = this.refreshTokens.get(refreshToken);
    const user = owner ? await this.users.findById(owner.userId) : null;
    if (!owner || !user) throw new NoAutenticadoError();
    this.refreshTokens.delete(refreshToken);
    return { ...this.issueSession(owner), email: user.email.value };
  }

  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const owner = this.accessTokens.get(accessToken);
    const user = owner ? await this.users.findById(owner.userId) : null;
    if (!owner || !user) throw new NoAutenticadoError();
    return { userId: owner.userId, email: user.email.value, role: this.roleOf(owner.userId) };
  }

  async logOut(accessToken: string): Promise<void> {
    const owner = this.accessTokens.get(accessToken);
    if (!owner) throw new NoAutenticadoError();
    this.revokeTokens((other) => other.sessionId === owner.sessionId);
  }

  private issueSession(owner: TokenOwner): AuthSession {
    const accessToken = this.ids.generar();
    const refreshToken = this.ids.generar();
    this.accessTokens.set(accessToken, owner);
    this.refreshTokens.set(refreshToken, owner);
    return {
      userId: owner.userId,
      role: this.roleOf(owner.userId),
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_SECONDS,
    };
  }

  private revokeTokens(matches: (owner: TokenOwner) => boolean): void {
    for (const tokens of [this.accessTokens, this.refreshTokens]) {
      for (const [token, owner] of tokens) {
        if (matches(owner)) tokens.delete(token);
      }
    }
  }

  /** Not part of the port: lets tests check the role a user was registered with. */
  roleOf(id: string): UserRole | null {
    return this.roles.get(id) ?? null;
  }
}
