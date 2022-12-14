const { pool } = require("../config/db");
var builder = require("xmlbuilder");
const fs = require("fs");

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
        `SELECT invoices.*, users.nombre AS byUser, left(clients.razonSocial, 20) AS cliente, DATE_FORMAT(invoices.fecha, '%Y-%m-%d') AS nuevoss
        FROM invoices, users, clients
        WHERE invoices.id_company = ? AND invoices.id_user = users.id_user AND invoices.id_client = clients.id_client
        ORDER BY invoices.element_created DESC`,
        [idCompany]
      );
      // console.log("Invoices of company", result);
      res.render("invoices/index", {
        pageSelect: "invoices",
        invoices: result,
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
      // GET NUMFACT LAST
      const [resultLastNumFact] = await pool.query(
        `SELECT numFactura
        FROM invoices
        WHERE invoices.id_company = ?
        ORDER BY element_created DESC 
        LIMIT 1`,
        [idCompany]
      );
      // console.log("Last numFact Company!", resultLastNumFact);
      let lastNumFact;
      if (!resultLastNumFact.length) {
        lastNumFact = "000000001";
      } else {
        newNumFact = parseInt(resultLastNumFact[0].numFactura) + 1;
        // console.log(newNumFact);
        lastNumFact = "000000000" + newNumFact;
        lastNumFact = lastNumFact.slice(-9);
      }
      // console.log("NUM TO NEW FACT", lastNumFact);
      // RENDER NEW INVOICE
      res.render(`invoices/new`, {
        pageSelect: "invoices",
        secuencial: lastNumFact,
        company: resultOwn[0],
      });
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.createInvoice = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const id_user = req.session.id_user;
    // INFO INVOICE
    const {
      secuencial,
      ruc_Client,
      productsCodigos,
      productsQty,
      productsPrecios,
      formaPago,
      estadoSri,
      estadoFactura,
      comentario,
      subtotal,
      ivaTarifa,
      total,
    } = req.body;
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_user]
    );
    // console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.status(400).send("/companies");
    } else {
      // CREATE INVOICE
      const [result] = await pool.query(
        `INSERT INTO invoices SET numFactura = ?, fecha = ?, ivaTarifa = ?, subtotal = ?, total = ?, formaPago = ?, estado = ?, estadoSri = ?,
        id_client = (
          SELECT clients.id_client
          FROM clients
          WHERE clients.ruc = ? AND clients.id_company = ?
        ), id_user = ?, id_company = ?, comentario = ?`,
        [
          secuencial,
          new Date(),
          ivaTarifa,
          subtotal,
          total,
          formaPago,
          estadoFactura,
          estadoSri,
          ruc_Client,
          idCompany,
          id_user,
          idCompany,
          comentario,
        ]
      );
      // console.log("Invoice created!", result);
      // CREATE DETAIL
      let arrayproductsCodigos = JSON.parse(productsCodigos);
      let arrayproductsQty = JSON.parse(productsQty);
      let arrayproductsPrecios = JSON.parse(productsPrecios);

      for (var i = 0; i < arrayproductsCodigos.length; i++) {
        let [resultDetail] = await pool.query(
          `INSERT INTO details SET cantidad = ?, precio = ?, id_invoice = ?,
          id_product = (
            SELECT products.id_product
            FROM products
            WHERE products.codigo = ? AND products.id_company = ?
          ), id_company = ?`,
          [
            arrayproductsQty[i],
            arrayproductsPrecios[i],
            result["insertId"],
            arrayproductsCodigos[i],
            idCompany,
            idCompany,
          ]
        );
        // console.log("Invoice Detail created!", resultDetail);
      }

      // XML
      if (estadoSri === "1") {
        // createXML(idCompany, result["insertId"]);
      }
      // TO SEND SUCCESS
      req.flash("success", "Factura registrada con exito!");
      res.send(`/companies/${idCompany}/invoices`);
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports.updateInvoice = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idInvoice } = req.params;
    const id_user = req.session.id_user;
    // INFO INVOICE
    const { estadoFactura, comentario } = req.body;
    // CHECK OWNER AND COMPANY EXIST
    const [resultOwn] = await pool.query(
      `SELECT * FROM companies WHERE id_company = ? AND id_user = ?`,
      [idCompany, id_user]
    );
    // console.log("Company found owner!", resultOwn);

    if (!resultOwn.length) {
      req.flash("error", "Empresa no encontrada!");
      res.status(400).send("/companies");
    } else {
      // UPDATE INVOICE
      const result = await pool.query(
        `UPDATE invoices SET estado = ?, comentario = ?
        WHERE id_invoice = ? AND id_company = ?`,
        [estadoFactura, comentario, idInvoice, idCompany]
      );
      // console.log("Invoice updated!", result);
      if (!result.length) {
        // TO SEND ERROR
        req.flash("error", "Factura no actualizada, contacte con Becuador!");
        res.send(`/companies/${idCompany}/invoices`);
      } else {
        // TO SEND SUCCESS
        req.flash("success", "Factura actualizada con exito!");
        res.send(`/companies/${idCompany}/invoices`);
      }
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports.deleteInvoice = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idInvoice } = req.params;
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
        `UPDATE invoices SET estado = ?
        WHERE id_invoice = ? AND id_company = ?`,
        ["0", idInvoice, idCompany]
      );
      // console.log("Invoice delete anulado!", result);
      req.flash("success", "Factura anulada con exito!");
      res.redirect(`/companies/${idCompany}/invoices`);
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!" + error);
    res.redirect("/companies");
  }
};

module.exports.renderView = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idInvoice } = req.params;
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
      // GET INFO FACT
      let objResultInvoice = [];
      const [resultInvoice] = await pool.query(
        `SELECT invoices.*, DATE_FORMAT(invoices.fecha, '%Y-%m-%d') AS nuevoss
        FROM invoices
        WHERE invoices.id_invoice = ? AND invoices.id_company = ?`,
        [idInvoice, idCompany]
      );
      // console.log("Invoice found!", resultInvoice[0]);
      if (!resultInvoice.length) {
        req.flash("error", "Factura no encontrada!");
        res.redirect(`/companies/${idCompany}/invoices`);
      } else {
        const [resultClientInv] = await pool.query(
          `SELECT clients.razonSocial, clients.direccion, clients.ruc, clients.telefono, clients.email
           FROM invoices, clients
           WHERE invoices.id_invoice = ? AND invoices.id_company = ? AND invoices.id_client = clients.id_client`,
          [idInvoice, idCompany]
        );
        // console.log("Invoice Client found!", resultClientInv[0]);
        const [resultProductDetail] = await pool.query(
          `SELECT products.codigo, products.nombre, details.cantidad, details.precio
           FROM invoices, products, details
           WHERE invoices.id_invoice = ? AND invoices.id_company = ? AND 
           invoices.id_invoice = details.id_invoice AND details.id_product = products.id_product`,
          [idInvoice, idCompany]
        );
        // console.log("Invoice detail found!", resultProductDetail);

        // RENDER NEW INVOICE
        res.render(`invoices/view`, {
          pageSelect: "invoices",
          invoice: resultInvoice[0],
          cliente: resultClientInv[0],
          details: resultProductDetail,
          company: resultOwn[0],
        });
      }
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

const createXML = async (idCompany, idInvoice) => {
  // GET COMPANY INFO
  const [resultCompany] = await pool.query(
    `SELECT *
    FROM companies
    WHERE id_company = ?`,
    [idCompany]
  );
  // console.log("Company found!", resultCompany[0]);
  // GET INVOICE INFO
  const [resultInvoice] = await pool.query(
    `SELECT invoices.*, DATE_FORMAT(invoices.fecha, '%d/%m/%Y') AS nuevoss
    FROM invoices
    WHERE invoices.id_invoice = ? AND invoices.id_company = ?`,
    [idInvoice, idCompany]
  );
  // console.log("Invoice found!", resultInvoice[0]);
  // GET CLIENT INFO
  const [resultClientInv] = await pool.query(
    `SELECT clients.*
     FROM invoices, clients
     WHERE invoices.id_invoice = ? AND invoices.id_company = ? AND invoices.id_client = clients.id_client`,
    [idInvoice, idCompany]
  );
  // console.log("Invoice Client found!", resultClientInv[0]);
  // GET DETAIL INFO
  const [resultProductDetail] = await pool.query(
    `SELECT products.codigo, products.nombre, details.cantidad, details.precio
     FROM invoices, products, details
     WHERE invoices.id_invoice = ? AND invoices.id_company = ? AND 
     invoices.id_invoice = details.id_invoice AND details.id_product = products.id_product`,
    [idInvoice, idCompany]
  );
  // console.log("Invoice detail found!", resultProductDetail);
  // console.log("HERE ***********");
  // console.log(resultProductDetail.length);
  // console.log(resultProductDetail[0]);

  var feed = builder
    .create("factura", { encoding: "utf-8" })
    .att("id", "comprobante")
    .att("version", "1.0.0")
    .ele("infoTributaria")
    .ele("ambiente", `${resultCompany[0].tipoAmbiente}`)
    .up()
    .ele("tipoEmision", "1")
    .up()
    .ele("razonSocial", `${resultCompany[0].razonSocial}`)
    .up()
    .ele("ruc", `${resultCompany[0].ruc}`)
    .up()
    .ele("claveAcceso", "2110201101179214673900110020010000000011234567813")
    .up()
    .ele("codDoc", "01")
    .up()
    .ele("estab", `${resultCompany[0].codEstablecimiento}`)
    .up()
    .ele("ptoEmi", `${resultCompany[0].codPuntoEmision}`)
    .up()
    .ele("dirMatriz", `${resultCompany[0].dirMatriz}`)
    .up()
    .up() //END INFOTributaria
    .ele("infoFactura")
    .ele("fechaEmision", `${resultInvoice[0].nuevoss}`)
    .up()
    .ele("tipoIdentificacionComprador", "04")
    .up()
    .ele("razonSocialComprador", `${resultClientInv[0].razonSocial}`)
    .up()
    .ele("identificacionComprador", `${resultClientInv[0].ruc}`)
    .up()
    .ele("totalSinImpuestos", `${resultInvoice[0].subtotal}`)
    .up()
    .ele("totalDescuento", "0.00")
    .up()
    .ele("totalConImpuestos")
    .ele("totalImpuesto")
    .ele("codigo", "2")
    .up()
    .ele("codigoPorcentaje", `${resultInvoice[0].ivaTarifa}`)
    .up()
    .ele("baseImponible", `${resultInvoice[0].subtotal}`)
    .up()
    .ele("valor", "0.00")
    .up()
    .up() //END TOTALIMPUESTO
    .up() //END TOTALCONIMPUESTOS
    .ele("propina", "0.00")
    .up()
    .ele("importeTotal", `${resultInvoice[0].total}`)
    .up()
    .ele("modena", "DOLAR")
    .up()
    .ele("pagos")
    .ele("pago")
    .ele("formaPago", `${resultInvoice[0].formaPago}`)
    .up()
    .ele("total", `${resultInvoice[0].total}`)
    .up()
    .up() //END PAGO
    .up() //END PAGOS
    .up() //END INFOFactura
    .ele("detalles");

  for (let index = 0; index < resultProductDetail.length; index++) {
    feed
      .ele("detalle")
      .ele("codigoPrincipal", `${resultProductDetail[index].codigo}`)
      .up()
      .ele("descripcion", `${resultProductDetail[index].nombre}`)
      .up()
      .ele("cantidad", `${resultProductDetail[index].cantidad}`)
      .up()
      .ele("precioUnitario", `${resultProductDetail[index].precio}`)
      .up()
      .ele("descuento", "0.00")
      .up()
      .ele("precioTotalSinImpuesto", `${resultProductDetail[index].precio}`)
      .up()
      .ele("impuestos")
      .ele("impuesto")
      .ele("codigo", "2")
      .up()
      .ele("codigoPorcentaje", "0")
      .up()
      .ele("tarifa", "12")
      .up()
      .ele("baseImponible", `${resultProductDetail[index].precio}`)
      .up()
      .ele("valor", "0.00")
      .up()
      .up()
      .up()
      .up(); //END DETALLE
  }
  feed
    .up() //END DETALLES

    .ele("infoAdicional")
    .ele("campoAdicional", `${resultClientInv[0].email}`)
    .att("nombre", "EMAIL")
    .up()
    .up();

  const xml_generate = feed.end({ pretty: true });
  // console.log(xml_generate);
  try {
    fs.writeFileSync("./creates/new2.txt", xml_generate);
    // console.log("NEW FILE CREATED!");
  } catch (error) {
    // console.log("Error: " + error);
  }
};
