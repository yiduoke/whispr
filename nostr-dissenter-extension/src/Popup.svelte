<script>
  import { onMount } from "svelte";
  import {
    COMMENT_KIND,
    connectRelays,
    publishComment,
    genNewKey,
    decodePriv
  } from "./lib/nostr.js";
  import { nip19, getPublicKey } from "nostr-tools";

  let pageUrl = "";
  let relays = [];
  let events = [];
  let ready = false;
  let comment = "";
  let privkey = null;
  let pubkey = null;
  let useNip07 = false;

  async function fetchActiveTabUrl() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url || "";
  }

  async function loadEvents() {
    const filter = { kinds: [COMMENT_KIND], tags: { r: [pageUrl] } };
    relays.forEach((relay) => {
      relay.sub([filter]).on("event", (evt) => {
        events = [...events, evt];
      });
    });
  }

  async function initRelays() {
    relays = connectRelays();
    await loadEvents();
  }

  function signInWithNip07() {
    window.nostr.getPublicKey().then((pk) => {
      pubkey = pk;
      useNip07 = true;
      ready = true;
      initRelays();
    });
  }

  async function generateKey() {
    const { priv, pub } = await genNewKey();
    privkey = priv;
    pubkey = pub;
    await chrome.storage.local.set({ privkey });
    ready = true;
    initRelays();
  }

  async function importKey(input) {
    try {
      privkey = decodePriv(input);
      pubkey = getPublicKey(privkey);
      await chrome.storage.local.set({ privkey });
      ready = true;
      initRelays();
    } catch (e) {
      alert("Invalid private key");
    }
  }

  async function post() {
    if (!comment.trim()) return;
    await publishComment({
      content: comment.trim(),
      url: pageUrl,
      pubkey,
      privkey,
      relays,
      useNip07
    });
    comment = "";
  }

  onMount(async () => {
    pageUrl = await fetchActiveTabUrl();
    const stored = await chrome.storage.local.get(["privkey"]);
    if (stored.privkey) {
      privkey = stored.privkey;
      pubkey = getPublicKey(privkey);
      ready = true;
      initRelays();
    }
  });
</script>

<style>
  body, html { margin:0; padding:0; font-family: Arial, sans-serif; }
  .wrap { width: 320px; height: 480px; display:flex; flex-direction:column; }
  header { background:#f48024; color:white; padding:8px; text-align:center; }
  main { flex:1; overflow:auto; padding:8px; }
  textarea { width:100%; min-height:60px; margin-top:8px; }
  button { background:#f48024; color:white; border:none; padding:6px 10px; margin-top:6px; cursor:pointer; }
  .comment { border-bottom:1px solid #eee; padding:6px 0; }
  .comment small { color:#666; }
</style>

<div class="wrap">
  <header>Nostr Comments</header>

  {#if !pageUrl}
    <main><p>Unable to determine active tab URL.</p></main>
  {:else if !ready}
    <main>
      <h3>Sign In to Comment</h3>
      <button on:click={signInWithNip07} disabled={!window.nostr}>Use NIP‑07</button>
      <button on:click={generateKey}>Generate Key</button>
      <input placeholder="Paste nsec / hex key" bind:this={importInput} style="width:100%; margin-top:8px;" />
      <button on:click={() => importKey(importInput.value)} style="width:100%">Import Key</button>
    </main>
  {:else}
    <main>
      {#each events as e}
        <div class="comment">
          <p>{e.content}</p>
          <small>{nip19.npubEncode(e.pubkey).slice(0,16)}… • {new Date(e.created_at*1000).toLocaleString()}</small>
        </div>
      {/each}
      <textarea bind:value={comment} placeholder="Write a comment…"></textarea>
      <button on:click={post}>Post Comment</button>
    </main>
  {/if}
</div>