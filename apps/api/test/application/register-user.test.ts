import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { RegisterUserUseCase } from "../../src/application/use-cases/register-user.js";
import { InMemoryAuthProvider } from "../../src/adapters/out/auth/in-memory-auth-provider.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryUserRepository } from "../../src/adapters/out/persistence/memory/in-memory-user-repository.js";
import { ConflictoError, ValidacionError } from "../../src/domain/errors.js";

describe("RegisterUser", () => {
  let users: InMemoryUserRepository;
  let registerUser: RegisterUserUseCase;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    registerUser = new RegisterUserUseCase(
      new InMemoryAuthProvider(users, new GeneradorDeIdsUuid()),
    );
  });

  it("registers the user in the auth provider with a normalized email", async () => {
    const user = await registerUser.execute({
      email: "  Ana@Ejemplo.com ",
      password: "clave-segura",
    });

    assert.equal(user.email.value, "ana@ejemplo.com");
    assert.deepEqual(await users.findById(user.id), user);
  });

  it("rejects an already registered email", async () => {
    await registerUser.execute({ email: "ana@ejemplo.com", password: "clave-segura" });

    await assert.rejects(
      registerUser.execute({ email: "ANA@ejemplo.com", password: "otra-clave" }),
      ConflictoError,
    );
  });

  it("rejects an invalid email", async () => {
    await assert.rejects(
      registerUser.execute({ email: "not-an-email", password: "clave-segura" }),
      ValidacionError,
    );
  });

  it("rejects a short password without registering the user", async () => {
    await assert.rejects(
      registerUser.execute({ email: "ana@ejemplo.com", password: "corta" }),
      ValidacionError,
    );

    const user = await registerUser.execute({ email: "ana@ejemplo.com", password: "clave-segura" });
    assert.equal(user.email.value, "ana@ejemplo.com");
  });
});
