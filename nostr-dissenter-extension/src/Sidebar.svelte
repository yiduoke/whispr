<script>
  import { onMount } from "svelte";
  import {
    COMMENT_KIND,
    DEFAULT_RELAYS,
    connectRelays,
    publishComment,
    genNewKey,
    decodePriv
  } from "./lib/nostr.js";
  import { nip19, getPublicKey } from "nostr-tools";

  let relays;
  let events = [];
  let ready = false;
  let comment = "";
  let privkey = null;
  let pubkey = null;
  let useNip07 = false;
  const pageUrl = window.parent.location.href;

  async function loadEvents() {
    const filter = { kinds: [COMMENT_KIND], tags: { r: [pageUrl] } };
    relays.forEach((relay) => {
      relay.sub([filter]).on("event", (evt) => {
        events = [...events, evt];
      });
    });
  }

  function signInWithNip07() {
    window.nostr.getPublicKey().then((pk) => {
      pubkey = pk;
      useNip07 = true;
      ready = true;
      afterReady();
    });
  }

  async function generateKey() {
    const { priv, pub } = await genNewKey();
    privkey = priv;
    pubkey = pub;
    await chrome.storage.local.set({ privkey });
    ready = true;
    afterReady();
  }

  async function importKey(input) {
    try {
      privkey = decodePriv(input);
      pubkey = getPublicKey(privkey);
      await chrome.storage.local.set({ privkey });
      ready = true;
      afterReady();
    } catch (e) {
      alert("Invalid private key");
    }
  }

  function afterReady() {
    relays = connectRelays();
    loadEvents();
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
    const stored = await chrome.storage.local.get(["privkey"]);
    if (stored.privkey) {
      privkey = stored.privkey;
      pubkey = getPublicKey(privkey);
      ready = true;
      afterReady();
    }
  });
</script>

<style>
  .container { display: flex; flex-direction: column; height: 100vh; }
  header { background: #f48024; color: white; padding: 10px; display:flex; justify-content: space-between; align-items:center; }
  main { flex:1; overflow:auto; padding: 10px; }
  textarea { width: 100%; min-height: 60px; margin-top:10px; }
  button { background:#f48024; color:white; border:none; padding:8px 12px; margin-top:6px; cursor:pointer; }
  .comment { border-bottom:1px solid #eee; padding:8px 0; }
  .comment small{ color:#666; }
</style>

<div class="container">
  <header>
    <span>Nostr Comments</span>
    <span style="cursor:pointer" on:click={() => window.parent.document.getElementById('nostr-comment-sidebar').remove()}>✖️</span>
  </header>

  {#if !ready}
    <main>
      <h3>Sign In to Comment</h3>
      <button on:click={signInWithNip07} disabled={!window.nostr}>Use NIP‑07</button>
      <button on:click={generateKey}>Generate Key</button>
      <input placeholder="Paste nsec / hex key" bind:this={importInput} style="width:100%; margin-top:10px;" />
      <button on:click={() => importKey(importInput.value)} style="width:100%">Import Key</button>
    </main>
  {:else}
    <main>
      {#each events as e}
        <div class="comment">
          <p>{e.content}</p>
          <small>{nip19.npubEncode(e.pubkey).slice(0, 16)}… • {new Date(e.created_at*1000).toLocaleString()}</small>
        </div>
      {/each}
      <textarea bind:value={comment} placeholder="Write a comment…"></textarea>
      <button on:click={post}>Post Comment</button>
    </main>
  {/if}
</div>