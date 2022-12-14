const express = require("express");
const { pool } = require("./config/db");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const { PORT } = require("./config/config");
// Middleware
const { isLoggedIn } = require("./middleware");
// ROUTES
const userRoutes = require("./routes/users");
const companyRoutes = require("./routes/companies");
const sellerRoutes = require("./routes/sellers");
const clientRoutes = require("./routes/clients");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/public"));

const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 1,
    maxAge: 1000 * 60 * 60 * 24 * 1,
  },
};
app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
  // console.log(req.session);
  // res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// ROUTE USER
app.use("/", userRoutes);
// ROUTE COMPANY
app.use("/companies", companyRoutes);
// ROUTE SELLERS
app.use("/companies/:idCompany/sellers", sellerRoutes);
// ROUTE CLIENTS
app.use("/companies/:idCompany/clients", clientRoutes);
// ROUTE PRODUCTS
app.use("/companies/:idCompany/products", productRoutes);
// ROUTE INVOICES
app.use("/companies/:idCompany/invoices", invoiceRoutes);

app.get("/", isLoggedIn, (req, res) => {
  res.redirect("/login");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Error :( !";
  res.status(statusCode).render("error", { err, pageSelect: "companies" });
});

app.listen(PORT);

console.log("Server port: 5000");
