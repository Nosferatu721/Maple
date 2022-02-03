const Handlebars = require("handlebars");

Handlebars.registerHelper("isAdministradorSupervisor", (value) => {
  return value === "Administrador" || value === "SUPERVISOR";
});

Handlebars.registerHelper("isAdministradorAgente", (value) => {
  return value === "Administrador" || value === "AGENTE";
});