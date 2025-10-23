// ==UserScript==
// @name         Open in CyberChef
// @namespace    https://github.com/bjornmorten/open-in-cyberchef
// @version      1.0.1
// @description  Quickly open selected text in CyberChef
// @author       bjornmorten
// @homepageURL  https://github.com/bjornmorten/open-in-cyberchef
// @supportURL   https://github.com/bjornmorten/open-in-cyberchef/issues
// @updateURL    https://github.com/bjornmorten/open-in-cyberchef/raw/main/open-in-cyberchef.user.js
// @downloadURL  https://github.com/bjornmorten/open-in-cyberchef/raw/main/open-in-cyberchef.user.js
// @icon         https://github.com/gchq/CyberChef/raw/refs/heads/master/src/web/static/images/favicon.ico
// @license      MIT
//
// @match        *://*/*
// @exclude      *://*/CyberChef/*
// @exclude      *://*cyberchef*/*
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
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
      const useMagic = await GM_getValue("use_magic_recipe", true);
      if (recipe) {
        url += "&recipe=" + encodeURIComponent(recipe);
      } else if(useMagic) {
        url += "&recipe=" + encodeURIComponent("Magic(3,false,false,'')");
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

  GM_registerMenuCommand("Toggle magic recipe", async () => {
    const current = await GM_getValue("use_magic_recipe", true);
    const newValue = !current;
    await GM_setValue("use_magic_recipe", newValue);
    alert(`Magic recipe is now ${newValue ? "enabled" : "disabled"}.`);
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
