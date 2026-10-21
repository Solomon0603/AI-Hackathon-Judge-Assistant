from typing import Optional
import io
from PIL import Image

from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from google import genai
import pymupdf as fitz
import os

app = FastAPI()

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
def extract_text(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "".join(page.get_text() for page in doc)


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/analyze")
async def analyze(
    description: str = Form(...),
    image: Optional[UploadFile] = File(None),
    pdf: Optional[UploadFile] = File(None)
):
    try:

        pdf_text = ""
        if pdf is not None and getattr(pdf, "filename", None):
            pdf_bytes = await pdf.read()
            if pdf_bytes:
                pdf_text = extract_text(pdf_bytes)

        prompt = f"""
You are an experienced hackathon judge.

Evaluate the following project.

Return:

Innovation Score (1-10)
Technical Execution Score (1-10)
Clarity Score (1-10)
Impact Score (1-10)

Then give a short feedback paragraph.

Project Description:
{description}
"""

        if pdf_text:
            prompt += f"""\nProject Document:\n{pdf_text[:2000]}\n"""

        contents = [prompt]

        if image is not None and getattr(image, "filename", None):
            image_bytes = await image.read()
            if image_bytes:
                img_obj = Image.open(io.BytesIO(image_bytes))
                contents.append(img_obj)

        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=contents
        )

        result_text = response.text

        return {"result": result_text}

    except Exception as e:
        print("ERROR:", e)
        return {"result": "AI judge failed to analyze the project."}