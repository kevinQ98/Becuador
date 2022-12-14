const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");

// Controller
const companies = require("../controllers/companies");
// Middleware
const { isLoggedIn, isAdmin } = require("../middleware");

router
  .route("/")
  .get(isLoggedIn, isAdmin, catchAsync(companies.renderIndex))
  .post(isLoggedIn, isAdmin, catchAsync(companies.createCompany));

router.route("/new").get(isLoggedIn, isAdmin, catchAsync(companies.renderNew));

router
  .route("/:idCompany")
  .put(isLoggedIn, isAdmin, catchAsync(companies.updateCompany))
  .delete(isLoggedIn, isAdmin, catchAsync(companies.deleteCompany));

router
  .route("/:idCompany/edit")
  .get(isLoggedIn, isAdmin, catchAsync(companies.renderEdit));

router
  .route("/:idCompany/dashboard")
  .get(isLoggedIn, catchAsync(companies.renderDashboard));

module.exports = router;
