"""Local API server for CodeVision AI with Enhanced JSON Parsing."""
import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100_000

# NOTE: fixed - previous origins list had markdown link syntax pasted into
# the Python string ("[http://...](http://...)") which broke CORS matching.
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500"],
        "methods": ["POST"],
    }
})

ALLOWED_LANGUAGES = {"cpp", "python", "java"}
MAX_CODE_CHARACTERS = 30_000

# gemini-3.5-flash is a live, current Gemini model (Gemini 3 series, released
# May 2026). Both "gemini-3.5-flash" and "models/gemini-3.5-flash" are valid
# with the google-genai SDK; keeping the explicit "models/" prefix is fine.
MODEL_NAME = "models/gemini-3.5-flash"

SYSTEM_PROMPT = """
You are CodeVision AI, a strict but encouraging competitive-programming coach.
Review the submitted code for correctness, algorithmic thinking, and constraints.

Non-negotiable rules:
- Never provide a direct code solution, a rewritten solution, or code/pseudocode that reconstructs the solution.
- Teach through conceptual critique, test cases, constraints, and incremental hints.
- Be concise and practical for a competitive programmer.

You MUST return a JSON object strictly matching this format structure:
{
  "logicAnalysis": "Your analysis text here",
  "edgeCases": ["case 1", "case 2"],
  "complexity": {
    "time": "O(N)",
    "space": "O(1)",
    "explanation": "Why this complexity"
  },
  "optimization": ["suggestion 1"],
  "hints": ["hint 1"]
}
Return ONLY the raw JSON object. No markdown code fences, no preamble, no commentary.
""".strip()

REQUIRED_TOP_LEVEL_KEYS = {"logicAnalysis", "edgeCases", "complexity", "optimization"}


def extract_json(raw_text: str) -> dict:
    """Robustly pull a JSON object out of a Gemini response, even if it's
    wrapped in ```json ... ``` fences or has stray text around it."""
    text = raw_text.strip()

    # Fast path: already clean JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip ```json ... ``` or ``` ... ``` fences
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # Fallback: grab the first {...} block (greedy, outermost braces)
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        return json.loads(brace_match.group(0))

    raise json.JSONDecodeError("No JSON object found", text, 0)


@app.post("/api/analyze")
def analyze_code():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="Send a JSON body with code and language."), 400

    code = payload.get("code")
    language = payload.get("language")

    if not isinstance(code, str) or not code.strip():
        return jsonify(error="Code is required."), 400
    if len(code) > MAX_CODE_CHARACTERS:
        return jsonify(error="Code must be at most 30k characters."), 413
    if language not in ALLOWED_LANGUAGES:
        return jsonify(error="Language must be one of: cpp, python, java."), 400

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify(error="Server is missing GEMINI_API_KEY. Add it to .env file."), 500

    raw_text = ""
    try:
        client = genai.Client(api_key=api_key)
        user_content = f"Language: {language}\n\nUser code:\n```{language}\n{code}\n```"

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )

        raw_text = response.text or ""
        parsed_json = extract_json(raw_text)

        missing = REQUIRED_TOP_LEVEL_KEYS - parsed_json.keys()
        if missing:
            return jsonify(error=f"AI response missing keys: {', '.join(sorted(missing))}"), 502

        return jsonify(parsed_json), 200

    except json.JSONDecodeError:
        print(f"⚠️ Raw failed response from Gemini:\n{raw_text}")
        return jsonify(error="The AI returned an invalid response structure. Please retry."), 502
    except Exception as e:
        print(f"⚠️ Gemini client error: {e}")
        return jsonify(error=f"Gemini Client Error: {str(e)}"), 502


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)