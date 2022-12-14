const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");

// Controller
const products = require("../controllers/products");
// Middleware
const { isLoggedIn, isAdmin } = require("../middleware");

router
  .route("/")
  .get(isLoggedIn, isAdmin, catchAsync(products.renderIndex))
  .post(isLoggedIn, isAdmin, catchAsync(products.createProduct));

router.route("/new").get(isLoggedIn, isAdmin, catchAsync(products.renderNew));

router
  .route("/listProducts")
  .get(isLoggedIn, catchAsync(products.listProducts));

router
  .route("/searchProdByName")
  .get(isLoggedIn, catchAsync(products.searchByName));

router
  .route("/:idProd")
  .put(isLoggedIn, isAdmin, catchAsync(products.updateProduct))
  .delete(isLoggedIn, isAdmin, catchAsync(products.deleteProduct));

router
  .route("/:idProd/edit")
  .get(isLoggedIn, isAdmin, catchAsync(products.renderEdit));

module.exports = router;
