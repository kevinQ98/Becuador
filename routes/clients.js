const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");

// Controller
const clients = require("../controllers/clients");
// Middleware
const { isLoggedIn, isAdmin } = require("../middleware");

router
  .route("/")
  .get(isLoggedIn, isAdmin, catchAsync(clients.renderIndex))
  .post(isLoggedIn, isAdmin, catchAsync(clients.createClient));

router.route("/new").get(isLoggedIn, isAdmin, catchAsync(clients.renderNew));

router
  .route("/:idClient")
  .put(isLoggedIn, isAdmin, catchAsync(clients.updateClient))
  .delete(isLoggedIn, isAdmin, catchAsync(clients.deleteClient));

router
  .route("/searchID")
  .get(isLoggedIn, isAdmin, catchAsync(clients.searchByID));

router
  .route("/:idClient/edit")
  .get(isLoggedIn, isAdmin, catchAsync(clients.renderEdit));

module.exports = router;
