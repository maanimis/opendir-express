const express = require("express");
const fs = require("fs").promises;
const os = require("os");
const path = require("path");
const yargs = require("yargs");

// Get the local IP address
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
  return "127.0.0.1";
};

const localIp = getLocalIpAddress();

const argv = yargs
  .option("port", {
    alias: "p",
    type: "number",
    description: "Port to run the server on",
    default: 3000,
  })
  .option("ip_addr", {
    alias: "ip",
    describe: "IP address",
    type: "string",
    default: localIp,
  })
  .help()
  .alias("help", "h").argv;

const app = express();
const port = argv.port;
const ip = argv.ip;
const publicPath = path.join(__dirname, "public");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicPath));

app.get("/directory/*", async (req, res) => {
  const dirPath = path.join(__dirname, req.params[0]);

  try {
    const stats = await fs.stat(dirPath);

    if (stats.isDirectory()) {
      const files = await fs.readdir(dirPath);
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const fileStats = await fs.stat(filePath);
          return {
            name: file,
            isDirectory: fileStats.isDirectory(),
            size: fileStats.size,
          };
        })
      );

      res.json({
        path: path.relative(__dirname, dirPath) || "/",
        files: fileDetails,
      });
    } else {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(dirPath)}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");
      res.download(dirPath, (err) => {
        if (err) {
          res
            .status(500)
            .json({ error: "Error downloading file: " + err.message });
        }
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Unable to access requested path: " + err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, ip, () => {
  console.log(`Server is running at http://${ip}:${port}`);
  console.log(`Serving files from ${ip}`);
});
