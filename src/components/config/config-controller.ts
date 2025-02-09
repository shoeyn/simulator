import ConfigRequest from "../../types/config-request";
import { Request, Response } from "express";
import { Config, UserConfiguration } from "../../config";
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
    const userConfig = Config.getUserConfiguration(
      req.body.responseConfiguration.sub
    );
    populateResponseConfiguration(userConfig, req.body.responseConfiguration);
    populateErrorConfiguration(userConfig, req.body.errorConfiguration);
  }
  if (req.body.simulatorUrl !== undefined) {
    Config.getInstance().setSimulatorUrl(req.body.simulatorUrl);
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
  userConfig: UserConfiguration,
  responseConfiguration: ResponseConfiguration
) => {
  const config = Config.getInstance();
  if (responseConfiguration.email !== undefined) {
    config.setEmail(userConfig, responseConfiguration.email);
  }
  if (responseConfiguration.emailVerified !== undefined) {
    config.setEmailVerified(userConfig, responseConfiguration.emailVerified);
  }
  if (responseConfiguration.phoneNumber !== undefined) {
    config.setPhoneNumber(userConfig, responseConfiguration.phoneNumber);
  }
  if (responseConfiguration.phoneNumberVerified !== undefined) {
    config.setPhoneNumberVerified(
      userConfig,
      responseConfiguration.phoneNumberVerified
    );
  }
  if (responseConfiguration.maxLoCAchieved !== undefined) {
    config.setMaxLoCAchieved(userConfig, responseConfiguration.maxLoCAchieved);
  }
  if (responseConfiguration.coreIdentityVerifiableCredentials !== undefined) {
    config.setVerifiableIdentityCredentials(
      userConfig,
      responseConfiguration.coreIdentityVerifiableCredentials
    );
  }
  if (responseConfiguration.passportDetails !== undefined) {
    config.setPassportDetails(
      userConfig,
      responseConfiguration.passportDetails
    );
  }
  if (responseConfiguration.drivingPermitDetails !== undefined) {
    config.setDrivingPermitDetails(
      userConfig,
      responseConfiguration.drivingPermitDetails
    );
  }
  if (responseConfiguration.socialSecurityRecordDetails !== undefined) {
    config.setSocialSecurityRecordDetails(
      userConfig,
      responseConfiguration.socialSecurityRecordDetails
    );
  }
  if (responseConfiguration.postalAddressDetails !== undefined) {
    config.setPostalAddressDetails(
      userConfig,
      responseConfiguration.postalAddressDetails
    );
  }
  if (responseConfiguration.returnCodes !== undefined) {
    config.setReturnCodes(userConfig, responseConfiguration.returnCodes);
  }
};

const populateErrorConfiguration = (
  userConfig: UserConfiguration,
  errorConfiguration: Partial<ErrorConfiguration> | undefined
): void => {
  const config = Config.getInstance();

  if (!errorConfiguration) {
    config.setCoreIdentityErrors(userConfig, []);
    config.setIdTokenErrors(userConfig, []);
    config.setAuthoriseErrors(userConfig, []);
    return;
  }

  const coreIdentityErrors =
    errorConfiguration.coreIdentityErrors?.filter(isCoreIdentityError) ?? [];

  const idTokenErrors =
    errorConfiguration.idTokenErrors?.filter(isIdTokenError) ?? [];

  const authoriseErrors =
    errorConfiguration.authoriseErrors?.filter(isAuthoriseError) ?? [];

  config.setCoreIdentityErrors(userConfig, coreIdentityErrors);
  config.setIdTokenErrors(userConfig, idTokenErrors);
  config.setAuthoriseErrors(userConfig, authoriseErrors);
};
