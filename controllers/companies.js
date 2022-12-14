const { pool } = require("../config/db");

module.exports.renderIndex = async (req, res) => {
  const id_user = req.session.id_user;
  try {
    const [result] = await pool.query(
      `SELECT companies.* FROM companies WHERE companies.id_user = ?`,
      [id_user]
    );
    // console.log("Companies of user", result);
    // console.log(result[0].ruc);
    res.render("companies/index", {
      pageSelect: "companies",
      companies: result,
      nombre: req.session.nombre,
    });
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/help");
  }
};

module.exports.renderNew = async (req, res) => {
  res.render("companies/new", { pageSelect: "companies" });
};

module.exports.createCompany = async (req, res) => {
  const company = req.body;
  const id_User = req.session.id_user;
  try {
    const [result] = await pool.query(
      `INSERT INTO companies SET ruc = ?, razonSocial = ?, dirMatriz = ?, codEstablecimiento = ?, codPuntoEmision = ?, tipoAmbiente = ?, id_user = ?`,
      [
        company.ruc,
        company.razonSocial,
        company.dirMatriz,
        company.codEstablecimiento,
        company.codPuntoEmision,
        company.tipoAmbiente,
        id_User,
      ]
    );
    //console.log("Company created!", result);
    req.flash("success", "Ha creado con éxito una nueva empresa!");
    res.redirect("/companies");
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.renderEdit = async (req, res) => {
  const { idCompany } = req.params;
  const id_User = req.session.id_user;

  try {
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_User]
    );
    //console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      res.render("companies/edit", {
        pageSelect: "companies",
        company: resultOwn[0],
      });
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.renderDashboard = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const id_User = req.session.id_user;
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_User]
    );
    // console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      // GET INFO COMPANY
      const [resultDaily] = await pool.query(
        `SELECT COUNT(id_invoice) AS NumInvDaily, SUM(total) as TotalDaily
        FROM invoices 
        WHERE id_company = ? AND fecha = curdate()`,
        [idCompany]
      );
      // console.log("Company found daily!", resultDaily);
      const [resultInvXC] = await pool.query(
        `SELECT COUNT(id_invoice) AS NumInv
        FROM invoices 
        WHERE id_company = ? AND estado = '2'`,
        [idCompany]
      );
      // console.log("Company found xCobrar!", resultInvXC);
      const [resultInvXSend] = await pool.query(
        `SELECT COUNT(id_invoice) AS NumInv
        FROM invoices 
        WHERE id_company = ? AND estadoSri = '2'`,
        [idCompany]
      );
      //console.log("Company found xSendSri!", resultInvXSend);
      const [resultFactDaily] = await pool.query(
        `SELECT invoices.numFactura, invoices.total, left(clients.razonSocial, 20) AS cliente
        FROM invoices, clients
        WHERE invoices.id_company = ? AND invoices.fecha = curdate() AND invoices.id_client = clients.id_client
        LIMIT 5`,
        [idCompany]
      );
      //console.log("Company found invoices daily!", resultFactDaily);
      const [resultTotallAll] = await pool.query(
        `SELECT SUM(invoices.total) as TotalAll
        FROM invoices
        WHERE invoices.id_company = ?`,
        [idCompany]
      );
      // console.log("Company Total All Sales!", resultTotallAll);
      const [resultDatesInv] = await pool.query(
        `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS Fecha
        FROM invoices
        WHERE (fecha > now() - interval 15 day) AND id_company = ?
        group by fecha`,
        [idCompany]
      );
      //console.log("Company Total All DATES!", resultDatesInv);
      let arrayDatesInvoices = [];
      for (let index = 0; index < resultDatesInv.length; index++) {
        arrayDatesInvoices.push(resultDatesInv[index].Fecha);
      }
      // console.log(arrayDatesInvoices);
      const [resultTotalsInv] = await pool.query(
        `SELECT SUM(total) as TotalAll
        FROM invoices
        WHERE (fecha > now() - interval 15 day) AND id_company = ?
        group by fecha`,
        [idCompany]
      );
      //console.log("Company Total All Sales!", resultTotalsInv);
      let arrayValuesInvoices = [];
      for (let index = 0; index < resultTotalsInv.length; index++) {
        arrayValuesInvoices.push(resultTotalsInv[index].TotalAll);
      }
      // console.log(arrayValuesInvoices);
      res.render("dashboard/index", {
        pageSelect: "dashboard",
        company: resultOwn[0],
        daily: resultDaily[0],
        toPay: resultInvXC[0],
        toSend: resultInvXSend[0],
        invDaily: resultFactDaily,
        totalAll: resultTotallAll[0],
        chartLabel: arrayDatesInvoices,
        chartValues: arrayValuesInvoices,
      });
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.updateCompany = async (req, res) => {
  const { idCompany } = req.params;
  const company = req.body;
  const id_User = req.session.id_user;
  try {
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_User]
    );
    // console.log("Company found owner!", resultOwn);
    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      const [result] = await pool.query(
        `UPDATE companies SET ruc = ?, razonSocial = ?, dirMatriz = ?, codEstablecimiento = ?, codPuntoEmision = ?, tipoAmbiente = ?
        WHERE id_user = ? AND id_company = ?`,
        [
          company.ruc,
          company.razonSocial,
          company.dirMatriz,
          company.codEstablecimiento,
          company.codPuntoEmision,
          company.tipoAmbiente,
          id_User,
          idCompany,
        ]
      );
      // console.log("Company update!", result);
      req.flash("success", "Ha actualizado con éxito la empresa!");
      res.redirect("/companies");
    }
  } catch (error) {
    // console.log("Error", error);
    req.flash("error", "Error al actualizar la empresa!");
    res.redirect("/companies");
  }
};

module.exports.deleteCompany = async (req, res) => {
  const { idCompany } = req.params;
  const id_User = req.session.id_user;
  try {
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_User]
    );
    // console.log("Company found owner!", resultOwn);
    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.redirect("/companies");
    } else {
      const [result] = await pool.query(
        `DELETE FROM companies WHERE id_user = ? AND id_company = ?`,
        [id_User, idCompany]
      );
      // console.log("Company delete!", result);
      req.flash("success", "Ha eliminado con éxito la empresa!");
      res.redirect("/companies");
    }
  } catch (error) {
    req.flash("error", "Error al eliminar la empresa!");
    res.redirect("/companies");
  }
};
