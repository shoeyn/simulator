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

  public getUserIndex(sub: string): number {
    const userIndex = this.userConfigurations.findIndex(
      (u) => u.response.sub === sub
    );
    if (userIndex > -1) {
      return userIndex;
    }

    const newConfig = Config.newUserConfig();
    newConfig.response.sub = sub;
    this.userConfigurations.push(newConfig);

    return this.userConfigurations.length - 1;
  }

  public deleteUserConfiguration(sub: string): void {
    const i = this.getUserIndex(sub);

    if (i > -1) {
      this.userConfigurations.splice(i);
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
    userIndex: number
  ): ResponseConfiguration {
    return this.userConfigurations[userIndex].response;
  }

  public getUserConfigurations(): UserConfiguration[] {
    return this.userConfigurations;
  }

  public getEmail(userIndex: number): string {
    return this.userConfigurations[userIndex].response.email!;
  }

  public setEmail(userIndex: number, email: string): void {
    this.userConfigurations[userIndex].response.email = email;
  }

  public getEmailVerified(userIndex: number): boolean {
    return this.userConfigurations[userIndex].response.emailVerified!;
  }

  public setEmailVerified(
    userIndex: number,
    emailVerified: boolean
  ): void {
    this.userConfigurations[userIndex].response.emailVerified = emailVerified;
  }

  public getPhoneNumber(userIndex: number): string {
    return this.userConfigurations[userIndex].response.phoneNumber!;
  }

  public setPhoneNumber(
    userIndex: number,
    phoneNumber: string
  ): void {
    this.userConfigurations[userIndex].response.phoneNumber = phoneNumber;
  }

  public getPhoneNumberVerified(userIndex: number): boolean {
    return this.userConfigurations[userIndex].response.phoneNumberVerified!;
  }

  public setPhoneNumberVerified(
    userIndex: number,
    phoneNumberVerified: boolean
  ): void {
    this.userConfigurations[userIndex].response.phoneNumberVerified = phoneNumberVerified;
  }

  public getMaxLoCAchieved(userIndex: number): string {
    return this.userConfigurations[userIndex].response.maxLoCAchieved!;
  }

  public setMaxLoCAchieved(
    userIndex: number,
    maxLoCAchieved: string
  ): void {
    this.userConfigurations[userIndex].response.maxLoCAchieved = maxLoCAchieved;
  }

  public getVerifiableIdentityCredentials(
    userIndex: number
  ): object | null {
    return this.userConfigurations[userIndex].response.coreIdentityVerifiableCredentials!;
  }

  public setVerifiableIdentityCredentials(
    userIndex: number,
    coreIdentityVerifiableCredentials: object | null
  ): void {
    this.userConfigurations[userIndex].response.coreIdentityVerifiableCredentials =
      coreIdentityVerifiableCredentials;
  }

  public getPassportDetails(userIndex: number): object[] | null {
    return this.userConfigurations[userIndex].response.passportDetails!;
  }

  public setPassportDetails(
    userIndex: number,
    passportDetails: object[] | null
  ): void {
    this.userConfigurations[userIndex].response.passportDetails = passportDetails;
  }

  public getDrivingPermitDetails(
    userIndex: number
  ): object[] | null {
    return this.userConfigurations[userIndex].response.drivingPermitDetails!;
  }

  public setDrivingPermitDetails(
    userIndex: number,
    drivingPermitDetails: object[] | null
  ): void {
    this.userConfigurations[userIndex].response.drivingPermitDetails = drivingPermitDetails;
  }

  public getPostalAddressDetails(
    userIndex: number
  ): object[] | null {
    return this.userConfigurations[userIndex].response.postalAddressDetails!;
  }

  public setPostalAddressDetails(
    userIndex: number,
    postalAddressDetails: object[] | null
  ): void {
    this.userConfigurations[userIndex].response.postalAddressDetails = postalAddressDetails;
  }

  public getReturnCodes(userIndex: number): ReturnCode[] | null {
    return this.userConfigurations[userIndex].response.returnCodes!;
  }

  public setReturnCodes(
    userIndex: number,
    returnCodes: ReturnCode[] | null
  ): void {
    this.userConfigurations[userIndex].response.returnCodes = returnCodes;
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
    userIndex: number
  ): ErrorConfiguration {
    return this.userConfigurations[userIndex].error;
  }

  public getCoreIdentityErrors(
    userIndex: number
  ): CoreIdentityError[] {
    return this.userConfigurations[userIndex].error.coreIdentityErrors!;
  }

  public setCoreIdentityErrors(
    userIndex: number,
    coreIdentityErrors: CoreIdentityError[]
  ): void {
    this.userConfigurations[userIndex].error.coreIdentityErrors = coreIdentityErrors;
  }

  public getIdTokenErrors(userIndex: number): IdTokenError[] {
    return this.userConfigurations[userIndex].error.idTokenErrors!;
  }

  public setIdTokenErrors(
    userIndex: number,
    idTokenErrors: IdTokenError[]
  ): void {
    this.userConfigurations[userIndex].error.idTokenErrors = idTokenErrors;
  }

  public getAuthoriseErrors(userIndex: number): AuthoriseError[] {
    return this.userConfigurations[userIndex].error.authoriseErrors!;
  }

  public setAuthoriseErrors(
    userIndex: number,
    authoriseErrors: AuthoriseError[]
  ): void {
    this.userConfigurations[userIndex].error.authoriseErrors = authoriseErrors;
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
