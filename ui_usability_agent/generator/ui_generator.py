# Sends prompt to Groq, gets HTML back
import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

#load secret key from .env file
load_dotenv()

def get_llm():
    """Create and return a ChatGroq instance"""
    return ChatGroq(
        model = "llama-3.1-8b-instant",
        temperature=0.4,                    # 0 = exact, 1 = creative (lower for structured output)
        max_tokens=4096                     #limit response length (increased for complete accessibility notes)

    )

def generate_ui(requirements: dict) -> str:
    """
    Generate HTML UI from software requirements using an LLM.

    Args:
       requirements: A dictionary containing software requirements.

    Returns:
       The generated HTML as a string.
    """
    # Read the enhanced prompt template
    with open("prompts\\generation_prompt.txt", "r", encoding="utf-8") as f:
        prompt_template_string = f.read()

    # Create the prompt template
    prompt_template = ChatPromptTemplate.from_template(
        template=prompt_template_string,
        template_format="jinja2"
    )
    
    # Convert requirements to JSON string for the prompt
    requirements_json_string = json.dumps(requirements, indent=2)

    llm = get_llm()

    chain = prompt_template | llm | StrOutputParser()

    generated_html = chain.invoke({
        "requirements_json": requirements_json_string,
        "screen_name": requirements.get("screen_name", "Untitled Screen")
    })

    return generated_html
    