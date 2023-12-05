const express = require("express");
const { default: router } = require("./routes/index");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use("/", router);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
