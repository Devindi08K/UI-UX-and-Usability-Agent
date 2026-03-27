# ui_usability_agent/main.py

import json
import os
from generator.ui_generator import generate_ui
from input_normalizer import normalize_input
from screen_planner import plan_screens, screens_to_requirements, save_screen_plan

import json
import os
import argparse
import shutil
from generator.ui_generator import generate_ui
from input_normalizer import normalize_input
from screen_planner import plan_screens, screens_to_requirements, save_screen_plan

def run_planning_phase():
    """
    Loads requirements, normalizes them, and generates the screen plan.
    Also cleans up old generated screens.
    """
    print("Starting screen planning phase...")

    # 1. Clean up old generated screens to avoid confusion
    output_dir = "outputs/generated_screens"
    if os.path.exists(output_dir):
        print(f"[main] Cleaning up old screens in {output_dir}...")
        shutil.rmtree(output_dir)

    # 2. Load raw requirements
    requirements_path = "samples/sample_requirements.json"
    print(f"\n[main] Loading requirements from: {requirements_path}")
    try:
        with open(requirements_path, "r", encoding="utf-8") as f:
            raw_requirements = json.load(f)
    except FileNotFoundError:
        print(f"\n[main] Error: Requirements file not found at {requirements_path}")
        print("Please ensure the file exists and contains your system requirements.")
        return

    # 3. Normalize the input
    print("[main] Normalizing inputs...")
    normalized_requirements = normalize_input(raw_requirements)

    # 4. Plan all the screens
    print("[main] Planning screens with LLM...")
    screens = plan_screens(normalized_requirements)
    
    if not screens:
        print("\n[main] Halting: No screens were planned. Check screen_planner.py logs for errors.")
        return
        
    save_screen_plan(screens)
    print("\nPlanning complete. You can now generate individual screens using:")
    print("python main.py --generate <screen_number_or_id>")


def run_generation_phase(screen_identifier: str):
    """
    Generates the UI for a single, specified screen by ID or by number.
    """
    print(f"Starting generation for screen: '{screen_identifier}'...")

    # 1. Load the existing screen plan
    plan_path = "outputs/screen_plan.json"
    print(f"\n[main] Loading screen plan from: {plan_path}")
    try:
        with open(plan_path, "r", encoding="utf-8") as f:
            screens = json.load(f)
    except FileNotFoundError:
        print(f"\n[main] Error: Screen plan not found at {plan_path}")
        print("Please run the planning phase first with: python main.py --plan")
        return

    # 2. Find the specific screen to generate by number or by ID
    target_screen = None
    if screen_identifier.isdigit():
        try:
            screen_index = int(screen_identifier) - 1
            if 0 <= screen_index < len(screens):
                target_screen = screens[screen_index]
            else:
                print(f"\n[main] Error: Invalid screen number '{screen_identifier}'. Please choose a number between 1 and {len(screens)}.")
                return
        except (ValueError, IndexError):
            pass # Fallback to searching by ID
            
    if not target_screen:
        target_screen = next((s for s in screens if s.get("screen_id") == screen_identifier), None)

    if not target_screen:
        print(f"\n[main] Error: Screen '{screen_identifier}' not found in the screen plan.")
        print("Available screens (use number or ID):")
        for i, s in enumerate(screens, 1):
            print(f"  {i}. {s.get('screen_id')}")
        return

    # 3. Load the base requirements to get full context
    requirements_path = "samples/sample_requirements.json"
    with open(requirements_path, "r", encoding="utf-8") as f:
        raw_requirements = json.load(f)
    normalized_requirements = normalize_input(raw_requirements)

    # 4. Prepare the requirements for just this one screen
    per_screen_reqs = screens_to_requirements([target_screen], normalized_requirements)
    
    if not per_screen_reqs:
        print("\n[main] Error: Could not prepare requirements for the selected screen.")
        return
        
    screen_req = per_screen_reqs[0]
    screen_id = screen_req.get("screen_id", "unknown_screen")
    screen_name = screen_req.get("screen_name", "Unknown Screen")

    # 5. Generate the UI
    print(f"\n[main] Generating UI for '{screen_name}' ({screen_id})...")
    generated_html = generate_ui(screen_req)

    # 6. Save the generated HTML
    output_dir = "outputs/generated_screens"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{screen_id}.html")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(generated_html)

    print("\nGeneration complete!")
    print(f"Generated file: {output_path}")


def main():
    """
    Main entry point to handle command-line arguments for planning and generation.
    """
    parser = argparse.ArgumentParser(description="UI Generation and Planning Tool")
    parser.add_argument(
        '--plan',
        action='store_true',
        help="Run the screen planning phase. Creates outputs/screen_plan.json."
    )
    parser.add_argument(
        '--generate',
        type=str,
        metavar='SCREEN_ID',
        help="Run the generation phase for a specific screen ID from the plan."
    )

    args = parser.parse_args()

    if args.plan:
        run_planning_phase()
    elif args.generate:
        run_generation_phase(args.generate)
    else:
        parser.print_help()
        print("\nExample Usage:")
        print("1. Plan all screens: python main.py --plan")
        print("2. Generate a single screen: python main.py --generate login")


if __name__ == "__main__":
    main()





