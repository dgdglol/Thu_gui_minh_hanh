/**
 * ============================================================================
 * THƯ GỬI MINH HẠNH — Interactive Logic
 * 1. Trải nghiệm đọc & viết thư (Đổi màu giấy, font chữ, cỡ chữ, dòng kẻ, lưu tự động)
 * 2. Xuất trang web hoàn chỉnh (1 file HTML duy nhất) để gửi cho Minh Hạnh
 * 3. Con Bot đồng hành:
 *    - 2 phút đầu (120s) vào web: Không nói gì
 *    - Sau đó: Random 1 trong 4 câu -> Hiện 30s -> Ẩn 15s -> Random câu tiếp theo
 * 4. Khung hồi âm:
 *    - Con trỏ gõ chữ đến đâu -> Avatar của con Bot hiện ra và đi theo đến đó
 *    - Gửi nội dung hồi âm về email: vudung2003071@gmail.com
 * ============================================================================
 */

(function initThuGuiMinhHanh() {
  "use strict";

  const TARGET_EMAIL = "vudung2003071@gmail.com";
  const STORAGE_KEY = "thu_gui_minh_hanh_data_v1";
  const PREFS_KEY = "thu_gui_minh_hanh_prefs_v1";

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

  /**
   * Chọn ngẫu nhiên 1 câu trong 4 câu (tránh lặp lại ngay câu vừa hiện)
   */
  function pickRandomBotMessage() {
    if (BOT_MESSAGES.length <= 1) return BOT_MESSAGES[0];
    let idx;
    do {
      idx = Math.floor(Math.random() * BOT_MESSAGES.length);
    } while (idx === lastMessageIndex);
    lastMessageIndex = idx;
    return BOT_MESSAGES[idx];
  }

  /**
   * Hiển thị tin nhắn của Bot trong 30 giây, sau đó ẩn 15 giây rồi lặp lại
   */
  function showNextBotMessage() {
    clearTimeout(initialDelayTimer);
    clearTimeout(visibleTimer);
    clearTimeout(hiddenTimer);

    if (!botBubble || !botText || !botDock) return;

    const message = pickRandomBotMessage();

    // Reset hiệu ứng xuất hiện & thanh đếm ngược 30s
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

    // Sau 30 giây -> Ẩn tin nhắn đi
    visibleTimer = setTimeout(() => {
      botBubble.classList.remove("visible");
      botDock.classList.remove("speaking");

      // Ẩn trong 15 giây -> Lại bật ngẫu nhiên câu tiếp theo
      hiddenTimer = setTimeout(() => {
        showNextBotMessage();
      }, MESSAGE_HIDDEN_MS);
    }, MESSAGE_VISIBLE_MS);
  }

  /**
   * Khởi động lịch trình của Bot: Đợi đúng 2 phút đầu mới bắt đầu nói
   */
  function initCompanionBot() {
    clearTimeout(initialDelayTimer);
    initialDelayTimer = setTimeout(() => {
      showNextBotMessage();
    }, INITIAL_SILENT_DELAY_MS);
  }

  // Cho phép bấm trực tiếp vào Avatar Bot ở góc phải dưới để hiện tin nhắn ngay lập tức
  if (botDock) {
    botDock.addEventListener("click", () => {
      showNextBotMessage();
    });
  }

  // Nút xem thử Bot ngay dành cho người viết thư kiểm tra hiệu ứng
  const btnPreviewBotNow = document.getElementById("btnPreviewBotNow");
  if (btnPreviewBotNow) {
    btnPreviewBotNow.addEventListener("click", () => {
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

  /**
   * Tính toán chính xác vị trí (X, Y) của con trỏ văn bản trong textarea
   * và di chuyển Avatar của Bot đến đúng vị trí con trỏ đó.
   */
  function updateCaretBotPosition(isTypingEvent = false) {
    if (!replyTextarea || !caretMirror || !caretBotAvatar) return;

    // Đồng bộ chiều rộng thực tế của textarea sang mirror div
    const computed = window.getComputedStyle(replyTextarea);
    caretMirror.style.width = replyTextarea.clientWidth + "px";
    caretMirror.style.fontFamily = computed.fontFamily;
    caretMirror.style.fontSize = computed.fontSize;
    caretMirror.style.lineHeight = computed.lineHeight;
    caretMirror.style.padding = computed.padding;

    const selectionEnd = replyTextarea.selectionEnd || 0;
    const textBeforeCaret = replyTextarea.value.substring(0, selectionEnd);

    // Gán nội dung trước con trỏ vào mirror div và đặt thẻ đánh dấu vị trí con trỏ
    caretMirror.textContent = textBeforeCaret;
    const caretMarker = document.createElement("span");
    caretMarker.textContent = "\u200b"; // Zero-width space tại đúng điểm con trỏ
    caretMirror.appendChild(caretMarker);

    // Lấy tọa độ tương đối của con trỏ so với khung textarea
    const rawLeft = caretMarker.offsetLeft;
    const rawTop = caretMarker.offsetTop - replyTextarea.scrollTop;

    // Giới hạn tọa độ để Avatar luôn nằm gọn đẹp trong khung nhìn của ô nhập
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
      replyTextarea.addEventListener(evtName, (e) => {
        updateCaretBotPosition(evtName === "input");
        updateMailtoFallbackLink();
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
      // Giữ nhẹ avatar hoặc ẩn đi mượt mà khi rời khỏi ô gõ
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
  // 3. GỬI LỜI NHẮN VỀ EMAIL (vudung2003071@gmail.com)
  // --------------------------------------------------------------------------
  const replyForm = document.getElementById("replyForm");
  const senderNameInput = document.getElementById("senderNameInput");
  const btnSendReply = document.getElementById("btnSendReply");
  const btnMailtoDirect = document.getElementById("btnMailtoDirect");
  const emailFeedbackBox = document.getElementById("emailFeedbackBox");

  function buildMailtoUrl() {
    const sender = (senderNameInput && senderNameInput.value.trim()) || "Minh Hạnh";
    const message = (replyTextarea && replyTextarea.value.trim()) || "";
    const subject = encodeURIComponent(`💌 Hồi âm từ ${sender} (Web Thư Gửi Minh Hạnh)`);
    const body = encodeURIComponent(
      `Người gửi: ${sender}\nThời gian: ${new Date().toLocaleString("vi-VN")}\n\nLời nhắn:\n${message}`
    );
    return `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`;
  }

  function updateMailtoFallbackLink() {
    if (btnMailtoDirect) {
      btnMailtoDirect.href = buildMailtoUrl();
    }
  }

  if (senderNameInput) {
    senderNameInput.addEventListener("input", updateMailtoFallbackLink);
  }
  updateMailtoFallbackLink();

  if (replyForm) {
    replyForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const message = replyTextarea.value.trim();
      const sender = (senderNameInput.value || "").trim() || "Minh Hạnh";

      if (!message) {
        emailFeedbackBox.className = "email-feedback-box info";
        emailFeedbackBox.textContent = "Bạn hãy viết vài lời vào ô bên trên trước khi gửi nha ✨";
        replyTextarea.focus();
        return;
      }

      const originalBtnHTML = btnSendReply.innerHTML;
      btnSendReply.disabled = true;
      btnSendReply.innerHTML = "<span>Đang gói thư gửi đi...</span>";
      emailFeedbackBox.style.display = "none";

      try {
        const response = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            _subject: `💌 Lời nhắn mới từ ${sender} (Web Thư Gửi Minh Hạnh)`,
            Nguoi_Gui: sender,
            Loi_Nhan: message,
            Thoi_Gian: new Date().toLocaleString("vi-VN"),
            _template: "table"
          })
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && (result.success === "true" || result.success === true)) {
          emailFeedbackBox.className = "email-feedback-box success";
          emailFeedbackBox.innerHTML =
            `<strong>Đã gửi lời nhắn thành công! 💌</strong><br>` +
            `Lời nhắn của bạn đã được chuyển về hộp thư <strong>${TARGET_EMAIL}</strong>. Cảm ơn bạn thật nhiều nha!`;
          replyTextarea.value = "";
          caretBotAvatar.classList.remove("active");
          updateMailtoFallbackLink();
        } else {
          // Trường hợp lần đầu cần kích hoạt FormSubmit hoặc mở trực tiếp trình gửi mail
          const gmailComposeUrl =
            `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(TARGET_EMAIL)}` +
            `&su=${encodeURIComponent(`💌 Hồi âm từ ${sender}`)}` +
            `&body=${encodeURIComponent(message)}`;

          emailFeedbackBox.className = "email-feedback-box info";
          emailFeedbackBox.innerHTML =
            `Đã chuẩn bị sẵn bức thư hồi âm tới <strong>${TARGET_EMAIL}</strong>! ` +
            `(Nếu đây là lần đầu gửi trên web, chủ hộp thư có thể cần bấm xác nhận kích hoạt trong Gmail, hoặc bạn có thể bấm: ` +
            `<a href="${gmailComposeUrl}" target="_blank" rel="noopener" style="color:inherit;font-weight:600;text-decoration:underline;">Gửi ngay qua Gmail</a> ` +
            `hoặc <a href="${buildMailtoUrl()}" style="color:inherit;font-weight:600;text-decoration:underline;">Mở ứng dụng Mail</a>).`;
        }
      } catch (err) {
        const gmailComposeUrl =
          `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(TARGET_EMAIL)}` +
          `&su=${encodeURIComponent(`💌 Hồi âm từ ${sender}`)}` +
          `&body=${encodeURIComponent(message)}`;

        emailFeedbackBox.className = "email-feedback-box info";
        emailFeedbackBox.innerHTML =
          `Bạn có thể gửi trực tiếp lời nhắn này tới <strong>${TARGET_EMAIL}</strong> bằng 1 cú nhấp: ` +
          `<a href="${gmailComposeUrl}" target="_blank" rel="noopener" style="color:inherit;font-weight:600;text-decoration:underline;">Gửi qua Gmail Web</a> ` +
          `hoặc <a href="${buildMailtoUrl()}" style="color:inherit;font-weight:600;text-decoration:underline;">Mở ứng dụng Email</a>.`;
      } finally {
        btnSendReply.disabled = false;
        btnSendReply.innerHTML = originalBtnHTML;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. LƯU TỰ ĐỘNG NỘI DUNG THƯ & CHẾ ĐỘ VIẾT / ĐỌC THƯ
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

  const saveStatusBadge = document.getElementById("saveStatusBadge");
  const letterStatsText = document.getElementById("letterStatsText");
  const btnToggleMode = document.getElementById("btnToggleMode");
  const btnClearLetter = document.getElementById("btnClearLetter");
  const btnExportLetter = document.getElementById("btnExportLetter");

  function updateWordCount() {
    const bodyEl = document.getElementById("letterBody");
    if (!bodyEl || !letterStatsText) return;
    const text = (bodyEl.innerText || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const readMin = Math.max(1, Math.ceil(words / 180));
    letterStatsText.textContent = `Độ dài: ${words} từ (~${readMin} phút đọc) • Bấm trực tiếp vào trang giấy để chỉnh sửa nội dung thư.`;
  }

  function saveLetterToStorage() {
    if (document.body.classList.contains("locked-export")) return;
    const data = {};
    editableIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        data[id] = el.innerHTML;
      }
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (saveStatusBadge) {
        saveStatusBadge.textContent = "✓ Đã tự động lưu";
      }
    } catch (e) {
      // Ignore storage quota errors
    }
    updateWordCount();
  }

  function loadLetterFromStorage() {
    if (document.body.classList.contains("locked-export")) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        updateWordCount();
        return;
      }
      const data = JSON.parse(raw);
      editableIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && typeof data[id] === "string") {
          el.innerHTML = data[id];
        }
      });
    } catch (e) {
      // Ignore malformed storage
    }
    updateWordCount();
  }

  editableIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", saveLetterToStorage);
    }
  });

  // Chuyển đổi giữa chế độ Viết thư và chế độ Xem như Minh Hạnh
  function setReadOnlyMode(isReadOnly) {
    document.body.classList.toggle("read-only-mode", isReadOnly);
    editableIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute("contenteditable", isReadOnly ? "false" : "true");
      }
    });
    if (btnToggleMode) {
      btnToggleMode.textContent = isReadOnly ? "✍️ Chỉnh sửa thư" : "👁️ Xem như Minh Hạnh";
      btnToggleMode.classList.toggle("active", isReadOnly);
    }
  }

  if (btnToggleMode) {
    btnToggleMode.addEventListener("click", () => {
      const currentlyReadOnly = document.body.classList.contains("read-only-mode");
      setReadOnlyMode(!currentlyReadOnly);
    });
  }

  if (btnClearLetter) {
    btnClearLetter.addEventListener("click", () => {
      const bodyEl = document.getElementById("letterBody");
      if (bodyEl) {
        bodyEl.innerHTML = "<p>Hãy bắt đầu viết những dòng tâm sự gửi Minh Hạnh tại đây...</p>";
        bodyEl.focus();
        saveLetterToStorage();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. TÙY CHỈNH GIAO DIỆN ĐỌC (Màu nền giấy, Font chữ, Cỡ chữ, Dòng kẻ)
  // --------------------------------------------------------------------------
  const themeButtons = document.querySelectorAll("[data-set-theme]");
  const fontSelector = document.getElementById("fontSelector");
  const btnFontDec = document.getElementById("btnFontDec");
  const btnFontInc = document.getElementById("btnFontInc");
  const btnToggleLines = document.getElementById("btnToggleLines");
  const letterBodyContainer = document.getElementById("letterBodyContainer");

  let currentFontSizeRem = 1.15;

  function applyFontSize(rem) {
    currentFontSizeRem = Math.min(1.6, Math.max(0.95, Number(rem.toFixed(2))));
    const lineHeightRem = Number((currentFontSizeRem * 1.82).toFixed(2));
    document.documentElement.style.setProperty("--letter-font-size", `${currentFontSizeRem}rem`);
    document.documentElement.style.setProperty("--letter-line-height", `${lineHeightRem}rem`);
  }

  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-set-theme");
      document.body.setAttribute("data-theme", theme);
      themeButtons.forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  if (fontSelector) {
    fontSelector.addEventListener("change", () => {
      document.body.setAttribute("data-font", fontSelector.value);
    });
  }

  if (btnFontDec) {
    btnFontDec.addEventListener("click", () => applyFontSize(currentFontSizeRem - 0.08));
  }

  if (btnFontInc) {
    btnFontInc.addEventListener("click", () => applyFontSize(currentFontSizeRem + 0.08));
  }

  if (btnToggleLines && letterBodyContainer) {
    btnToggleLines.addEventListener("click", () => {
      letterBodyContainer.classList.toggle("lined-paper");
      btnToggleLines.classList.toggle(
        "active",
        letterBodyContainer.classList.contains("lined-paper")
      );
    });
  }

  // --------------------------------------------------------------------------
  // 6. XUẤT FILE WEB HOÀN CHỈNH ĐỂ GỬI CHO MINH HẠNH (1 File HTML Duy Nhất)
  // --------------------------------------------------------------------------
  if (btnExportLetter) {
    btnExportLetter.addEventListener("click", async () => {
      saveLetterToStorage();

      try {
        let cssText = "";
        try {
          const cssRes = await fetch("styles.css");
          if (cssRes.ok) cssText = await cssRes.text();
        } catch (_) {
          // Khi mở trực tiếp bằng file://, giữ nguyên link hoặc đọc từ styleSheets nếu có thể
        }

        const jsText = `(${initThuGuiMinhHanh.toString()})();`;

        const cloneDoc = document.documentElement.cloneNode(true);
        const cloneBody = cloneDoc.querySelector("body");
        cloneBody.classList.add("read-only-mode", "locked-export");

        // Khóa chỉnh sửa nội dung bức thư trên bản gửi cho Minh Hạnh
        editableIds.forEach((id) => {
          const el = cloneDoc.querySelector(`#${id}`);
          if (el) el.setAttribute("contenteditable", "false");
        });

        // Ẩn nút chuyển chế độ viết thư và thanh công cụ viết thư
        const modeBtn = cloneDoc.querySelector("#btnToggleMode");
        if (modeBtn) modeBtn.remove();
        const writerBar = cloneDoc.querySelector("#writerToolbar");
        if (writerBar) writerBar.remove();

        // Nhúng trực tiếp CSS và JS vào file HTML độc lập
        const linkEl = cloneDoc.querySelector('link[href="styles.css"]');
        const hasEmbeddedStyle = cloneDoc.querySelector("#embeddedStyles");
        if (linkEl) {
          if (hasEmbeddedStyle) {
            linkEl.remove();
          } else if (cssText) {
            const styleEl = document.createElement("style");
            styleEl.textContent = cssText;
            linkEl.replaceWith(styleEl);
          }
        }

        const scriptEl = cloneDoc.querySelector('script[src="script.js"]');
        if (scriptEl) {
          const inlineScript = document.createElement("script");
          inlineScript.textContent = jsText;
          scriptEl.replaceWith(inlineScript);
        }

        const finalHtml = "<!DOCTYPE html>\n" + cloneDoc.outerHTML;

        // Nếu đang chạy qua server cục bộ, tự động lưu luôn file Thu_Gui_Minh_Hanh.html vào thư mục dự án
        try {
          await fetch("/api/save-export", {
            method: "POST",
            headers: { "Content-Type": "text/html;charset=utf-8" },
            body: finalHtml
          });
        } catch (_) {
          // Bỏ qua nếu mở trực tiếp bằng file://
        }

        const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "Thu_Gui_Minh_Hanh.html";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("Bạn có thể nhấn Ctrl+S để lưu trang hoặc gửi trực tiếp thư mục web này!");
      }
    });
  }

  // Khởi tạo khi tải trang
  loadLetterFromStorage();
  initCompanionBot();
})();
