import express, { Express } from "express";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import routes from "./routes/index";

dotenv.config({ path: path.join(__dirname, "./.env") });
process.env.rootDir = __dirname;
const PORT = process.env.PORT;
const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", routes);

export const startServer = async (): Promise<ReturnType<
  Express["listen"]
> | null> => {
  try {
    console.log("\nTrying to connect to MongoDB...");
    await mongoose.connect(process.env.DB_CONNECT!);
    console.log("MongoDB connected successfully");
  } catch (exception: any) {
    console.error("Error", exception.message, "Stack", exception.stack);
    throw exception;
  }

  return app.listen(PORT, () => {
    console.log(`\nServer is listening on port: ${PORT} \n`);
  });
};

export const startServerInProd = (): void => {
  if (process.env.NODE_ENV !== "test") {
    startServer();
  }
};

startServerInProd();

export default app;
