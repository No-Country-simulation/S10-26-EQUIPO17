import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CrearEmpresaCasoDeUso } from "../../src/application/use-cases/crear-empresa.js";
import { ObtenerEmpresaCasoDeUso } from "../../src/application/use-cases/obtener-empresa.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { RepositorioDeEmpresasEnMemoria } from "../../src/adapters/out/persistence/memory/repositorio-de-empresas-en-memoria.js";
import { RepositorioDeUsuariosEnMemoria } from "../../src/adapters/out/persistence/memory/repositorio-de-usuarios-en-memoria.js";
import { Usuario } from "../../src/domain/entities/usuario.js";
import { NoEncontradoError, ValidacionError } from "../../src/domain/errors.js";
import { Correo } from "../../src/domain/value-objects/correo.js";

describe("CrearEmpresa y ObtenerEmpresa", () => {
  let usuarios: RepositorioDeUsuariosEnMemoria;
  let crearEmpresa: CrearEmpresaCasoDeUso;
  let obtenerEmpresa: ObtenerEmpresaCasoDeUso;

  beforeEach(() => {
    usuarios = new RepositorioDeUsuariosEnMemoria();
    const empresas = new RepositorioDeEmpresasEnMemoria();
    crearEmpresa = new CrearEmpresaCasoDeUso(empresas, usuarios, new GeneradorDeIdsUuid());
    obtenerEmpresa = new ObtenerEmpresaCasoDeUso(empresas);
  });

  it("crea una empresa sin usuario", async () => {
    const empresa = await crearEmpresa.ejecutar({ nombre: " Acme ", pais: "Argentina" });

    assert.equal(empresa.nombre, "Acme");
    assert.equal(empresa.usuario, null);
    assert.equal(await obtenerEmpresa.ejecutar(empresa.id), empresa);
  });

  it("crea una empresa asociada a un usuario existente", async () => {
    const usuario = Usuario.crear({
      id: "u-1",
      correo: Correo.crear("ana@ejemplo.com"),
      clave: "hash",
    });
    await usuarios.guardar(usuario);

    const empresa = await crearEmpresa.ejecutar({
      nombre: "Acme",
      pais: "Argentina",
      usuarioId: "u-1",
    });

    assert.equal(empresa.usuario, usuario);
  });

  it("rechaza un usuario inexistente", async () => {
    await assert.rejects(
      crearEmpresa.ejecutar({ nombre: "Acme", pais: "Argentina", usuarioId: "no-existe" }),
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
