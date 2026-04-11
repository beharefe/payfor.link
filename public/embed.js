/*!
 * unseal.link embed v1
 * Adds a styled buy button that opens the paywall in a popup.
 * Usage (anchor upgrade):
 *   <script async src="https://unseal.link/embed.js"></script>
 *   <a href="https://unseal.link/@username/slug" class="unseal-button">Buy — $9.99</a>
 *
 * Usage (web component):
 *   <unseal-button url="https://unseal.link/@username/slug" label="Buy — $9.99"></unseal-button>
 */
(function () {
  "use strict";

  var DOMAIN = "https://unseal.link";
  var POPUP_W = 480;
  var POPUP_H = 700;

  function injectStyles() {
    if (document.getElementById("unseal-embed-styles")) return;
    var style = document.createElement("style");
    style.id = "unseal-embed-styles";
    style.textContent = [
      ".unseal-btn{display:inline-flex;align-items:center;justify-content:center;",
      "padding:13px 28px;background:#111;color:#fff;border:none;border-radius:100px;",
      "font-size:15px;font-weight:500;font-family:system-ui,-apple-system,sans-serif;",
      "cursor:pointer;text-decoration:none;line-height:1;",
      "transition:opacity .15s ease;-webkit-appearance:none;}",
      ".unseal-btn:hover{opacity:.82;}",
      ".unseal-wrap{display:inline-flex;flex-direction:column;align-items:center;gap:7px;}",
      ".unseal-powered{font-family:Georgia,serif;font-size:12px;font-weight:600;",
      "color:#3D3530;letter-spacing:-0.3px;text-decoration:none;line-height:1;}",
      ".unseal-powered:hover{opacity:.65;}",
    ].join("");
    document.head.appendChild(style);
  }

  function openPopup(url) {
    var left = Math.max(0, Math.round((screen.width - POPUP_W) / 2));
    var top = Math.max(0, Math.round((screen.height - POPUP_H) / 4));
    var features =
      "width=" + POPUP_W + ",height=" + POPUP_H +
      ",left=" + left + ",top=" + top +
      ",resizable=yes,scrollbars=yes,status=no,toolbar=no";
    window.open(url, "unseal_checkout", features);
  }

  function makePoweredBy() {
    var a = document.createElement("a");
    a.href = DOMAIN + "?ref=embed";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "unseal-powered";
    a.textContent = "unseal.link";
    return a;
  }

  function buildButton(url, label, hidePowered) {
    var wrap = document.createElement("span");
    wrap.className = "unseal-wrap";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "unseal-btn";
    btn.textContent = label || "Buy access";
    btn.addEventListener("click", function () { openPopup(url); });
    wrap.appendChild(btn);

    if (!hidePowered) wrap.appendChild(makePoweredBy());
    return wrap;
  }

  /* Upgrade <a class="unseal-button" href="https://unseal.link/..."> anchors */
  function upgradeAnchors() {
    var anchors = document.querySelectorAll("a.unseal-button[href*=\"unseal.link\"]");
    for (var i = 0; i < anchors.length; i++) {
      var anchor = anchors[i];
      var url = anchor.href;
      var label = anchor.getAttribute("data-label") || anchor.textContent.trim() || "Buy access";
      var hidePowered = anchor.getAttribute("data-powered-by") === "false";
      var wrap = buildButton(url, label, hidePowered);
      anchor.parentNode.insertBefore(wrap, anchor);
      anchor.parentNode.removeChild(anchor);
    }
  }

  /* <unseal-button url="..." label="..." powered-by="false"> */
  function registerElement() {
    if (typeof customElements === "undefined") return;
    if (customElements.get("unseal-button")) return;

    function UnsealButton() {
      return Reflect.construct(HTMLElement, [], UnsealButton);
    }
    UnsealButton.prototype = Object.create(HTMLElement.prototype);
    UnsealButton.prototype.constructor = UnsealButton;
    UnsealButton.prototype.connectedCallback = function () {
      if (this._initialized) return;
      this._initialized = true;

      var url = this.getAttribute("url") || this.getAttribute("href");
      if (!url) return;

      var label = this.getAttribute("label") || "Buy access";
      var hidePowered = this.getAttribute("powered-by") === "false";

      injectStyles();
      this.appendChild(buildButton(url, label, hidePowered));
    };

    customElements.define("unseal-button", UnsealButton);
  }

  function init() {
    injectStyles();
    upgradeAnchors();
    registerElement();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
