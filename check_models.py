import os
from dotenv import load_dotenv
from google import genai

# .env file se API Key load karega
load_dotenv()

try:
    print("🔄 Connecting to Gemini to fetch model list...\n")
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    # Saare available models ki list print karega
    for m in client.models.list():
        print(f"Model Name: {m.name} | Actions: {m.supported_actions}")
        
except Exception as e:
    print(f"❌ Error occurred while fetching: {str(e)}")