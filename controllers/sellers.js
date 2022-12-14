const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

module.exports.renderIndex = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const id_user = req.session.id_user;
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_user]
    );
    // console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      const [result] = await pool.query(
        `SELECT sellers.id_seller, users.id_user, users.nombre, users.email, sellers.id_company
        FROM sellers
        INNER JOIN users ON sellers.id_user = users.id_user
        WHERE sellers.id_company = ?`,
        [idCompany]
      );
      // console.log("Sellers of company", result);
      res.render("sellers/index", {
        pageSelect: "sellers",
        sellers: result,
        company: resultOwn[0],
      });
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.renderNew = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const id_user = req.session.id_user;
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_user]
    );
    // console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      res.render(`sellers/new`, {
        pageSelect: "sellers",
        company: resultOwn[0],
      });
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.createSeller = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const id_user = req.session.id_user;
    const dataUser = req.body;
    // console.log(dataUser);
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_user]
    );
    // console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      // CHECK USER EXISTS
      const [result] = await pool.query(`SELECT * FROM users WHERE email = ?`, [
        dataUser.email,
      ]);
      // console.log("CHECK USER", result);
      if (!result.length) {
        bcrypt.hash(dataUser.password, 12).then(async (hash) => {
          dataUser.password = hash;
          const [result] = await pool.query(
            `INSERT INTO users SET nombre = ?, email= ?, password = ?, id_rol = 2`,
            [dataUser.username, dataUser.email, dataUser.password]
          );
          const [resultSeller] = await pool.query(
            `INSERT INTO sellers SET id_user = ?, id_company = ?`,
            [result["insertId"], idCompany]
          );
          // console.log("User created and seller!", resultSeller);
          req.flash("success", "Usuario creado exitosamente!");
          res.redirect(`/companies/${idCompany}/sellers`);
        });
      } else {
        req.flash("error", "Correo electronico ya registrado!");
        res.redirect(`/companies/${idCompany}/sellers`);
      }
    }
  } catch (error) {
    // console.log("Error", error);
    req.flash("error", "Error contacte con Becuador!");
    res.redirect(`/companies`);
  }
};

module.exports.deleteSeller = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idSeller } = req.params;
    const id_user = req.session.id_user;
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_user]
    );
    // console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      const [result] = await pool.query(
        `DELETE users
      FROM users
      JOIN sellers on sellers.id_user = users.id_user
      WHERE sellers.id_company = ? AND users.id_user = ?`,
        [idCompany, idSeller]
      );
      // console.log("Seller delete!", result);
      req.flash("success", "Ha eliminado con éxito al usuario!");
      res.redirect(`/companies/${idCompany}/sellers`);
    }
  } catch (error) {
    // console.log("Error", error);
    req.flash("error", "Error contacte con Becuador!");
    res.redirect("/companies");
  }
};