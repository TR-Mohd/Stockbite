import os

file_path = r"c:\Users\JC\Desktop\stockbite-workspace\worktrees\mohammed\frontend\src\styles\manager\OrderHistory.module.css"

with open(file_path, "r") as f:
    content = f.read()

replacements = {
    "var(--text-primary)": "var(--color-text-primary)",
    "var(--text-secondary)": "var(--color-text-secondary)",
    "var(--bg-surface)": "var(--color-bg-surface)",
    "var(--bg-body)": "var(--color-bg-base)",
    "var(--border-color)": "var(--color-border)",
    "var(--brand-primary)": "var(--color-primary)"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, "w") as f:
    f.write(content)
print("CSS Variables Fixed!")
