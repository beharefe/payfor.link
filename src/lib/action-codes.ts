import Client, { Prod } from "@actioncodes/sdk";
import { Connection } from "@solana/web3.js";

let _client: Client | null = null;

export function getActionCodesClient(): Client {
  if (_client) return _client;

  const token = process.env.ACTION_CODES_TOKEN;
  if (!token) throw new Error("ACTION_CODES_TOKEN must be set");

  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

  _client = new Client(Prod, {
    auth: { authorization: `Bearer ${token}` },
    adapters: { solana: { connection: new Connection(rpcUrl) } },
  });

  return _client;
}
