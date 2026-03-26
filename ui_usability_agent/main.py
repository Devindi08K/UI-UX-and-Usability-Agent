# Entry point - runs the full pipeline

import json 
from generator.ui_generator import generate_ui

def main():
    """
    Main function to run the UI generation and evaluation pipeline.
    """
    print("Starting UI generation process...")

    # 1. Load requirements from the sample JSON file
    requirements_path = "samples/sample_requirements.json"
    print(f"Loading requirements from: {requirements_path}")
    with open(requirements_path, "r", encoding="utf-8") as f:
        requirements = json.load(f)

    # 2. Generate the UI
    print("Generating UI with the LLM...")
    generated_html = generate_ui(requirements)

    # 3. Save the generated HTML to a file
    output_path = "outputs/generated_ui.html"
    print(f"Saving generated UI to: {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(generated_html)

    print("\nUI generation complete!")
    print(f"You can view the output file at: {output_path}")


if __name__ == "__main__":
    main()




