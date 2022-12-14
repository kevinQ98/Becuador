module.exports.isLoggedIn = (req, res, next) => {
  if (req.session.loggedin != true) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "Es necesario iniciar sesión primero!");
    return res.redirect("/login");
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (req.session.isAdmin != true) {
    req.flash("error", "Accion no permitida!");
    return res.redirect("/login");
  }
  next();
};

module.exports.isOwner = (req, res, next) => {
  if (req.session.isAdmin != true) {
    req.flash("error", "Accion no permitida!");
    return res.redirect("/");
  }
  next();
};
