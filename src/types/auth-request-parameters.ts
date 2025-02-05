import { VectorOfTrust } from "./vector-of-trust";

export default interface AuthRequestParameters {
  sub: string;
  params: {
    redirectUri: string;
    nonce: string;
    scopes: string[];
    claims: string[];
    vtr: VectorOfTrust;
  }
}
