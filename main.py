from pathlib import Path
import json

TEMPLATES_FOLDER = Path("templates")
MANIFEST = Path("manifest.json")

def fill_manifest(templates):
    with MANIFEST.open("w", encoding="utf-8") as manifest_file:
        json.dump(templates, manifest_file, indent=2)

def create_json():
    templates = []
    for template_path in TEMPLATES_FOLDER.glob("*.png"):
        file_name = template_path.name.split("\\")[0]
        texture_name = capitalize_file_name(file_name)
        template_object = {
            "name": texture_name,
            "file": file_name
        }
        templates.append(template_object)
    return templates

def capitalize_file_name(file_name: str):
    texture_name = file_name.split(".")[0]
    texture_name_parts = texture_name.split("_")
    capitalized_parts = []
    for part in texture_name_parts:
        capitalized_part = part.capitalize()
        capitalized_parts.append(capitalized_part)
    delimiter = " "
    capitalized_texture_name = delimiter.join(capitalized_parts)
    return capitalized_texture_name

def main():
    templates = create_json()
    fill_manifest(templates)

if __name__ == "__main__":
    main()