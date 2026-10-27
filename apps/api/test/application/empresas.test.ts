import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CrearEmpresaCasoDeUso } from "../../src/application/use-cases/crear-empresa.js";
import { ObtenerEmpresaCasoDeUso } from "../../src/application/use-cases/obtener-empresa.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { RepositorioDeEmpresasEnMemoria } from "../../src/adapters/out/persistence/memory/repositorio-de-empresas-en-memoria.js";
import { InMemoryUserRepository } from "../../src/adapters/out/persistence/memory/in-memory-user-repository.js";
import { User } from "../../src/domain/entities/user.js";
import { NoEncontradoError, ValidacionError } from "../../src/domain/errors.js";
import { Email } from "../../src/domain/value-objects/email.js";

describe("CrearEmpresa y ObtenerEmpresa", () => {
  let users: InMemoryUserRepository;
  let crearEmpresa: CrearEmpresaCasoDeUso;
  let obtenerEmpresa: ObtenerEmpresaCasoDeUso;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    const empresas = new RepositorioDeEmpresasEnMemoria();
    crearEmpresa = new CrearEmpresaCasoDeUso(empresas, users, new GeneradorDeIdsUuid());
    obtenerEmpresa = new ObtenerEmpresaCasoDeUso(empresas);
  });

  it("crea una empresa sin usuario", async () => {
    const empresa = await crearEmpresa.ejecutar({ nombre: " Acme ", pais: "Argentina" });

    assert.equal(empresa.nombre, "Acme");
    assert.equal(empresa.user, null);
    assert.equal(await obtenerEmpresa.ejecutar(empresa.id), empresa);
  });

  it("crea una empresa asociada a un usuario existente", async () => {
    const user = User.create({
      id: "u-1",
      email: Email.create("ana@ejemplo.com"),
      passwordHash: "hash",
    });
    await users.save(user);

    const empresa = await crearEmpresa.ejecutar({
      nombre: "Acme",
      pais: "Argentina",
      userId: "u-1",
    });

    assert.equal(empresa.user, user);
  });

  it("rechaza un usuario inexistente", async () => {
    await assert.rejects(
      crearEmpresa.ejecutar({ nombre: "Acme", pais: "Argentina", userId: "no-existe" }),
      NoEncontradoError,
    );
  });

  it("rechaza nombre o país vacíos", async () => {
    await assert.rejects(crearEmpresa.ejecutar({ nombre: "  ", pais: "Argentina" }), ValidacionError);
    await assert.rejects(crearEmpresa.ejecutar({ nombre: "Acme", pais: "" }), ValidacionError);
  });

  it("falla al obtener una empresa inexistente", async () => {
    await assert.rejects(obtenerEmpresa.ejecutar("no-existe"), NoEncontradoError);
  });
});
