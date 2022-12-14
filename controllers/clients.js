const { pool } = require("../config/db");

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
        `SELECT clients.id_client, clients.ruc, clients.razonSocial, clients.email, clients.telefono, clients.direccion, users.nombre
        FROM clients, users
        WHERE clients.id_company = ? AND clients.element_by = users.id_user`,
        [idCompany]
      );
      // console.log("Clients of company", result);
      res.render("clients/index", {
        pageSelect: "clients",
        clients: result,
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
      res.render(`clients/new`, {
        pageSelect: "clients",
        company: resultOwn[0],
      });
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.createClient = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const id_user = req.session.id_user;
    const dataClient = req.body;
    // console.log(dataClient);
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
      // CHECK CLIENT EXIST IN COMPANY
      const [resultOwn] = await pool.query(
        `SELECT * FROM clients WHERE id_company = ? AND ruc = ?`,
        [idCompany, dataClient.ruc]
      );
      // console.log("Client found in company!", resultOwn);

      if (resultOwn.length) {
        req.flash("error", "Cliente ya registrado!");
        res.redirect(`/companies/${idCompany}/clients`);
      } else {
        const [result] = await pool.query(
          `INSERT INTO clients SET tipoIdentificacion = ?, ruc = ?, razonSocial = ?, direccion = ?, telefono = ?, email = ?, id_company = ?, element_by = ?`,
          [
            dataClient.tipoIdentificacion,
            dataClient.ruc,
            dataClient.razonSocial,
            dataClient.direccion,
            dataClient.telefono,
            dataClient.email,
            idCompany,
            id_user,
          ]
        );
        // console.log("Client created!", result);
        req.flash("success", "Cliente creado exitosamente!");
        res.redirect(`/companies/${idCompany}/clients`);
      }
    }
  } catch (error) {
    // console.log("Error", error);
    req.flash("error", "Error contacte con Becuador!");
    res.redirect(`/companies`);
  }
};

module.exports.renderEdit = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idClient } = req.params;
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
      // CHECK CLIENT IN COMPANY EXIST
      const [resultClient] = await pool.query(
        `SELECT clients.id_client, clients.tipoIdentificacion, clients.ruc, clients.razonSocial, clients.email, clients.telefono, clients.direccion
        FROM clients
        WHERE clients.id_company = ? AND clients.id_client = ?`,
        [idCompany, idClient]
      );
      // console.log("Client found!", resultClient);
      if (!resultClient.length) {
        req.flash("error", "Cliente no encontrado!");
        res.redirect(`/companies/${idCompany}/clients`);
      } else {
        res.render("clients/edit", {
          pageSelect: "clients",
          _client: resultClient[0],
          company: resultOwn[0],
        });
      }
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.updateClient = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idClient } = req.params;
    const dataClient = req.body;
    // console.log(dataClient);
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
      // CHECK CLIENT IN COMPANY EXIST
      const resultClient = await pool.query(
        `UPDATE clients SET tipoIdentificacion = ?, ruc = ?, razonSocial = ?, direccion = ?, telefono = ?, email = ?, element_by = ?
        WHERE id_client = ? AND id_company = ?`,
        [
          dataClient.tipoIdentificacion,
          dataClient.ruc,
          dataClient.razonSocial,
          dataClient.direccion,
          dataClient.telefono,
          dataClient.email,
          id_user,
          idClient,
          idCompany,
        ]
      );
      // console.log("Client update!", resultClient);
      if (!resultClient.length) {
        req.flash("error", "Error al actualizar!");
        res.redirect(`/companies/${idCompany}/clients`);
      } else {
        req.flash("success", "Cliente actualizado exitosamente!");
        res.redirect(`/companies/${idCompany}/clients`);
      }
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.deleteClient = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idClient } = req.params;
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
        `DELETE FROM clients WHERE id_company = ? AND id_client = ?`,
        [idCompany, idClient]
      );
      // console.log("Client delete!", result);
      req.flash("success", "Ha eliminado con éxito al cliente!");
      res.redirect(`/companies/${idCompany}/clients`);
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!" + error);
    res.redirect("/companies");
  }
};

module.exports.searchByID = async (req, res) => {
  const { idClient } = req.query;
  const { idCompany } = req.params;
  const id_user = req.session.id_user;
  let resp = null;

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
    // CHECK CLIENT IN COMPANY EXIST
    const [resultClient] = await pool.query(
      `SELECT clients.*
      FROM clients
      WHERE clients.id_company = ? AND clients.ruc = ?`,
      [idCompany, idClient]
    );
    // console.log("Client found!", resultClient);
    if (!resultClient.length) {
      res.send(resp);
    } else {
      resp = resultClient[0];
      res.send(resp);
    }
  }
};
