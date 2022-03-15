const Handlebars = require("handlebars");

Handlebars.registerHelper("isAdministradorSupervisor", (value) => {
  return value === "Administrador" || value === "SUPERVISOR";
});

Handlebars.registerHelper("isAdministradorAgente", (value) => {
  return value === "Administrador" || value === "AGENTE";
});

Handlebars.registerHelper('isEnviado', (value) => {
  return value === 'ENVIADO';
});

Handlebars.registerHelper('isOutbound', (value) => {
  return value === null || value === 0;
});