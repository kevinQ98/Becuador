const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");

// Controller
const sellers = require("../controllers/sellers");
// Middleware
const { isLoggedIn, isAdmin } = require("../middleware");

router
  .route("/")
  .get(isLoggedIn, isAdmin, catchAsync(sellers.renderIndex))
  .post(isLoggedIn, isAdmin, catchAsync(sellers.createSeller));

router.route("/new").get(isLoggedIn, isAdmin, catchAsync(sellers.renderNew));

router
  .route("/:idSeller")
  .delete(isLoggedIn, isAdmin, catchAsync(sellers.deleteSeller));

// router
//   .route("/:idCompany/edit")
//   .get(isLoggedIn, catchAsync(companies.renderEdit));

module.exports = router;
