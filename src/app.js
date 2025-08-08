const Koa = require("koa");
const cors = require("koa-cors");
const bodyParser = require("koa-bodyparser");
const helmet = require("koa-helmet");
const static = require("koa-static");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/user");
const uploadRoutes = require("./routes/upload");
const app = new Koa();

app.use(helmet());
app.use(cors());
app.use(bodyParser());
app.use(static(path.join(__dirname, "../public")));
app.use(errorHandler);

app.use(uploadRoutes.routes());
app.use(uploadRoutes.allowedMethods());
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

module.exports = app;
