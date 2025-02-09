import ConfigRequest from "../../types/config-request";
import { Request, Response } from "express";
import { Config } from "../../config";
import ClientConfiguration from "../../types/client-configuration";
import ResponseConfiguration from "../../types/response-configuration";
import { ErrorConfiguration } from "../../types/error-configuration";
import { isCoreIdentityError } from "../../validators/core-identity-error";
import { isIdTokenError } from "../../validators/id-token-error";
import { isAuthoriseError } from "../../validators/authorise-errors";
import { validationResult } from "express-validator";

export const configController = (
  req: Request<ConfigRequest>,
  res: Response
): void => {
  const config = Config.getInstance();
  const validationFailures = validationResult(req);
  if (!validationFailures.isEmpty()) {
    res.status(400).send({ errors: validationFailures.mapped() });
    return;
  }

  if (req.body.clientConfiguration !== undefined) {
    populateClientConfiguration(req.body.clientConfiguration);
  }
  if (
    req.body.responseConfiguration !== undefined &&
    req.body.responseConfiguration.sub !== undefined
  ) {
    const userIndex = config.getUserIndex(req.body.responseConfiguration.sub);
    populateResponseConfiguration(userIndex, req.body.responseConfiguration);
    populateErrorConfiguration(userIndex, req.body.errorConfiguration);
  }
  if (req.body.simulatorUrl !== undefined) {
    config.setSimulatorUrl(req.body.simulatorUrl);
  }

  res.status(200).send();
};

const populateClientConfiguration = (
  clientConfiguration: ClientConfiguration
) => {
  const config = Config.getInstance();

  if (clientConfiguration.clientId !== undefined) {
    config.setClientId(clientConfiguration.clientId);
  }
  if (clientConfiguration.publicKey !== undefined) {
    config.setPublicKey(clientConfiguration.publicKey);
  }
  if (clientConfiguration.scopes !== undefined) {
    config.setScopes(clientConfiguration.scopes);
  }
  if (clientConfiguration.redirectUrls !== undefined) {
    config.setRedirectUrls(clientConfiguration.redirectUrls);
  }
  if (clientConfiguration.claims !== undefined) {
    config.setClaims(clientConfiguration.claims);
  }
  if (clientConfiguration.identityVerificationSupported !== undefined) {
    config.setIdentityVerificationSupported(
      clientConfiguration.identityVerificationSupported
    );
  }
  if (clientConfiguration.idTokenSigningAlgorithm !== undefined) {
    config.setIdTokenSigningAlgorithm(
      clientConfiguration.idTokenSigningAlgorithm
    );
  }
  if (clientConfiguration.clientLoCs !== undefined) {
    config.setClientLoCs(clientConfiguration.clientLoCs);
  }
  if (clientConfiguration.postLogoutRedirectUrls !== undefined) {
    config.setPostLogoutRedirectUrls(
      clientConfiguration.postLogoutRedirectUrls
    );
  }
};

const populateResponseConfiguration = (
  userIndex: number,
  responseConfiguration: ResponseConfiguration
) => {
  const config = Config.getInstance();
  if (responseConfiguration.email !== undefined) {
    config.setEmail(userIndex, responseConfiguration.email);
  }
  if (responseConfiguration.emailVerified !== undefined) {
    config.setEmailVerified(userIndex, responseConfiguration.emailVerified);
  }
  if (responseConfiguration.phoneNumber !== undefined) {
    config.setPhoneNumber(userIndex, responseConfiguration.phoneNumber);
  }
  if (responseConfiguration.phoneNumberVerified !== undefined) {
    config.setPhoneNumberVerified(
      userIndex,
      responseConfiguration.phoneNumberVerified
    );
  }
  if (responseConfiguration.maxLoCAchieved !== undefined) {
    config.setMaxLoCAchieved(userIndex, responseConfiguration.maxLoCAchieved);
  }
  if (responseConfiguration.coreIdentityVerifiableCredentials !== undefined) {
    config.setVerifiableIdentityCredentials(
      userIndex,
      responseConfiguration.coreIdentityVerifiableCredentials
    );
  }
  if (responseConfiguration.passportDetails !== undefined) {
    config.setPassportDetails(userIndex, responseConfiguration.passportDetails);
  }
  if (responseConfiguration.drivingPermitDetails !== undefined) {
    config.setDrivingPermitDetails(
      userIndex,
      responseConfiguration.drivingPermitDetails
    );
  }
  if (responseConfiguration.postalAddressDetails !== undefined) {
    config.setPostalAddressDetails(
      userIndex,
      responseConfiguration.postalAddressDetails
    );
  }
  if (responseConfiguration.returnCodes !== undefined) {
    config.setReturnCodes(userIndex, responseConfiguration.returnCodes);
  }
};

const populateErrorConfiguration = (
  userIndex: number,
  errorConfiguration: Partial<ErrorConfiguration> | undefined
): void => {
  const config = Config.getInstance();

  if (!errorConfiguration) {
    config.setCoreIdentityErrors(userIndex, []);
    config.setIdTokenErrors(userIndex, []);
    config.setAuthoriseErrors(userIndex, []);
    return;
  }

  const coreIdentityErrors =
    errorConfiguration.coreIdentityErrors?.filter(isCoreIdentityError) ?? [];

  const idTokenErrors =
    errorConfiguration.idTokenErrors?.filter(isIdTokenError) ?? [];

  const authoriseErrors =
    errorConfiguration.authoriseErrors?.filter(isAuthoriseError) ?? [];

  config.setCoreIdentityErrors(userIndex, coreIdentityErrors);
  config.setIdTokenErrors(userIndex, idTokenErrors);
  config.setAuthoriseErrors(userIndex, authoriseErrors);
};
