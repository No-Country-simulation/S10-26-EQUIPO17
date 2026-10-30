# **<u>Editar Desafíos:</u>** 

Actor principal :Empresa. 

Actor secundario :Organizador. 

Precondiciones: Usuario autenticado; El  desafío existe y se puede editar. 

Disparador: La compañía requiere que se modifique un desafío. 

# **Flujo principal** 

1. La empresa selecciona uno de sus desafíos registrados. 

2. El sistema recupera y muestra la información actual del desafío. 

3. La empresa modifica los campos que desea. 

4. La empresa envía la solicitud de modificación. 

5. El sistema valida los datos ingresados y los permisos del usuario. 

6. El sistema registra la solicitud y se la presenta al organizador. 

7. El organizador revisa la solicitud. 

8. El organizador aprueba los cambios solicitados. 

9. El sistema aplica los cambios y guarda las modificaciones en el desafío. 

10. El sistema notifica a la empresa que los cambios se realizaron correctamente. 

# **Flujos alternativos** 

- **1 — Datos inválidos:** El sistema detecta errores en los campos ingresados, informa a la empresa y permite corregirlos. 

- **2 — Desafío inexistente o sin permisos:** El sistema informa que el desafío no existe o que la empresa no tiene autorización para modificarlo. 

- **3 — Simulación iniciada y ya paso la primera semana:** El sistema impide la modificación e informa que el desafío ya no puede editarse. 

- **4 — Error al guardar:** El sistema informa que no fue posible aplicar las modificaciones. 

# **Postcondiciones** 

- **Éxito:** El desafío queda actualizado con los cambios aprobados. 

- **Rechazo:** La información original del desafío permanece sin modificaciones. 


# **<u>Listar Desafíos:</u>** 



Actor principal :Empresa. 

Actor secundario : Ninguno.

Precondiciones : Usuario autenticado. El/los desafíos existen y la empresa tiene acceso a la sección desafíos. 

Disparador : La compañía quiere revisar sus desafíos. 

# **Flujo principal** 

1. La empresa accede a la sección «Mis Desafíos». 

2. El sistema identifica a la empresa autenticada. 

3. El sistema recupera los desafíos asociados a dicha empresa. 

4. El sistema muestra el listado de desafíos con su información relevante, como título, etapa y estado. 

5. La empresa puede consultar los desafíos que aparecen en el listado. Además, la misma puede usar el buscador o los filtros para encontrar desafíos específicos. 

# **Flujos alternativos** 

- **1 — No hay desafíos registrados:** El sistema informa que la empresa no tiene desafíos registrados 

- **2 — Error al cargar información:** El sistema informa que no se pudieron cargar los desafíos. Que intente nuevamente. 

# **Postcondiciones** 

- **Éxito:** El sistema muestra los desafíos asociados a la empresa. 

- **Sin resultados:** El sistema muestra una lista vacía con el mensaje “no hay desafíos registrados” 

