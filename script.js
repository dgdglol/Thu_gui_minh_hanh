/**
 * ============================================================================
 * THƯ GỬI MINH HẠNH — Interactive Logic (GitHub Pages Live Edition)
 * 1. Đọc & Viết thư trực tiếp trên link GitHub (Lưu đồng bộ Cloud + URL)
 *    - Mặc định khi Minh Hạnh mở link: Giao diện đọc thư sạch sẽ, khóa chỉnh sửa.
 *    - Khi Vũ Dũng mở link thêm ?viet=1 (hoặc bấm 3 lần vào con tem góc phải):
 *      Mở chế độ viết/sửa thư trực tiếp trên link.
 * 2. Con Bot đồng hành ở góc dưới bên phải:
 *    - 2 phút đầu (120s) vào web: Không nói gì
 *    - Sau đó: Random 1 trong 4 câu -> Hiện 30s -> Ẩn 15s -> Random câu tiếp theo
 * ============================================================================
 */

(function initThuGuiMinhHanh() {
  "use strict";

  const STORAGE_KEY = "thu_gui_minh_hanh_data_v2";
  const CLOUD_LETTER_TOPIC = "thu_gui_minh_hanh_letter_cloud_vd2003071_v2";

  // --------------------------------------------------------------------------
  // 1. CẤU HÌNH CON BOT ĐỒNG HÀNH (Đúng 4 câu theo yêu cầu)
  // --------------------------------------------------------------------------
  const BOT_MESSAGES = [
    "Cho tôi xin lỗi nhiều với",
    "Trời sắp lạnh rồi mặc ấm vào nha",
    "Đừng cố gắng quá sức nha",
    "Chúc bạn mai vui vẻ"
  ];

  const INITIAL_SILENT_DELAY_MS = 120 * 1000; // 2 phút đầu không nói gì (120.000ms)
  const MESSAGE_VISIBLE_MS = 30 * 1000;       // Mỗi câu hiện 30 giây (30.000ms)
  const MESSAGE_HIDDEN_MS = 15 * 1000;        // Không hiện gì 15 giây (15.000ms)

  const botBubble = document.getElementById("botMessageBubble");
  const botText = document.getElementById("botMessageText");
  const botDock = document.getElementById("botAvatarDock");
  const botTimerFill = document.getElementById("botTimerFill");

  let lastMessageIndex = -1;
  let initialDelayTimer = null;
  let visibleTimer = null;
  let hiddenTimer = null;

  function pickRandomBotMessage() {
    if (BOT_MESSAGES.length <= 1) return BOT_MESSAGES[0];
    let idx;
    do {
      idx = Math.floor(Math.random() * BOT_MESSAGES.length);
    } while (idx === lastMessageIndex);
    lastMessageIndex = idx;
    return BOT_MESSAGES[idx];
  }

  function showNextBotMessage() {
    clearTimeout(initialDelayTimer);
    clearTimeout(visibleTimer);
    clearTimeout(hiddenTimer);

    if (!botBubble || !botText || !botDock) return;

    const message = pickRandomBotMessage();

    botBubble.classList.remove("visible");
    if (botTimerFill) {
      botTimerFill.style.animation = "none";
    }
    void botBubble.offsetWidth; // Force reflow

    botText.textContent = message;
    if (botTimerFill) {
      botTimerFill.style.animation = "";
    }

    botBubble.classList.add("visible");
    botDock.classList.add("speaking");

    visibleTimer = setTimeout(() => {
      botBubble.classList.remove("visible");
      botDock.classList.remove("speaking");

      hiddenTimer = setTimeout(() => {
        showNextBotMessage();
      }, MESSAGE_HIDDEN_MS);
    }, MESSAGE_VISIBLE_MS);
  }

  function initCompanionBot() {
    clearTimeout(initialDelayTimer);
    initialDelayTimer = setTimeout(() => {
      showNextBotMessage();
    }, INITIAL_SILENT_DELAY_MS);
  }

  if (botDock) {
    botDock.addEventListener("click", () => {
      showNextBotMessage();
    });
  }

  // --------------------------------------------------------------------------
  // 2. VIẾT / CHỈNH SỬA THƯ TRỰC TIẾP TRÊN LINK & ĐỒNG BỘ CHO MINH HẠNH
  // --------------------------------------------------------------------------
  const editableIds = [
    "letterTitle",
    "letterDate",
    "letterSalutation",
    "letterBody",
    "letterPostscript",
    "letterClosing",
    "letterSignature"
  ];

  const authorToast = document.getElementById("authorToast");
  const btnLockView = document.getElementById("btnLockView");
  const btnSaveCloudLetter = document.getElementById("btnSaveCloudLetter");
  const vintageStampBox = document.getElementById("vintageStampBox");

  function showToast(htmlMsg) {
    if (!authorToast) return;
    authorToast.innerHTML = htmlMsg;
    authorToast.style.display = "block";
  }

  function getCurrentLetterData() {
    const data = {};
    editableIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        data[id] = el.innerHTML;
      }
    });
    return data;
  }

  function applyLetterData(data) {
    if (!data || typeof data !== "object") return;
    editableIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el && typeof data[id] === "string" && data[id].trim() !== "") {
        el.innerHTML = data[id];
      }
    });
  }

  function encodeLetterToBase64(data) {
    try {
      const jsonStr = JSON.stringify(data);
      return btoa(encodeURIComponent(jsonStr));
    } catch (_) {
      return "";
    }
  }

  function decodeLetterFromBase64(b64) {
    try {
      const jsonStr = decodeURIComponent(atob(b64));
      return JSON.parse(jsonStr);
    } catch (_) {
      return null;
    }
  }

  async function loadLatestLetterContent() {
    const params = new URLSearchParams(window.location.search);
    const encodedThu = params.get("thu");
    if (encodedThu) {
      const decoded = decodeLetterFromBase64(encodedThu);
      if (decoded) {
        applyLetterData(decoded);
        return;
      }
    }

    try {
      const res = await fetch(`https://ntfy.sh/${CLOUD_LETTER_TOPIC}/json?poll=1`);
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split("\n").filter(Boolean);
        let latestPayload = null;
        for (const line of lines) {
          try {
            const item = JSON.parse(line);
            if (item && item.event === "message" && item.message) {
              const parsed = JSON.parse(item.message);
              if (parsed && parsed.letterData) {
                latestPayload = parsed.letterData;
              }
            }
          } catch (_) {}
        }
        if (latestPayload) {
          applyLetterData(latestPayload);
          return;
        }
      }
    } catch (_) {}

    try {
      const localRaw = localStorage.getItem(STORAGE_KEY);
      if (localRaw) {
        applyLetterData(JSON.parse(localRaw));
      }
    } catch (_) {}
  }

  function setAuthorWriteMode(enabled) {
    document.body.classList.toggle("read-only-mode", !enabled);
    document.body.classList.toggle("show-admin-panel", enabled);
    editableIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute("contenteditable", enabled ? "true" : "false");
      }
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("viet") || urlParams.has("edit") || urlParams.has("admin")) {
    setAuthorWriteMode(true);
  }

  let stampClickCount = 0;
  let stampClickTimer = null;
  if (vintageStampBox) {
    vintageStampBox.style.cursor = "pointer";
    vintageStampBox.addEventListener("click", () => {
      stampClickCount++;
      clearTimeout(stampClickTimer);
      if (stampClickCount >= 3) {
        stampClickCount = 0;
        const isCurrentlyReadOnly = document.body.classList.contains("read-only-mode");
        setAuthorWriteMode(isCurrentlyReadOnly);
      } else {
        stampClickTimer = setTimeout(() => {
          stampClickCount = 0;
        }, 900);
      }
    });
  }

  if (btnLockView) {
    btnLockView.addEventListener("click", () => {
      setAuthorWriteMode(false);
    });
  }

  if (btnSaveCloudLetter) {
    btnSaveCloudLetter.addEventListener("click", async () => {
      const letterData = getCurrentLetterData();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(letterData));
      } catch (_) {}

      const originalText = btnSaveCloudLetter.textContent;
      btnSaveCloudLetter.disabled = true;
      btnSaveCloudLetter.textContent = "⏳ Đang lưu thư lên Link Web...";

      let cloudSaved = false;
      try {
        const res = await fetch(`https://ntfy.sh/${CLOUD_LETTER_TOPIC}`, {
          method: "POST",
          body: JSON.stringify({
            updatedAt: new Date().toLocaleString("vi-VN"),
            letterData: letterData
          })
        });
        cloudSaved = res.ok;
      } catch (_) {
        cloudSaved = false;
      }

      const cleanBaseUrl = window.location.origin + window.location.pathname;
      const encoded = encodeLetterToBase64(letterData);
      const shareUrl = cloudSaved ? cleanBaseUrl : `${cleanBaseUrl}?thu=${encoded}`;

      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast(
          `<strong>✓ Đã lưu nội dung thư lên Link &amp; tự động Copy Link!</strong><br>` +
          `Link gửi Minh Hạnh: <a href="${shareUrl}" target="_blank" style="color:inherit;font-weight:600;text-decoration:underline;">${shareUrl}</a>`
        );
      } catch (_) {
        showToast(
          `<strong>✓ Đã lưu nội dung thư lên Link thành công!</strong><br>` +
          `Link gửi Minh Hạnh: <a href="${shareUrl}" target="_blank" style="color:inherit;font-weight:600;text-decoration:underline;">${shareUrl}</a>`
        );
      }

      btnSaveCloudLetter.disabled = false;
      btnSaveCloudLetter.textContent = originalText;
    });
  }

  // Khởi tạo khi tải trang
  loadLatestLetterContent();
  initCompanionBot();
})();
