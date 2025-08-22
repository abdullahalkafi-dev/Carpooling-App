import colors from "colors";
import mongoose from "mongoose";

// import seedSuperAdmin from './DB';
import http from "http";
import { errorLogger, logger } from "./shared/logger";
import { Server } from "socket.io";
import redisClient from "./util/redisClient";
import app from "./app";

import config from "./config";
import { setupSocket } from "./socket/socket";
import { initializeNotificationServices, cleanupNotificationServices } from "./config/notification.config";

//uncaught exception
process.on("uncaughtException", (error) => {
  errorLogger.error("UnhandledException Detected", error, error);
  process.exit(1);
});
export const server = http.createServer(app);

async function main() {
  try {
    // seedSuperAdmin();
    mongoose.connect(config.database_url as string);
    logger.info(colors.green("🚀 Database connected successfully"));

    const port =
      typeof config.port === "number" ? config.port : Number(config.port);
    console.log(port, "port");
    await redisClient.connect();
    
    // Initialize notification services
    await initializeNotificationServices();
    
    server.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(
          `♻️  Application listening ${config.ip_address} on port:${config.port}`
        )
      );
    });
    setupSocket(server);
  } catch (error) {
    console.log(error);
    errorLogger.error(colors.red("🤢 Failed to connect Database"));
  }
}

//handle unhandledRejection
process.on("unhandledRejection", (error) => {
  if (server) {
    server.close(() => {
      errorLogger.error("UnhandledRejection Detected", error, error);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

main();

// Only handle SIGTERM in production environments
// In development, ts-node-dev handles restarts via SIGTERM
if (process.env.NODE_ENV === 'production') {
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully...");
    if (server) {
      server.close(async () => {
        logger.info("HTTP server closed.");
        // Cleanup notification services
        cleanupNotificationServices();
        // Close DB or Redis connections
        await redisClient.disconnect();
        await mongoose.connection.close();
        process.exit(0);
      });
    }
  });
}
// import cluster from "cluster";
// import os from "os";
// import mongoose from "mongoose";
// import http from "http";
// import redisClient from "./util/redisClient";
// import app from "./app";
// import { logger } from "./shared/logger";
// import seedSuperAdmin from "./DB";
// import config from "./config";






// const numCPUs = os.cpus().length;

// if (cluster.isPrimary) {
//   logger.info(`Primary process ${process.pid} is running`);
//   logger.info(`Forking ${numCPUs} workers...`);

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     logger.error(`Worker ${worker.process.pid} died with code ${code} (${signal}). Restarting...`);
//     cluster.fork();
//   });

//   process.on("SIGINT", () => {
//     logger.info("SIGINT received, shutting down primary...");
//     process.exit(0);
//   });

//   process.on("SIGTERM", () => {
//     logger.info("SIGTERM received, shutting down primary...");
//     process.exit(0);
//   });
// } else {
//   // Worker process
//   process.on("uncaughtException", (err) => {
//     logger.error(`Uncaught exception (worker ${process.pid}):`, err);
//     process.exit(1);
//   });

//   process.on("unhandledRejection", (err) => {
//     logger.error(`Unhandled rejection (worker ${process.pid}):`, err);
//     process.exit(1);
//   });

//   const main = async () => {
//     const mongoUri = config.database_url as string;

//     if (!mongoUri) {
//       logger.error("MongoDB connection URI is not defined!");
//       process.exit(1);
//     }

//     // Connect MongoDB
//     await mongoose.connect(mongoUri);
//     logger.info(`MongoDB connected (worker ${process.pid})`);

//     // Connect Redis - new connection per worker
//     await redisClient.connect();
//     logger.info(`Redis connected (worker ${process.pid})`);


//     // Seed admin data
//     await seedSuperAdmin();

//     // Increase server timeout for long uploads (15 minutes)
//     const server = http.createServer(app);
//     server.setTimeout(15 * 60 * 1000);

//     const port = Number(config.port) || 3000;
//     const ip = config.ip_address || "0.0.0.0";

//     server.listen(port, ip, () => {
//       logger.info(`Worker ${process.pid} listening on ${ip}:${port} (HTTP)`);
//     });

//     // Graceful shutdown
//     const shutdown = async () => {
//       logger.info(`Worker ${process.pid} shutting down gracefully...`);
//       await redisClient.disconnect();
//       await mongoose.disconnect();
//       server.close(() => {
//         logger.info(`HTTP server closed (worker ${process.pid})`);
//         process.exit(0);
//       });
//     };

//     process.on("SIGINT", shutdown);
//     process.on("SIGTERM", shutdown);
//   };

//   main().catch((err) => {
//     logger.error(`Error starting server (worker ${process.pid}):`, err);
//     process.exit(1);
//   });
// }

