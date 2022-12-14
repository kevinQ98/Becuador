const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");

// Controller
const invoices = require("../controllers/invoices");
// Middleware
const { isLoggedIn, isAdmin } = require("../middleware");

router
  .route("/")
  .get(isLoggedIn, isAdmin, catchAsync(invoices.renderIndex))
  .post(isLoggedIn, isAdmin, catchAsync(invoices.createInvoice));

router.route("/new").get(isLoggedIn, isAdmin, catchAsync(invoices.renderNew));

router
  .route("/:idInvoice")
  .post(isLoggedIn, isAdmin, catchAsync(invoices.updateInvoice))
  .delete(isLoggedIn, isAdmin, catchAsync(invoices.deleteInvoice));

router
  .route("/:idInvoice/view")
  .get(isLoggedIn, isAdmin, catchAsync(invoices.renderView));

module.exports = router;
