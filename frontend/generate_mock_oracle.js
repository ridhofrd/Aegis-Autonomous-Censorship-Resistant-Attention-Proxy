const { Keypair } = require("@stellar/stellar-sdk");

// Generate a random keypair
const keypair = Keypair.random();

// Get the public key (raw 32 bytes)
const publicKeyRaw = keypair.rawPublicKey();
const publicKeyHex = publicKeyRaw.toString("hex");

// Get the secret key
const secretKey = keypair.secret();

console.log("MOCK_ORACLE_PUBLIC_KEY_HEX:", publicKeyHex);
console.log("MOCK_ORACLE_SECRET_KEY:", secretKey);
