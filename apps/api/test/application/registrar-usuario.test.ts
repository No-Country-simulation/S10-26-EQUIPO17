import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { RegistrarUsuarioCasoDeUso } from "../../src/application/use-cases/registrar-usuario.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { RepositorioDeUsuariosEnMemoria } from "../../src/adapters/out/persistence/memory/repositorio-de-usuarios-en-memoria.js";
import { HasherDeClavesScrypt } from "../../src/adapters/out/security/hasher-de-claves-scrypt.js";
import { ConflictoError, ValidacionError } from "../../src/domain/errors.js";

describe("RegistrarUsuario", () => {
  let usuarios: RepositorioDeUsuariosEnMemoria;
  let registrarUsuario: RegistrarUsuarioCasoDeUso;

  beforeEach(() => {
    usuarios = new RepositorioDeUsuariosEnMemoria();
    registrarUsuario = new RegistrarUsuarioCasoDeUso(
      usuarios,
      new HasherDeClavesScrypt(),
      new GeneradorDeIdsUuid(),
    );
  });

  it("guarda el usuario con el correo normalizado y la clave hasheada", async () => {
    const usuario = await registrarUsuario.ejecutar({
      correo: "  Ana@Ejemplo.com ",
      clave: "clave-segura",
    });

    assert.equal(usuario.correo.valor, "ana@ejemplo.com");
    assert.notEqual(usuario.clave, "clave-segura");
    assert.match(usuario.clave, /^scrypt\$/);
    assert.equal(await usuarios.buscarPorId(usuario.id), usuario);
  });

  it("rechaza un correo ya registrado", async () => {
    await registrarUsuario.ejecutar({ correo: "ana@ejemplo.com", clave: "clave-segura" });

    await assert.rejects(
      registrarUsuario.ejecutar({ correo: "ANA@ejemplo.com", clave: "otra-clave" }),
      ConflictoError,
    );
  });

  it("rechaza un correo inválido", async () => {
    await assert.rejects(
      registrarUsuario.ejecutar({ correo: "no-es-un-correo", clave: "clave-segura" }),
      ValidacionError,
    );
  });

  it("rechaza una clave corta", async () => {
    await assert.rejects(
      registrarUsuario.ejecutar({ correo: "ana@ejemplo.com", clave: "corta" }),
      ValidacionError,
    );
  });
});
