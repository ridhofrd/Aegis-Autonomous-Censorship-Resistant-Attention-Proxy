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
    contractId: "CCF3JI62B5PQZSY3RO5SR2PV46CVXHSUDKICB5KEBFM5F77EX6NIZPOX",
  }
} as const

export type DataKey = {tag: "VaultOwner", values: void} | {tag: "AgentAddress", values: void} | {tag: "DailyLimit", values: void} | {tag: "DailySpent", values: void} | {tag: "TrustRegistryAddress", values: void} | {tag: "UsdcToken", values: void};

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the vault with the owner, agent, limit, and external contract addresses
   */
  init: ({owner, agent, daily_limit, trust_registry, usdc_token}: {owner: string, agent: string, daily_limit: i128, trust_registry: string, usdc_token: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit USDC into the vault from the owner's wallet
   */
  deposit: ({amount}: {amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a pay_publisher transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Agent calls this to pay a publisher.
   */
  pay_publisher: ({publisher, amount}: {publisher: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

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
      new ContractSpec([ "AAAAAAAAAFJJbml0aWFsaXplIHRoZSB2YXVsdCB3aXRoIHRoZSBvd25lciwgYWdlbnQsIGxpbWl0LCBhbmQgZXh0ZXJuYWwgY29udHJhY3QgYWRkcmVzc2VzAAAAAAAEaW5pdAAAAAUAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAFYWdlbnQAAAAAAAATAAAAAAAAAAtkYWlseV9saW1pdAAAAAALAAAAAAAAAA50cnVzdF9yZWdpc3RyeQAAAAAAEwAAAAAAAAAKdXNkY190b2tlbgAAAAAAEwAAAAA=",
        "AAAAAAAAADNEZXBvc2l0IFVTREMgaW50byB0aGUgdmF1bHQgZnJvbSB0aGUgb3duZXIncyB3YWxsZXQAAAAAB2RlcG9zaXQAAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAAClZhdWx0T3duZXIAAAAAAAAAAAAAAAAADEFnZW50QWRkcmVzcwAAAAAAAAAAAAAACkRhaWx5TGltaXQAAAAAAAAAAAAAAAAACkRhaWx5U3BlbnQAAAAAAAAAAAAAAAAAFFRydXN0UmVnaXN0cnlBZGRyZXNzAAAAAAAAAAAAAAAJVXNkY1Rva2VuAAAA",
        "AAAAAAAAACRBZ2VudCBjYWxscyB0aGlzIHRvIHBheSBhIHB1Ymxpc2hlci4AAAANcGF5X3B1Ymxpc2hlcgAAAAAAAAIAAAAAAAAACXB1Ymxpc2hlcgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        deposit: this.txFromJSON<null>,
        pay_publisher: this.txFromJSON<null>
  }
}