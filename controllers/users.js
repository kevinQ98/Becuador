const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

module.exports.renderRegister = (req, res) => {
  if (req.session.loggedin != true) {
    res.render("users/register", { selectPage: "register" });
  } else {
    // CHECK USER TYPE
    res.redirect("/companies");
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const dataUser = req.body;
    // CHECK USER EXISTS
    const [result] = await pool.query(`SELECT * FROM users WHERE email = ?`, [
      dataUser.email,
    ]);
    // console.log("CHECK USER", result);
    if (!result.length) {
      bcrypt.hash(dataUser.password, 12).then(async (hash) => {
        dataUser.password = hash;
        const [result] = await pool.query(
          `INSERT INTO users SET nombre = ?, email= ?, password = ?, id_rol = 1`,
          [dataUser.username, dataUser.email, dataUser.password]
        );
        // console.log("User created!", result);
        req.session.loggedin = true;
        req.session.nombre = dataUser.username;
        req.session.isAdmin = true;
        req.session.id_user = result["insertId"];
        req.flash("success", "Hola!, Bienvenid@ a Becuador");
        res.redirect("/companies");
      });
    } else {
      req.flash("error", "Usuario ya registrado!");
      res.redirect("/login");
    }
  } catch (error) {
    // console.log("Error", error);
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/login");
  }
};

module.exports.renderLogin = (req, res) => {
  if (req.session.loggedin != true) {
    res.render("users/login", { selectPage: "login" });
  } else {
    // CHECK USER TYPE
    res.redirect("/companies");
  }
};

module.exports.login = async (req, res, next) => {
  const dataUser = req.body;
  try {
    // CHECK USER EXISTS
    const [result] = await pool.query(`SELECT * FROM users WHERE email = ?`, [
      dataUser.email,
    ]);
    // console.log("CHECK USER LOGIN", result);
    if (!result.length) {
      req.flash("error", "Usuario no registrado!");
      res.redirect("/register");
    } else {
      // CHECK CREDENTIALS
      const comparison = await bcrypt.compare(
        dataUser.password,
        result[0].password
      );
      if (comparison) {
        req.session.loggedin = true;
        req.session.nombre = result[0].nombre;
        req.session.id_user = result[0].id_user;
        req.session.isAdmin = result[0].id_rol === 1 ? true : false;
        req.flash("success", "Es un bueno volver a verte!");
        // CHECK USER TYPE
        const redirectUrl =
          result[0].id_rol === 1
            ? req.session.returnTo || "/companies"
            : req.session.returnTo || "/";
        delete req.session.returnTo;
        res.redirect(redirectUrl);
      } else {
        req.flash(
          "error",
          "El correo electrónico o la contraseña son incorrectos!"
        );
        res.redirect("/login");
      }
    }
  } catch (error) {
    // console.log("Error", error);
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/login");
  }
};

module.exports.logout = (req, res) => {
  if (req.session.loggedin == true) {
    req.session.destroy();
  }
  res.redirect("/login");
};
