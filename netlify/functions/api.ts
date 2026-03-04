import serverless from "serverless-http";
import { createServer } from "../../server/index";

const app = createServer();
export const handler = serverless(app);
