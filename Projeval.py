<<<<<<< HEAD
import gradio as gr
import fitz
import os
from PIL import Image
from google import genai

client = genai.Client(api_key=os.getenv("AIzaSyAoXnAryA0rXBCgaCxP8q3L1BULQUZqrJw"))

def extract_text_from_pdf(pdf_file):
    pdf_bytes = pdf_file.read()
    document = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in document:
        text += page.get_text()
    return text.strip()

def analyze_submission(project_description, project_screenshot, project_pdf):

    if not project_description or project_screenshot is None or project_pdf is None:
        return "Please upload all inputs."

    pdf_text = extract_text_from_pdf(project_pdf)

    prompt = f"""
You are a hackathon judge.

Give:
1. Innovation score (1–10)
2. Technical Execution score (1–10)
3. Short constructive feedback

Project Description:
{project_description}

PDF Content:
{pdf_text[:4000]}
"""

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[prompt, project_screenshot]
        )

        return response.text

    except Exception as e:
        return f"Error: {e}"

# UI
with gr.Blocks() as demo:
    gr.Markdown("# 🤖 AI Hackathon Judge Assistant")

    desc = gr.Textbox(label="Project Description")
    img = gr.Image(type="pil", label="Screenshot")
    pdf = gr.File(label="Project PDF")

    btn = gr.Button("Analyze")

    output = gr.Textbox(lines=25, label="Evaluation Report")

    btn.click(analyze_submission, inputs=[desc, img, pdf], outputs=output)

=======
import gradio as gr
import fitz
import os
from PIL import Image
from google import genai

client = genai.Client(api_key=os.getenv("AIzaSyAoXnAryA0rXBCgaCxP8q3L1BULQUZqrJw"))

def extract_text_from_pdf(pdf_file):
    pdf_bytes = pdf_file.read()
    document = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in document:
        text += page.get_text()
    return text.strip()

def analyze_submission(project_description, project_screenshot, project_pdf):

    if not project_description or project_screenshot is None or project_pdf is None:
        return "Please upload all inputs."

    pdf_text = extract_text_from_pdf(project_pdf)

    prompt = f"""
You are a hackathon judge.

Give:
1. Innovation score (1–10)
2. Technical Execution score (1–10)
3. Short constructive feedback

Project Description:
{project_description}

PDF Content:
{pdf_text[:4000]}
"""

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[prompt, project_screenshot]
        )

        return response.text

    except Exception as e:
        return f"Error: {e}"

# UI
with gr.Blocks() as demo:
    gr.Markdown("# 🤖 AI Hackathon Judge Assistant")

    desc = gr.Textbox(label="Project Description")
    img = gr.Image(type="pil", label="Screenshot")
    pdf = gr.File(label="Project PDF")

    btn = gr.Button("Analyze")

    output = gr.Textbox(lines=25, label="Evaluation Report")

    btn.click(analyze_submission, inputs=[desc, img, pdf], outputs=output)

>>>>>>> 60ead122dba0062753cb648c063e5211bce9b90b
demo.launch()