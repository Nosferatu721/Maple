const router = require("express").Router();

// ! Para el Control de Usuarios
// ? Agregar a route como middleware que solo pueda acceder el rol specificado
const { isAdministrador } = require("../lib/auth");

router.get('/transferencias', (req, res) => {
  res.render('GECA/transferencias', { title: 'transferencias' });
});

module.exports = router;
