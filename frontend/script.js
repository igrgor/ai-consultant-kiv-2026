let thinkingMessage = null;

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");
const printBtn = document.getElementById("printBtn");

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = text;

  message.appendChild(bubble);
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showThinking() {
  thinkingMessage = document.createElement("div");
  thinkingMessage.className = "message assistant";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = "AI думает...";

  thinkingMessage.appendChild(bubble);
  chatBox.appendChild(thinkingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeThinking() {
  if (thinkingMessage) {
    thinkingMessage.remove();
    thinkingMessage = null;
  }
}

async function sendMessage() {
  const text = userInput.value.trim();

  if (!text) {
    return;
  }

  addMessage(text, "user");
  userInput.value = "";
  showThinking();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    removeThinking();

    if (!response.ok) {
      throw new Error("Ошибка запроса к серверу");
    }

    const data = await response.json();
    const r = data.result;
    
    console.log("FULL DATA:", data);
    console.log("RESULT:", data.result);

    const clean = (text) =>
      String(text || "")
        .replace(/###\s*\d+\.\s*/g, "")
        .replace(/\*\*/g, "")
        .trim();

    const formatted = `
<div class="ai-answer">
  <div class="ai-main-text">
    ${clean(r.summary)}

    ${clean(r.recommendation)}
  </div>

  <div class="ai-meta">
    <span class="ai-length">Длина текста: ${r.length} символов</span>
    <span class="ai-signature">Ответ сформировал AI-консультант для инженера</span>
  </div>
</div>
`;

    addMessage(formatted, "assistant");
  } catch (error) {
    removeThinking();
    addMessage("Ошибка: не удалось получить ответ от сервера.", "assistant");
  }
}

function resetChat() {
  removeThinking();

    chatBox.innerHTML = `
        <div class="message assistant welcome">
            <div class="bubble">
                <div class="welcome-text">
                    Здравствуйте. Вставьте текст или сообщение для анализа.
                </div>
            </div>
        </div>
    `;

  userInput.value = "";
}

function saveChat() {
  const content = chatBox.innerText;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "ai-consultant-chat.txt";
  a.click();

  URL.revokeObjectURL(url);
}

function printChat() {
  const printWindow = window.open("", "_blank");
  const content = chatBox.innerHTML;

  printWindow.document.write(`
    <html>
      <head>
        <title>AI Consultant - Печать</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            line-height: 1.6;
            color: #111;
          }
          .message {
            margin-bottom: 16px;
          }
          .bubble {
            padding: 12px 14px;
            border: 1px solid #ccc;
            border-radius: 10px;
            white-space: pre-wrap;
          }
          .ai-meta {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            display: flex;
            justify-content: space-between;
            gap: 16px;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

sendBtn.addEventListener("click", sendMessage);
resetBtn.addEventListener("click", resetChat);
saveBtn.addEventListener("click", saveChat);
printBtn.addEventListener("click", printChat);

userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});