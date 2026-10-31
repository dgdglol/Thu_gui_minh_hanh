/**
 * ============================================================================
 * THƯ GỬI MINH HẠNH — Interactive Logic (GitHub Pages Live Edition)
 * 1. Đọc & Viết thư trực tiếp trên link GitHub (Lưu đồng bộ Cloud + URL)
 *    - Mặc định khi Minh Hạnh mở link: Giao diện đọc thư sạch sẽ, khóa chỉnh sửa.
 *    - Khi Vũ Dũng mở link thêm ?viet=1 (hoặc bấm 3 lần vào con tem góc phải):
 *      Mở chế độ viết/sửa thư trực tiếp trên link & xem hộp thư lời nhắn.
 * 2. Con Bot đồng hành:
 *    - 2 phút đầu (120s) vào web: Không nói gì
 *    - Sau đó: Random 1 trong 4 câu -> Hiện 30s -> Ẩn 15s -> Random câu tiếp theo
 * 3. Khung hồi âm cuối thư:
 *    - Con trỏ gõ chữ đến đâu -> Avatar của con Bot hiện ra và đi theo đến đó
 *    - Khi Minh Hạnh bấm Gửi -> Gửi thông báo & tin nhắn về:
 *      + Email: vudung2003071@gmail.com (qua FormSubmit AJAX)
 *      + Kênh thông báo tức thì & hộp thư lưu trữ dự phòng (ntfy Cloud)
 * ============================================================================
 */

(function initThuGuiMinhHanh() {
  "use strict";

  const TARGET_EMAIL = "vudung2003071@gmail.com";
  const STORAGE_KEY = "thu_gui_minh_hanh_data_v1";
  const CLOUD_MSG_TOPIC = "thu_gui_minh_hanh_msg_vudung2003071";
  const CLOUD_LETTER_TOPIC = "thu_gui_minh_hanh_letter_cloud_vd2003071";

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
  // 2. AVATAR CON BOT ĐI THEO CON TRỎ ĐANG GÕ (Caret-Following Bot Avatar)
  // --------------------------------------------------------------------------
  const replyTextarea = document.getElementById("replyTextarea");
  const caretMirror = document.getElementById("caretMirror");
  const caretBotAvatar = document.getElementById("caretBotAvatar");
  let typingPulseTimeout = null;

  function updateCaretBotPosition(isTypingEvent = false) {
    if (!replyTextarea || !caretMirror || !caretBotAvatar) return;

    const computed = window.getComputedStyle(replyTextarea);
    caretMirror.style.width = replyTextarea.clientWidth + "px";
    caretMirror.style.fontFamily = computed.fontFamily;
    caretMirror.style.fontSize = computed.fontSize;
    caretMirror.style.lineHeight = computed.lineHeight;
    caretMirror.style.padding = computed.padding;

    const selectionEnd = replyTextarea.selectionEnd || 0;
    const textBeforeCaret = replyTextarea.value.substring(0, selectionEnd);

    caretMirror.textContent = textBeforeCaret;
    const caretMarker = document.createElement("span");
    caretMarker.textContent = "\u200b";
    caretMirror.appendChild(caretMarker);

    const rawLeft = caretMarker.offsetLeft;
    const rawTop = caretMarker.offsetTop - replyTextarea.scrollTop;

    const maxLeft = Math.max(24, replyTextarea.clientWidth - 46);
    const maxTop = Math.max(18, replyTextarea.clientHeight - 24);

    const clampedLeft = Math.min(Math.max(12, rawLeft), maxLeft);
    const clampedTop = Math.min(Math.max(16, rawTop), maxTop);

    caretBotAvatar.style.left = clampedLeft + "px";
    caretBotAvatar.style.top = clampedTop + "px";
    caretBotAvatar.classList.add("active");

    if (isTypingEvent) {
      caretBotAvatar.classList.add("typing-pulse");
      clearTimeout(typingPulseTimeout);
      typingPulseTimeout = setTimeout(() => {
        caretBotAvatar.classList.remove("typing-pulse");
      }, 380);
    }
  }

  if (replyTextarea) {
    ["input", "keyup", "click", "select"].forEach((evtName) => {
      replyTextarea.addEventListener(evtName, () => {
        updateCaretBotPosition(evtName === "input");
      });
    });

    replyTextarea.addEventListener("focus", () => {
      updateCaretBotPosition(false);
    });

    replyTextarea.addEventListener("scroll", () => {
      if (document.activeElement === replyTextarea) {
        updateCaretBotPosition(false);
      }
    });

    replyTextarea.addEventListener("blur", () => {
      caretBotAvatar.classList.remove("typing-pulse");
      if (!replyTextarea.value.trim()) {
        caretBotAvatar.classList.remove("active");
      }
    });

    window.addEventListener("resize", () => {
      if (document.activeElement === replyTextarea) {
        updateCaretBotPosition(false);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. GỬI THÔNG BÁO TIN NHẮN & EMAIL VỀ vudung2003071@gmail.com
  // --------------------------------------------------------------------------
  const replyForm = document.getElementById("replyForm");
  const senderNameInput = document.getElementById("senderNameInput");
  const btnSendReply = document.getElementById("btnSendReply");
  const emailFeedbackBox = document.getElementById("emailFeedbackBox");

  function buildMailtoUrl(sender, message) {
    const subject = encodeURIComponent(`💌 Hồi âm từ ${sender} (Web Thư Gửi Minh Hạnh)`);
    const body = encodeURIComponent(
      `Người gửi: ${sender}\nThời gian: ${new Date().toLocaleString("vi-VN")}\n\nLời nhắn:\n${message}`
    );
    return `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`;
  }

  /**
   * Gửi đồng thời qua:
   * 1) FormSubmit AJAX -> Gửi thẳng email thông báo về vudung2003071@gmail.com
   * 2) Kênh thông báo realtime ntfy -> Báo chuông tức thì & lưu hộp thư dự phòng
   */
  async function sendNotificationAndEmail(sender, message) {
    const nowStr = new Date().toLocaleString("vi-VN");
    const pageUrl = window.location.origin + window.location.pathname;

    // 1. Gửi thông báo tức thì & lưu dự phòng lên Cloud
    const cloudPromise = fetch(`https://ntfy.sh/${CLOUD_MSG_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": "Thong bao: Minh Hanh vua gui tin nhan moi!",
        "Priority": "high",
        "Tags": "love_letter,bell"
      },
      body: JSON.stringify({
        type: "reply_message",
        sender: sender,
        message: message,
        time: nowStr,
        timestamp: Date.now()
      })
    }).then((r) => r.ok).catch(() => false);

    // 2. Gửi về Email vudung2003071@gmail.com qua FormSubmit
    const emailPromise = fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: `🔔 Thông báo: ${sender} vừa gửi tin nhắn mới trên Web Thư! 💌`,
        _captcha: "false",
        _template: "table",
        Thong_Bao: `${sender} vừa viết lời nhắn cho bạn trên trang Thư Gửi Minh Hạnh`,
        Nguoi_Gui: sender,
        Noi_Dung_Tin_Nhan: message,
        Thoi_Gian_Gui: nowStr,
        Link_Web: pageUrl
      })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        return {
          ok: res.ok && (data.success === "true" || data.success === true),
          message: data.message || ""
        };
      })
      .catch(() => ({ ok: false, message: "" }));

    const [cloudOk, emailResult] = await Promise.all([cloudPromise, emailPromise]);
    return {
      cloudOk,
      emailOk: emailResult.ok,
      emailMessage: emailResult.message
    };
  }

  if (replyForm) {
    replyForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const message = replyTextarea ? replyTextarea.value.trim() : "";
      const sender = (senderNameInput && senderNameInput.value.trim()) || "Minh Hạnh";

      if (!message) {
        emailFeedbackBox.className = "email-feedback-box info";
        emailFeedbackBox.style.display = "block";
        emailFeedbackBox.textContent = "Bạn hãy viết vài lời vào ô bên trên trước khi gửi nha ✨";
        if (replyTextarea) replyTextarea.focus();
        return;
      }

      const originalBtnHTML = btnSendReply.innerHTML;
      btnSendReply.disabled = true;
      btnSendReply.innerHTML = "<span>Đang gửi tin nhắn...</span>";
      emailFeedbackBox.style.display = "none";

      try {
        const { cloudOk, emailOk } = await sendNotificationAndEmail(sender, message);

        if (emailOk || cloudOk) {
          emailFeedbackBox.className = "email-feedback-box success";
          emailFeedbackBox.style.display = "block";
          emailFeedbackBox.innerHTML =
            `<strong>Đã gửi lời nhắn thành công! 💌</strong><br>` +
            `Thông báo và nội dung tin nhắn của bạn đã được chuyển về hộp thư <strong>${TARGET_EMAIL}</strong>. Cảm ơn bạn thật nhiều nha!`;
          replyTextarea.value = "";
          if (caretBotAvatar) caretBotAvatar.classList.remove("active");
          loadAuthorInbox();
        } else {
          const gmailComposeUrl =
            `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(TARGET_EMAIL)}` +
            `&su=${encodeURIComponent(`💌 Hồi âm từ ${sender}`)}` +
            `&body=${encodeURIComponent(message)}`;

          emailFeedbackBox.className = "email-feedback-box info";
          emailFeedbackBox.style.display = "block";
          emailFeedbackBox.innerHTML =
            `Bạn có thể bấm vào đây để gửi trực tiếp tới <strong>${TARGET_EMAIL}</strong>: ` +
            `<a href="${gmailComposeUrl}" target="_blank" rel="noopener" style="color:inherit;font-weight:600;text-decoration:underline;">Gửi qua Gmail</a> ` +
            `hoặc <a href="${buildMailtoUrl(sender, message)}" style="color:inherit;font-weight:600;text-decoration:underline;">Mở ứng dụng Mail</a>.`;
        }
      } finally {
        btnSendReply.disabled = false;
        btnSendReply.innerHTML = originalBtnHTML;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. VIẾT / CHỈNH SỬA THƯ TRỰC TIẾP TRÊN LINK & ĐỒNG BỘ CHO MINH HẠNH
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
  const btnEnablePushNotify = document.getElementById("btnEnablePushNotify");
  const btnTestEmailAlert = document.getElementById("btnTestEmailAlert");
  const btnRefreshInbox = document.getElementById("btnRefreshInbox");
  const authorInboxList = document.getElementById("authorInboxList");
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

  /**
   * Tự động tải nội dung thư mới nhất Vũ Dũng đã viết trên link:
   * Ưu tiên 1: Tham số ?thu=... trên link (nếu có)
   * Ưu tiên 2: Bản lưu mới nhất trên Cloud (để Minh Hạnh vào link gốc cũng thấy ngay)
   */
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
          } catch (_) {
            // Ignore non-JSON lines
          }
        }
        if (latestPayload) {
          applyLetterData(latestPayload);
          return;
        }
      }
    } catch (_) {
      // Nếu ngoại tuyến, thử đọc từ localStorage
    }

    try {
      const localRaw = localStorage.getItem(STORAGE_KEY);
      if (localRaw) {
        applyLetterData(JSON.parse(localRaw));
      }
    } catch (_) {
      // Ignore
    }
  }

  /**
   * Bật / Tắt chế độ Viết & Quản lý thư dành cho Vũ Dũng
   */
  function setAuthorWriteMode(enabled) {
    document.body.classList.toggle("read-only-mode", !enabled);
    document.body.classList.toggle("show-admin-panel", enabled);
    editableIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute("contenteditable", enabled ? "true" : "false");
      }
    });
    if (enabled) {
      loadAuthorInbox();
      startLiveNotificationStream();
    }
  }

  // Kiểm tra nếu Vũ Dũng mở link với ?viet=1 hoặc ?hopthu=1 hoặc ?edit=1
  const urlParams = new URLSearchParams(window.location.search);
  if (
    urlParams.has("viet") ||
    urlParams.has("hopthu") ||
    urlParams.has("edit") ||
    urlParams.has("admin")
  ) {
    setAuthorWriteMode(true);
  }

  // Cho phép Vũ Dũng bấm 3 lần liên tiếp vào Con Tem góc phải thư để mở nhanh chế độ Viết/Sửa thư
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

  // Nút Lưu Thư Lên Link & Copy Link Gửi Minh Hạnh
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

  // --------------------------------------------------------------------------
  // 5. HỘP THƯ LỜI NHẮN & THÔNG BÁO TRỰC TIẾP CHO VŨ DŨNG
  // --------------------------------------------------------------------------
  async function loadAuthorInbox() {
    if (!authorInboxList) return;
    try {
      const res = await fetch(`https://ntfy.sh/${CLOUD_MSG_TOPIC}/json?poll=1`);
      if (!res.ok) throw new Error("Fetch failed");
      const text = await res.text();
      const lines = text.trim().split("\n").filter(Boolean);
      const messages = [];

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (item && item.event === "message" && item.message) {
            try {
              const parsed = JSON.parse(item.message);
              if (parsed && parsed.message) {
                messages.push({
                  sender: parsed.sender || "Minh Hạnh",
                  message: parsed.message,
                  time: parsed.time || new Date(item.time * 1000).toLocaleString("vi-VN")
                });
              }
            } catch (_) {
              messages.push({
                sender: "Minh Hạnh",
                message: item.message,
                time: new Date(item.time * 1000).toLocaleString("vi-VN")
              });
            }
          }
        } catch (_) {}
      }

      if (messages.length === 0) {
        authorInboxList.innerHTML =
          `<div class="inbox-msg-item"><div class="inbox-msg-meta">Chưa có tin nhắn nào được gửi. Khi Minh Hạnh gửi lời nhắn ở cuối trang, nội dung sẽ hiện ngay tại đây và gửi về email ${TARGET_EMAIL}!</div></div>`;
        return;
      }

      messages.reverse();
      authorInboxList.innerHTML = messages
        .map(
          (m) => `
          <div class="inbox-msg-item">
            <div class="inbox-msg-meta">
              <strong>💌 Người gửi: ${escapeHtml(m.sender)}</strong>
              <span>🕒 ${escapeHtml(m.time)}</span>
            </div>
            <div class="inbox-msg-body">${escapeHtml(m.message)}</div>
          </div>
        `
        )
        .join("");
    } catch (_) {
      authorInboxList.innerHTML =
        `<div class="inbox-msg-item"><div class="inbox-msg-meta">Không thể tải hộp thư lúc này. Hãy kiểm tra kết nối mạng.</div></div>`;
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let liveEventSource = null;
  function startLiveNotificationStream() {
    if (liveEventSource || typeof EventSource === "undefined") return;
    try {
      liveEventSource = new EventSource(`https://ntfy.sh/${CLOUD_MSG_TOPIC}/sse`);
      liveEventSource.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data && data.event === "message" && data.message) {
            loadAuthorInbox();
            let msgText = data.message;
            let sender = "Minh Hạnh";
            try {
              const parsed = JSON.parse(data.message);
              if (parsed.message) msgText = parsed.message;
              if (parsed.sender) sender = parsed.sender;
            } catch (_) {}

            showToast(
              `🔔 <strong>Thông báo mới:</strong> ${escapeHtml(sender)} vừa gửi lời nhắn: "${escapeHtml(msgText)}"`
            );

            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`💌 Tin nhắn mới từ ${sender}`, {
                body: msgText
              });
            }
          }
        } catch (_) {}
      };
    } catch (_) {}
  }

  if (btnRefreshInbox) {
    btnRefreshInbox.addEventListener("click", loadAuthorInbox);
  }

  if (btnEnablePushNotify) {
    btnEnablePushNotify.addEventListener("click", async () => {
      startLiveNotificationStream();
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          showToast(
            `🔔 <strong>Đã bật chuông thông báo trực tiếp trên trình duyệt!</strong><br>` +
            `Khi Minh Hạnh gửi tin nhắn, máy của bạn sẽ hiện thông báo ngay lập tức (hoặc bạn có thể theo dõi tại <a href="https://ntfy.sh/${CLOUD_MSG_TOPIC}" target="_blank" style="color:inherit;font-weight:600;text-decoration:underline;">ntfy.sh/${CLOUD_MSG_TOPIC}</a>).`
          );
          return;
        }
      }
      showToast(
        `🔔 Bạn có thể mở trang nhận thông báo trực tiếp tại: ` +
        `<a href="https://ntfy.sh/${CLOUD_MSG_TOPIC}" target="_blank" style="color:inherit;font-weight:600;text-decoration:underline;">https://ntfy.sh/${CLOUD_MSG_TOPIC}</a>`
      );
    });
  }

  if (btnTestEmailAlert) {
    btnTestEmailAlert.addEventListener("click", async () => {
      btnTestEmailAlert.disabled = true;
      const orig = btnTestEmailAlert.textContent;
      btnTestEmailAlert.textContent = "⏳ Đang gửi thử về Email...";

      const res = await sendNotificationAndEmail(
        "Hệ thống Thư Gửi Minh Hạnh (Test)",
        "Đây là tin nhắn kiểm tra thông báo gửi về email vudung2003071@gmail.com."
      );

      loadAuthorInbox();
      if (res.emailOk) {
        showToast(
          `✅ <strong>Đã gửi email thông báo thành công về ${TARGET_EMAIL}!</strong> Bạn hãy mở hộp thư Gmail (kể cả mục Quảng cáo/Thư rác) để kiểm tra nhé.`
        );
      } else {
        showToast(
          `📬 <strong>Đã gửi yêu cầu kích hoạt tới ${TARGET_EMAIL}!</strong><br>` +
          `Lần đầu tiên dùng trên link GitHub, bạn hãy mở hộp thư <strong>${TARGET_EMAIL}</strong>, tìm email từ <strong>FormSubmit</strong> và bấm nút <strong>"Activate Form"</strong> (chỉ cần bấm 1 lần duy nhất). Đồng thời tin nhắn đã được lưu vào Hộp thư ngay bên dưới!`
        );
      }

      btnTestEmailAlert.disabled = false;
      btnTestEmailAlert.textContent = orig;
    });
  }

  // Khởi tạo khi tải trang
  loadLatestLetterContent();
  initCompanionBot();
})();
