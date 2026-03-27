import json
import os
from typing import List,Dict
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables and validate API key
load_dotenv()
if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY not found in .env file. Please add it.")

SCREEN_PLANNER_PROMPT = """You are a senior software architect. 
Given a system description and its requirements, your job is to identify ALL the screens/pages that need to be built for this system.

For each screen, output:
- screen_id: short unique identifier (e.g., "login", "product_list")
- screen_name: human readable name (e.g., "User Login")
- screen_type: "auth" | "form" | "dashboard" | "list" | "detail" | "full-page"
- user_role: who uses this screen (e.g., "Customer", "Admin", "Unauthenticated User")
- purpose: one sentence describing what this screen does
- key_actions: list of things the user can DO on this screen
- relevant_frs: which FR IDs from the requirements are needed for this screen
- depends_on: which screen_id this screen links from (if any)
- priority: "High" | "Medium" | "Low" — build High priority screens first

Output ONLY a valid JSON array. No explanations. No markdown. Start directly with [

System description and requirements:
{system_input}
"""
def _clean_llm_output(raw_output: str) -> str:
    """Remove markdown code blocks and other common LLM artifacts."""
    raw_output = raw_output.strip()
    if raw_output.startswith("```json"):
        raw_output = raw_output[7:]
    if raw_output.startswith("```"):
        raw_output = raw_output[3:]
    if raw_output.endswith("```"):
        raw_output = raw_output[:-3]
    return raw_output.strip()

def plan_screens(system_input: Dict) -> List[Dict]:
    """
    Takes the full system input and returns an ordered list of screens to build.
    """
    llm = ChatGroq(
        model = "llama-3.3-70b-versatile", 
        temperature=0.4,
        max_tokens=4096                  
    )
    prompt = ChatPromptTemplate.from_template(SCREEN_PLANNER_PROMPT)
    chain = prompt | llm | StrOutputParser()
    
    system_input_str = json.dumps(system_input, indent=2)
    
    for attempt in range(3): # Retry up to 3 times
        try:
            raw_output = chain.invoke({"system_input": system_input_str})
            cleaned_output = _clean_llm_output(raw_output)
            screens = json.loads(cleaned_output)
            
            # Sort by priority: High first, then Medium, then Low
            priority_order = {"High": 0, "Medium": 1, "Low": 2}
            screens.sort(key=lambda s: priority_order.get(s.get("priority", "Low"), 2))
            
            return screens
        except json.JSONDecodeError as e:
            print(f"[screen_planner] Warning: Attempt {attempt + 1} failed to parse LLM output. Error: {e}")
            if attempt == 2:
                print("[screen_planner] Error: Failed to get valid JSON from LLM after 3 attempts.")
                return [] # Return empty list on failure
    return []

def screens_to_requirements(screens: List[Dict], base_requirements: Dict) -> List[Dict]:
    """
    Converts the screen plan into a list of per-screen requirement dicts.
    This function creates a lean, focused payload for the UI generator.
    """
    per_screen_reqs = []
    
    # These are high-level NFRs that are almost always relevant to the UI
    globally_relevant_nfr_types = ["Accessibility", "Responsiveness", "Dark Mode", "Usability"]
    all_nfrs = base_requirements.get("non_functional_requirements", [])
    relevant_nfrs = [
        nfr for nfr in all_nfrs 
        if nfr.get("type") in globally_relevant_nfr_types
    ]

    for screen in screens:
        relevant_fr_ids = screen.get("relevant_frs", [])
        all_frs = base_requirements.get("functional_requirements", [])
        
        # ONLY include FRs that the planner explicitly linked to this screen.
        # If the planner was lazy and didn't link any, this list will be empty.
        # This prevents sending the entire project's FRs for every screen.
        screen_specific_frs = [
            fr for fr in all_frs if fr.get("id") in relevant_fr_ids
        ] if relevant_fr_ids else []
        
        # Create a lean payload for the generator.
        # Exclude high-level planning info like design_artifacts and use_cases.
        screen_req = {
            "project_name": base_requirements.get("project_name", "System"),
            "screen_id": screen.get("screen_id"),
            "screen_name": screen.get("screen_name"),
            "screen_type": screen.get("screen_type"),
            "user_role": screen.get("user_role"),
            "purpose": screen.get("purpose"),
            "key_actions": screen.get("key_actions", []),
            "functional_requirements": screen_specific_frs,
            "non_functional_requirements": relevant_nfrs, # Send only the UI-relevant NFRs
        }
        per_screen_reqs.append(screen_req)
    
    return per_screen_reqs

def save_screen_plan(screens: List[Dict], output_path: str = "outputs/screen_plan.json"):
    """Save the screen plan for inspection."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(screens, f, indent=2)
    print(f"\n[main] Screen plan saved to {output_path}")
    print(f"[main] {len(screens)} screens identified:")
    for i, s in enumerate(screens, 1):
        print(f"  {i}. [{s.get('priority','?')}] {s.get('screen_name')} — {s.get('purpose','')}")


