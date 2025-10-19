// ==UserScript==
// @name         Open in CyberChef
// @namespace    https://github.com/bjornmorten/open-in-cyberchef
// @homepageURL  https://github.com/bjornmorten/open-in-cyberchef
// @updateURL    https://github.com/bjornmorten/open-in-cyberchef/raw/main/open-in-cyberchef.user.js
// @downloadURL  https://github.com/bjornmorten/open-in-cyberchef/raw/main/open-in-cyberchef.user.js
// @supportURL   https://github.com/bjornmorten/open-in-cyberchef/issues
// @version      1.0.0
// @description  Quickly open selected text in CyberChef
// @author       bjornmorten
// @match        *://*/*
// @exclude      *://*/CyberChef/*
// @exclude      *://*cyberchef*/*
// @icon         https://github.com/gchq/CyberChef/raw/refs/heads/master/src/web/static/images/favicon.ico
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(() => {
  const DEFAULT_INSTANCE = "https://gchq.github.io/CyberChef/";

  const toBase64 = str => btoa(String.fromCharCode(...new TextEncoder().encode(str.replace(/\r/g, '')))).replace(/=+$/, "");

  function detectRecipe(text) {
    if (/^([01]{8}\s+){3,}[01]{8}\s*$/s.test(text))
      return "From_Binary('Space',8)";
    if (/^([01]{8}){4,}$/.test(text))
      return "From_Binary('None',8)";
    if (/^(?=.*[A-Fa-f2-9])([0-9A-Fa-f]{2}\s*){6,}$/s.test(text))
      return "From_Hex('Auto')";
    if (/^[-.\s/]+$/.test(text) && /[.-]{4,}/.test(text))
      return "From_Morse_Code('Space','Line feed')";
    if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text))
      return "JWT_Decode()";
    if (/^[A-Z2-7]+=*$/s.test(text) && text.length >= 32)
      return "From_Base32('A-Z2-7=',true)";
    if (/^H4sI[A-Za-z0-9+/]+=*$/s.test(text))
      return "From_Base64('A-Za-z0-9+/=',true),Gunzip()";
    if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/s.test(text) && text.length >= 32)
      return "From_Base64('A-Za-z0-9+/=',true)";
    if (/&#x?[0-9A-F]+;|&[a-z]+;/i.test(text))
      return "From_HTML_Entity()";
    return null;
  }

  async function getInput() {
    return window.getSelection().toString().trim() || "";
  }

  async function openInCyberChef(text) {
    let url = await GM_getValue("cyberchef_instance", DEFAULT_INSTANCE);
    if(text) {
      url += `#input=${encodeURIComponent(toBase64(text))}`;

      const recipe = detectRecipe(text);
      if (recipe) {
        url += "&recipe=" + encodeURIComponent(recipe);
      }
    }
    GM_openInTab(url, { active: true });
  }

  async function handleOpen() {
    const input = await getInput();
    openInCyberChef(input);
  }

  GM_registerMenuCommand("Set instance URL", async () => {
    const current = await GM_getValue("cyberchef_instance", DEFAULT_INSTANCE);
    const newUrl = prompt("Enter CyberChef instance URL:", current);
    const url = newUrl.trim() || DEFAULT_INSTANCE;
    await GM_setValue("cyberchef_instance", url);
    alert(`Instance set to: ${url}`);
  });

  document.addEventListener("keydown", async (e) => {
    const isAltC = e.altKey && e.code === "KeyC";
    const isAltGrC = e.getModifierState('AltGraph') && e.code === "KeyC";

    if (isAltC || isAltGrC) {
      e.preventDefault();
      await handleOpen();
    }
  });
})();
