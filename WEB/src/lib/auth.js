module.exports = {
  isLoggedIn(req, res, next) {
    // * Valida si esta logeado, de lo contrario manda al Login
    if (req.isAuthenticated()) {
      return next();
    } else {
      return res.redirect("/login");
    }
  },
  isNotLoggedIn(req, res, next) {
    // * SI ya esta logeado y va al Login lo manda al Inicio
    if (!req.isAuthenticated()) {
      return next();
    } else {
      return res.redirect("/redirect");
    }
  },
  error404(req, res) {
    res.status(404).render("auth/err404", { err404: true, title: "Error 404" });
  },
  isAdministrador(req, res, next) {
    let rol = req.user.rpermiso.PER_CNIVEL;
    if (rol === "Administrador") {
      next();
    } else {
      res.status(401).json({ error: 401, message: "Acceso Denegado" });
    }
  },
};
