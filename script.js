/**
 * ============================================================================
 * THƯ GỬI MINH HẠNH — Interactive Logic
 * - Giao diện cố định ở chế độ đọc thư (Xem như Minh Hạnh).
 * - Con Bot đồng hành ở góc dưới bên phải:
 *   + 2 phút đầu (120s) vào web: Không nói gì
 *   + Sau đó: Random 1 trong 4 câu -> Hiện 30s -> Ẩn 15s -> Random câu tiếp theo
 * ============================================================================
 */

(function initThuGuiMinhHanh() {
  "use strict";

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

  initCompanionBot();
})();
