import { Request, Response } from "express";
import { Config } from "../../config";

export const getConfigController = (req: Request, res: Response): void => {
  const config = Config.getInstance();
  const body = {
    clientConfiguration: config.getClientConfiguration(),
    userConfigurations: config.getUserConfigurations(),
    simulatorUrl: Config.getInstance().getSimulatorUrl(),
  };
  res.header("Content-Type", "application/json");
  res.status(200);
  res.send(body);
};
