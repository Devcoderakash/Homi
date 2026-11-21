"""Build a source-only handoff ZIP. Never include runtime secrets, database dumps or private uploads."""
from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parents[1]
root_files = [
    "package.json",
    ".env.example",
    "README.md",
    "SETUP-HINDI.md",
    "compose.yaml",
    ".dockerignore",
    ".gitignore",
]
files = [root / name for name in root_files if (root / name).is_file()]

# Include backend, frontends, scripts, docs
for folder in ["backend", "frontend/customer-app", "frontend/admin-panel", "scripts", "docs"]:
    dir_path = root / folder
    if not dir_path.is_dir():
        continue
    for path in dir_path.rglob("*"):
        if (
            path.is_file()
            and not path.is_symlink()
            and "__pycache__" not in path.parts
            and "node_modules" not in path.parts
            and ".next" not in path.parts
            and "bin" not in path.parts
            and path.suffix not in [".pyc", ".log", ".exe"]
            and not (path.name.startswith(".env") and path.name != ".env.example")
        ):
            files.append(path)

output = root / "public/downloads"
output.mkdir(parents=True, exist_ok=True)
archive = output / "homi-source.zip"

with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
    for path in sorted(set(files)):
        bundle.write(path, arcname="homi/" + path.relative_to(root).as_posix())

with zipfile.ZipFile(archive) as bundle:
    names = bundle.namelist()
    assert "homi/backend/cmd/api/main.go" in names
    assert "homi/frontend/customer-app/package.json" in names
    assert "homi/frontend/admin-panel/package.json" in names
    assert "homi/SETUP-HINDI.md" in names
    assert not any(
        name.endswith("/.env")
        or "node_modules/" in name
        or "/.next/" in name
        or "/bin/" in name
        or name.endswith(".sql")
        for name in names
    )
    assert bundle.testzip() is None

checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / "homi-source.sha256").write_text(checksum + "  homi-source.zip\n")
print(f"Packaged {len(files)} source/configuration files ({archive.stat().st_size:,} bytes). No .env, database data, builds or private uploads included.")
