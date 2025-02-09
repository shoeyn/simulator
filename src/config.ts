import {
  AccessTokenStore,
  AccessTokenStoreKey,
} from "./types/access-token-store";
import AuthRequestParameters from "./types/auth-request-parameters";
import ClientConfiguration from "./types/client-configuration";
import ResponseConfiguration from "./types/response-configuration";
import { ErrorConfiguration } from "./types/error-configuration";
import { isCoreIdentityError } from "./validators/core-identity-error";
import { isIdTokenError } from "./validators/id-token-error";
import { CoreIdentityError } from "./types/core-identity-error";
import { IdTokenError } from "./types/id-token-error";
import { isAuthoriseError } from "./validators/authorise-errors";
import { AuthoriseError } from "./types/authorise-errors";
import ReturnCode from "./types/return-code";
import { UserIdentityClaim } from "./types/user-info";

export type UserConfiguration = {
  error: ErrorConfiguration;
  response: ResponseConfiguration;
};

export class Config {
  private static instance: Config;

  private userConfigurations: UserConfiguration[] = [];
  private clientConfiguration: ClientConfiguration;
  private authCodeRequestParamsStore: Record<string, AuthRequestParameters>;
  private accessTokenStore: AccessTokenStore;

  private simulatorUrl: string;

  private constructor() {
    const defaultPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmXXR3EsRvUMVhEJMtQ1w
exJjfQ00Q0MQ7ARfShN53BnOQEPFnS/I8ntBddkKdE3q+vMTI72w6Fv3SsMM+ciR
2LIHdEQfKgsLt6PGNcV1kG6GG/3nSW3psW8w65Q3fmy81P1748qezDrVfaGrF4PD
XALzX1ph+nz8mpKmck6aY6LEUJ4B+TIfYzlKmmwFe3ri0spSW+J5wE9mmT3VkR2y
SuHRYHQlxlF9dfX7ltOTsbgJFzN6TO01ZQDhY0iLwzdGwhSxO6R6N/ZINYHCKFPa
QD+tdKsrw7QDIYnx0IiXFnkGnizl3UtqSmXAaceTvPM2Pz84x2JiwHrp2Sml6RYL
CQIDAQAB
-----END PUBLIC KEY-----
`;

    this.clientConfiguration = {
      clientId: process.env.CLIENT_ID ?? "HGIOgho9HIRhgoepdIOPFdIUWgewi0jw",
      publicKey: process.env.PUBLIC_KEY ?? defaultPublicKey,
      scopes: process.env.SCOPES
        ? process.env.SCOPES.split(",")
        : ["openid", "email", "phone"],
      redirectUrls: process.env.REDIRECT_URLS
        ? process.env.REDIRECT_URLS.split(",")
        : ["http://localhost:8080/oidc/authorization-code/callback"],
      postLogoutRedirectUrls: process.env.POST_LOGOUT_REDIRECT_URLS
        ? process.env.POST_LOGOUT_REDIRECT_URLS.split(",")
        : ["http://localhost:8080/signed-out"],
      claims: process.env.CLAIMS
        ? (process.env.CLAIMS.split(",") as UserIdentityClaim[])
        : [
            "https://vocab.account.gov.uk/v1/coreIdentityJWT",
            "https://vocab.account.gov.uk/v1/address",
            "https://vocab.account.gov.uk/v1/returnCode",
          ],
      identityVerificationSupported:
        process.env.IDENTITY_VERIFICATION_SUPPORTED !== "false",
      idTokenSigningAlgorithm:
        process.env.ID_TOKEN_SIGNING_ALGORITHM ?? "ES256",
      clientLoCs: process.env.CLIENT_LOCS
        ? process.env.CLIENT_LOCS.split(",")
        : ["P0", "P2"],
    };

    const userConfiguration = Config.newUserConfig();

    this.userConfigurations.push(userConfiguration);

    this.authCodeRequestParamsStore = {};
    this.accessTokenStore = {};

    this.simulatorUrl = process.env.SIMULATOR_URL ?? "http://localhost:3000";
  }

  public static newUserConfig(): UserConfiguration {
    return {
      response: {
        sub:
          process.env.SUB ??
          "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
        email: process.env.EMAIL ?? "test@example.com",
        emailVerified: process.env.EMAIL_VERIFIED !== "false",
        phoneNumber: process.env.PHONE_NUMBER ?? "07123456789",
        phoneNumberVerified: process.env.PHONE_NUMBER_VERIFIED !== "false",
        maxLoCAchieved: "P2",
        coreIdentityVerifiableCredentials: {
          type: ["VerifiableCredential", "IdentityCheckCredential"],
          credentialSubject: {
            name: [
              {
                nameParts: [
                  {
                    value: "GEOFFREY",
                    type: "GivenName",
                  },
                  {
                    value: "HEARNSHAW",
                    type: "FamilyName",
                  },
                ],
              },
            ],
            birthDate: [
              {
                value: "1955-04-19",
              },
            ],
          },
        },
        passportDetails: null,
        drivingPermitDetails: null,
        socialSecurityRecordDetails: null,
        postalAddressDetails: [
          {
            addressCountry: "GB",
            buildingName: "",
            streetName: "FRAMPTON ROAD",
            postalCode: "GL1 5QB",
            buildingNumber: "26",
            addressLocality: "GLOUCESTER",
            validFrom: "2000-01-01",
            uprn: 100120472196,
            subBuildingName: "",
          },
        ],
        returnCodes: [],
      },
      error: {
        coreIdentityErrors:
          process.env.CORE_IDENTITY_ERRORS?.split(",").filter(
            isCoreIdentityError
          ) ?? [],
        idTokenErrors:
          process.env.ID_TOKEN_ERRORS?.split(",").filter(isIdTokenError) ?? [],
        authoriseErrors:
          process.env.AUTHORISE_ERRORS?.split(",").filter(isAuthoriseError) ??
          [],
      },
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public static resetInstance(): void {
    Config.instance = new Config();
  }

  public static getUserConfiguration(sub: string): UserConfiguration {
    const config = Config.getInstance();

    const userConfig = config.userConfigurations.find(
      (u) => u.response.sub === sub
    );
    if (userConfig) {
      return userConfig;
    }

    const newConfig = Config.newUserConfig();
    newConfig.response.sub = sub;
    config.userConfigurations.push(newConfig);

    return newConfig;
  }

  public static deleteUserConfiguration(sub: string): void {
    const config = Config.getInstance();
    const i = config.userConfigurations.findIndex(
      (u) => u.response.sub === sub
    );

    if (i > -1) {
      config.userConfigurations.splice(i);
    }
  }

  public getClientConfiguration(): ClientConfiguration {
    return this.clientConfiguration;
  }

  public getClientId(): string {
    return this.clientConfiguration.clientId!;
  }

  public setClientId(clientId: string): void {
    this.clientConfiguration.clientId = clientId;
  }

  public getPublicKey(): string {
    return this.clientConfiguration.publicKey!;
  }

  public setPublicKey(publicKey: string): void {
    this.clientConfiguration.publicKey = publicKey;
  }

  public getScopes(): string[] {
    return this.clientConfiguration.scopes!;
  }

  public setScopes(scopes: string[]): void {
    this.clientConfiguration.scopes = scopes;
  }

  public getRedirectUrls(): string[] {
    return this.clientConfiguration.redirectUrls!;
  }

  public setRedirectUrls(redirectUrls: string[]): void {
    this.clientConfiguration.redirectUrls = redirectUrls;
  }

  public getPostLogoutRedirectUrls(): string[] {
    return this.clientConfiguration.postLogoutRedirectUrls as string[];
  }

  public setPostLogoutRedirectUrls(postLogoutRedirectUrls: string[]): void {
    this.clientConfiguration.postLogoutRedirectUrls = postLogoutRedirectUrls;
  }

  public getClaims(): UserIdentityClaim[] {
    return this.clientConfiguration.claims!;
  }

  public setClaims(claims: UserIdentityClaim[]): void {
    this.clientConfiguration.claims = claims;
  }

  public getIdentityVerificationSupported(): boolean {
    return this.clientConfiguration.identityVerificationSupported!;
  }

  public setIdentityVerificationSupported(
    identityVerificationSupported: boolean
  ): void {
    this.clientConfiguration.identityVerificationSupported =
      identityVerificationSupported;
  }

  public getIdTokenSigningAlgorithm(): string {
    return this.clientConfiguration.idTokenSigningAlgorithm!;
  }

  public setIdTokenSigningAlgorithm(idTokenSigningAlgorithm: string): void {
    this.clientConfiguration.idTokenSigningAlgorithm = idTokenSigningAlgorithm;
  }

  public getClientLoCs(): string[] {
    return this.clientConfiguration.clientLoCs!;
  }

  public setClientLoCs(clientLoCs: string[]): void {
    this.clientConfiguration.clientLoCs = clientLoCs;
  }

  public getResponseConfiguration(
    userConfig: UserConfiguration
  ): ResponseConfiguration {
    return userConfig.response;
  }

  public getUserConfigurations(): UserConfiguration[] {
    return this.userConfigurations;
  }

  public getEmail(userConfig: UserConfiguration): string {
    return userConfig.response.email!;
  }

  public setEmail(userConfig: UserConfiguration, email: string): void {
    userConfig.response.email = email;
  }

  public getEmailVerified(userConfig: UserConfiguration): boolean {
    return userConfig.response.emailVerified!;
  }

  public setEmailVerified(
    userConfig: UserConfiguration,
    emailVerified: boolean
  ): void {
    userConfig.response.emailVerified = emailVerified;
  }

  public getPhoneNumber(userConfig: UserConfiguration): string {
    return userConfig.response.phoneNumber!;
  }

  public setPhoneNumber(
    userConfig: UserConfiguration,
    phoneNumber: string
  ): void {
    userConfig.response.phoneNumber = phoneNumber;
  }

  public getPhoneNumberVerified(userConfig: UserConfiguration): boolean {
    return userConfig.response.phoneNumberVerified!;
  }

  public setPhoneNumberVerified(
    userConfig: UserConfiguration,
    phoneNumberVerified: boolean
  ): void {
    userConfig.response.phoneNumberVerified = phoneNumberVerified;
  }

  public getMaxLoCAchieved(userConfig: UserConfiguration): string {
    return userConfig.response.maxLoCAchieved!;
  }

  public setMaxLoCAchieved(
    userConfig: UserConfiguration,
    maxLoCAchieved: string
  ): void {
    userConfig.response.maxLoCAchieved = maxLoCAchieved;
  }

  public getVerifiableIdentityCredentials(
    userConfig: UserConfiguration
  ): object | null {
    return userConfig.response.coreIdentityVerifiableCredentials!;
  }

  public setVerifiableIdentityCredentials(
    userConfig: UserConfiguration,
    coreIdentityVerifiableCredentials: object | null
  ): void {
    userConfig.response.coreIdentityVerifiableCredentials =
      coreIdentityVerifiableCredentials;
  }

  public getPassportDetails(userConfig: UserConfiguration): object[] | null {
    return userConfig.response.passportDetails!;
  }

  public setPassportDetails(
    userConfig: UserConfiguration,
    passportDetails: object[] | null
  ): void {
    userConfig.response.passportDetails = passportDetails;
  }

  public getDrivingPermitDetails(
    userConfig: UserConfiguration
  ): object[] | null {
    return userConfig.response.drivingPermitDetails!;
  }

  public setDrivingPermitDetails(
    userConfig: UserConfiguration,
    drivingPermitDetails: object[] | null
  ): void {
    userConfig.response.drivingPermitDetails = drivingPermitDetails;
  }

  public getSocialSecurityRecordDetails(
    userConfig: UserConfiguration
  ): object[] | null {
    return userConfig.response.socialSecurityRecordDetails!;
  }

  public setSocialSecurityRecordDetails(
    userConfig: UserConfiguration,
    socialSecurityRecordDetails: object[] | null
  ): void {
    userConfig.response.socialSecurityRecordDetails =
      socialSecurityRecordDetails;
  }

  public getPostalAddressDetails(
    userConfig: UserConfiguration
  ): object[] | null {
    return userConfig.response.postalAddressDetails!;
  }

  public setPostalAddressDetails(
    userConfig: UserConfiguration,
    postalAddressDetails: object[] | null
  ): void {
    userConfig.response.postalAddressDetails = postalAddressDetails;
  }

  public getReturnCodes(userConfig: UserConfiguration): ReturnCode[] | null {
    return userConfig.response.returnCodes!;
  }

  public setReturnCodes(
    userConfig: UserConfiguration,
    returnCodes: ReturnCode[] | null
  ): void {
    userConfig.response.returnCodes = returnCodes;
  }

  public getAuthCodeRequestParams(
    authCode: string
  ): AuthRequestParameters | undefined {
    return this.authCodeRequestParamsStore[authCode];
  }

  public addToAuthCodeRequestParamsStore(
    authCode: string,
    authRequestParameters: AuthRequestParameters
  ): void {
    this.authCodeRequestParamsStore[authCode] = authRequestParameters;
  }

  public deleteFromAuthCodeRequestParamsStore(authCode: string): void {
    delete this.authCodeRequestParamsStore[authCode];
  }

  public getAccessTokensFromStore(
    clientIdSub: AccessTokenStoreKey
  ): string[] | undefined {
    return this.accessTokenStore[clientIdSub];
  }

  public addToAccessTokenStore(
    clientIdSub: AccessTokenStoreKey,
    accessToken: string
  ): void {
    this.accessTokenStore[clientIdSub] = [
      ...(this.accessTokenStore[clientIdSub] ?? []),
      accessToken,
    ];
  }

  public getErrorConfiguration(
    userConfig: UserConfiguration
  ): ErrorConfiguration {
    return userConfig.error;
  }

  public getCoreIdentityErrors(
    userConfig: UserConfiguration
  ): CoreIdentityError[] {
    return userConfig.error.coreIdentityErrors!;
  }

  public setCoreIdentityErrors(
    userConfig: UserConfiguration,
    coreIdentityErrors: CoreIdentityError[]
  ): void {
    userConfig.error.coreIdentityErrors = coreIdentityErrors;
  }

  public getIdTokenErrors(userConfig: UserConfiguration): IdTokenError[] {
    return userConfig.error.idTokenErrors!;
  }

  public setIdTokenErrors(
    userConfig: UserConfiguration,
    idTokenErrors: IdTokenError[]
  ): void {
    userConfig.error.idTokenErrors = idTokenErrors;
  }

  public getAuthoriseErrors(userConfig: UserConfiguration): AuthoriseError[] {
    return userConfig.error.authoriseErrors!;
  }

  public setAuthoriseErrors(
    userConfig: UserConfiguration,
    authoriseErrors: AuthoriseError[]
  ): void {
    userConfig.error.authoriseErrors = authoriseErrors;
  }

  public getSimulatorUrl(): string {
    return this.simulatorUrl;
  }

  public setSimulatorUrl(simulatorUrl: string): void {
    this.simulatorUrl = simulatorUrl;
  }

  public getIssuerValue(): string {
    return `${this.simulatorUrl}/`;
  }

  public getExpectedPrivateKeyJwtAudience(): string {
    return `${this.simulatorUrl}/token`;
  }

  public getTrustmarkUrl(): string {
    return `${this.simulatorUrl}/trustmark`;
  }

  public getDidController(): string {
    return `did:web:${new URL(this.simulatorUrl).host.replace(":", encodeURIComponent(":"))}`;
  }
}
