import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CA5K5A5F2V6Y6A4Y3YDB2GQ2MTHBAF7WE3BGZKMD675C7MC6UCZY4YUN",
  }
} as const

export type DataKey = {tag: "Trusted", values: readonly [string]} | {tag: "Stake", values: readonly [string]} | {tag: "UsdcToken", values: void} | {tag: "OraclePubKey", values: void};

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the Trust Registry with the USDC token address and the trusted Oracle's public key
   */
  init: ({usdc_token, oracle_pub_key}: {usdc_token: string, oracle_pub_key: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a slash transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin function to slash a publisher for posting fake news
   */
  slash: ({admin, publisher, amount}: {admin: string, publisher: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a stake transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Secondary Mechanism: Staking USDC for Independent Publishers
   */
  stake: ({publisher, amount}: {publisher: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_trusted transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only function for the Aegis Agent to check if a publisher is trusted
   */
  is_trusted: ({publisher}: {publisher: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a submit_zk_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Registers a publisher via ZK-Proof by verifying a cryptographic signature from the Oracle.
   * The `payload` represents the data the oracle verified (e.g., domain ownership).
   */
  submit_zk_proof: ({publisher, payload, signature}: {publisher: string, payload: Buffer, signature: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAF1Jbml0aWFsaXplIHRoZSBUcnVzdCBSZWdpc3RyeSB3aXRoIHRoZSBVU0RDIHRva2VuIGFkZHJlc3MgYW5kIHRoZSB0cnVzdGVkIE9yYWNsZSdzIHB1YmxpYyBrZXkAAAAAAAAEaW5pdAAAAAIAAAAAAAAACnVzZGNfdG9rZW4AAAAAABMAAAAAAAAADm9yYWNsZV9wdWJfa2V5AAAAAAPuAAAAIAAAAAA=",
        "AAAAAAAAADlBZG1pbiBmdW5jdGlvbiB0byBzbGFzaCBhIHB1Ymxpc2hlciBmb3IgcG9zdGluZyBmYWtlIG5ld3MAAAAAAAAFc2xhc2gAAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACXB1Ymxpc2hlcgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAADxTZWNvbmRhcnkgTWVjaGFuaXNtOiBTdGFraW5nIFVTREMgZm9yIEluZGVwZW5kZW50IFB1Ymxpc2hlcnMAAAAFc3Rha2UAAAAAAAACAAAAAAAAAAlwdWJsaXNoZXIAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAAB1RydXN0ZWQAAAAAAQAAABMAAAABAAAAAAAAAAVTdGFrZQAAAAAAAAEAAAATAAAAAAAAAAAAAAAJVXNkY1Rva2VuAAAAAAAAAAAAAAAAAAAMT3JhY2xlUHViS2V5",
        "AAAAAAAAAElSZWFkLW9ubHkgZnVuY3Rpb24gZm9yIHRoZSBBZWdpcyBBZ2VudCB0byBjaGVjayBpZiBhIHB1Ymxpc2hlciBpcyB0cnVzdGVkAAAAAAAACmlzX3RydXN0ZWQAAAAAAAEAAAAAAAAACXB1Ymxpc2hlcgAAAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAKpSZWdpc3RlcnMgYSBwdWJsaXNoZXIgdmlhIFpLLVByb29mIGJ5IHZlcmlmeWluZyBhIGNyeXB0b2dyYXBoaWMgc2lnbmF0dXJlIGZyb20gdGhlIE9yYWNsZS4KVGhlIGBwYXlsb2FkYCByZXByZXNlbnRzIHRoZSBkYXRhIHRoZSBvcmFjbGUgdmVyaWZpZWQgKGUuZy4sIGRvbWFpbiBvd25lcnNoaXApLgAAAAAAD3N1Ym1pdF96a19wcm9vZgAAAAADAAAAAAAAAAlwdWJsaXNoZXIAAAAAAAATAAAAAAAAAAdwYXlsb2FkAAAAAA4AAAAAAAAACXNpZ25hdHVyZQAAAAAAA+4AAABAAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        slash: this.txFromJSON<null>,
        stake: this.txFromJSON<null>,
        is_trusted: this.txFromJSON<boolean>,
        submit_zk_proof: this.txFromJSON<null>
  }
}