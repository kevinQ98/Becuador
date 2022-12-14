const { pool } = require("../config/db");

function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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
        `SELECT products.*, users.nombre AS byUser
        FROM products, users
        WHERE products.id_company = ? AND products.element_by = users.id_user`,
        [idCompany]
      );
      // console.log("Products of company", result);
      res.render("products/index", {
        pageSelect: "products",
        products: result,
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
      res.render(`products/new`, {
        pageSelect: "products",
        company: resultOwn[0],
      });
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.createProduct = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const id_user = req.session.id_user;
    const dataProduct = req.body;
    // console.log(dataProduct);
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
      // CHECK PRODUCT EXIST IN COMPANY
      const [resultOwn] = await pool.query(
        `SELECT * FROM products WHERE id_company = ? AND nombre = ?`,
        [idCompany, dataProduct.nombre]
      );
      // console.log("Product found in company!", resultOwn);

      if (resultOwn.length) {
        req.flash("error", "Producto ya registrado!");
        res.redirect(`/companies/${idCompany}/products`);
      } else {
        // GET RANDOM CODE TO ID
        let codigo = makeid(6);
        const [resultCodigos] = await pool.query(
          "SELECT codigo FROM products WHERE id_company = ?",
          [idCompany]
        );

        while (resultCodigos.indexOf(codigo) !== -1) {
          codigo = makeid(6);
        }

        const [result] = await pool.query(
          `INSERT INTO products SET codigo = ?, nombre = ?, precio = ?, stock = ?, descr = ?, ivaTarifa = ?, id_company = ?, element_by = ?`,
          [
            codigo,
            dataProduct.nombre,
            dataProduct.precio,
            dataProduct.stock || null,
            dataProduct.descr || null,
            "0",
            idCompany,
            id_user,
          ]
        );
        // console.log("Product created!", result);
        req.flash("success", "Producto creado exitosamente!");
        res.redirect(`/companies/${idCompany}/products`);
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
    const { idProd } = req.params;
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
      // CHECK PRODUCT IN COMPANY EXIST
      const [resultProduct] = await pool.query(
        `SELECT products.*
        FROM products
        WHERE products.id_company = ? AND products.id_product = ?`,
        [idCompany, idProd]
      );
      // console.log("Product found!", resultProduct);
      if (!resultProduct.length) {
        req.flash("error", "Producto no encontrado!");
        res.redirect(`/companies/${idCompany}/products`);
      } else {
        res.render("products/edit", {
          pageSelect: "products",
          product: resultProduct[0],
          company: resultOwn[0],
        });
      }
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.updateProduct = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idProd } = req.params;
    const dataProduct = req.body;
    // console.log(dataProduct);
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
      const resultProduct = await pool.query(
        `UPDATE products SET nombre = ?, precio = ?, stock = ?, descr = ?, element_by = ?
        WHERE id_product = ? AND id_company = ?`,
        [
          dataProduct.nombre,
          dataProduct.precio,
          dataProduct.stock || null,
          dataProduct.descr || null,
          id_user,
          idProd,
          idCompany,
        ]
      );
      // console.log("Product update!", resultProduct);
      if (!resultProduct.length) {
        req.flash("error", "Error al actualizar!");
        res.redirect(`/companies/${idCompany}/products`);
      } else {
        req.flash("success", "Producto actualizado exitosamente!");
        res.redirect(`/companies/${idCompany}/products`);
      }
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!");
    res.redirect("/companies");
  }
};

module.exports.deleteProduct = async (req, res) => {
  try {
    const { idCompany } = req.params;
    const { idProd } = req.params;
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
        `DELETE FROM products WHERE id_company = ? AND id_product = ?`,
        [idCompany, idProd]
      );
      // console.log("Product delete!", result);
      req.flash("success", "Ha eliminado con éxito el producto!");
      res.redirect(`/companies/${idCompany}/products`);
    }
  } catch (error) {
    req.flash("error", "Contacte con Becuador!" + error);
    res.redirect("/companies");
  }
};

module.exports.listProducts = async (req, res) => {
  const { nameProduct } = req.query;
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
    const [resultProducts] = await pool.query(
      `SELECT products.*
      FROM products
      WHERE products.id_company = ? AND products.nombre LIKE ?
      LIMIT 5`,
      [idCompany, "%" + nameProduct + "%"]
    );
    // console.log("Product List found!", resultProducts);
    if (!resultProducts.length) {
      res.send(resp);
    } else {
      // console.log(resultProducts);
      resp = resultProducts;
      res.send(resp);
    }
  }
};

module.exports.searchByName = async (req, res) => {
  const { nameProduct } = req.query;
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
    const [resultProduct] = await pool.query(
      `SELECT products.*
      FROM products
      WHERE products.id_company = ? AND products.nombre = ?`,
      [idCompany, nameProduct]
    );
    // console.log("Product found!", resultProduct);
    if (!resultProduct.length) {
      res.send(resp);
    } else {
      resp = resultProduct[0];
      res.send(resp);
    }
  }
};