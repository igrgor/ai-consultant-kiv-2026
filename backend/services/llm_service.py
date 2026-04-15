import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("DEEPSEEK_API_KEY")
API_URL = "https://api.deepseek.com/v1/chat/completions"


def call_llm(payload: dict, headers: dict) -> dict:
    for attempt in range(2):
        try:
            response = requests.post(
                API_URL,
                headers=headers,
                json=payload,
                timeout=60
            )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            print(f"Таймаут API, попытка {attempt + 1} из 2")

            if attempt < 1:
                time.sleep(2)
                continue

            return {"error": "timeout"}

        except requests.exceptions.RequestException as e:
            print(f"Ошибка запроса к модели: {e}")
            return {"error": f"Ошибка запроса к модели: {str(e)}"}

    return {"error": "Модель не ответила вовремя. Попробуйте ещё раз."}


def analyze_text(text: str) -> dict:
    if not API_KEY:
        return {
            "summary": "Модель не подключена",
            "length": len(text),
            "recommendation": "Добавьте API ключ в .env"
        }

    prompt = f"""
Ты — AI-консультант для инженера.

Проанализируй текст и дай ответ в 3 частях:

1. Краткое резюме
2. Инженерный смысл / практическая ценность
3. Рекомендация к применению

Пиши ясно, структурно, без воды.
Если в тексте мало данных — укажи это прямо.
Не выдумывай факты.

Текст:
{text}
"""

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    data = call_llm(payload, headers)

    if "error" in data:
        return {
            "summary": "Сервис временно не ответил",
            "length": len(text),
            "recommendation": "Попробуйте повторить запрос через несколько секунд"
        }

    try:
        answer = data["choices"][0]["message"]["content"]

        return {
            "summary": answer,
            "length": len(text),
            "recommendation": ""
        }

    except (KeyError, IndexError, TypeError) as e:
        return {
            "summary": "Модель вернула неожиданный формат ответа",
            "length": len(text),
            "recommendation": f"Техническая ошибка обработки ответа: {str(e)}"
        }