import {
  SimplePool,
  finishEvent,
  nip19,
  generatePrivateKey,
  getPublicKey
} from "nostr-tools";

export const COMMENT_KIND = 40001; // custom kind to avoid clutter
export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.snort.social"
];

export function connectRelays(relayUrls = DEFAULT_RELAYS) {
  const pool = new SimplePool();
  const relays = relayUrls.map((u) => pool.ensureRelay(u));
  return relays;
}

export async function publishComment({
  content,
  url,
  pubkey,
  privkey,
  relays,
  useNip07
}) {
  let event = {
    kind: COMMENT_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["r", url],
      ["client", "nostr-dissenter"]
    ],
    content,
    pubkey
  };
  if (useNip07 && window.nostr) {
    event = await window.nostr.signEvent(event);
  } else {
    event = finishEvent(event, privkey);
  }
  relays.forEach((r) => r.publish(event));
}

export async function genNewKey() {
  const priv = generatePrivateKey();
  return { priv, pub: getPublicKey(priv) };
}

export function decodePriv(str) {
  return str.startsWith("nsec") ? nip19.decode(str).data : str;
}