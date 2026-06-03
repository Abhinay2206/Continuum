import os
import shutil
import stat
from git import Repo
from core.config import settings

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

class IngestionService:
    IGNORED_DIRS = {'.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '__pycache__', 'venv', '.venv'}
    IGNORED_EXTENSIONS = {'.pyc', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3'}

    def get_repo_path(self, repo_id: str) -> str:
        return os.path.join(settings.workspace_dir, repo_id)

    def clone_repository(self, github_url: str, repo_id: str) -> str:
        repo_path = self.get_repo_path(repo_id)

        # Always ensure the parent workspace directory exists first
        os.makedirs(settings.workspace_dir, exist_ok=True)

        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, onerror=remove_readonly)

        os.makedirs(repo_path, exist_ok=True)

        Repo.clone_from(github_url, repo_path)
        return repo_path

    def delete_repository(self, repo_id: str):
        repo_path = self.get_repo_path(repo_id)
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, onerror=remove_readonly)

    def get_file_language(self, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        mapping = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.c': 'c',
            '.cpp': 'cpp',
            '.cs': 'csharp',
            '.rb': 'ruby',
            '.php': 'php',
            '.html': 'html',
            '.css': 'css',
            '.md': 'markdown',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml'
        }
        return mapping.get(ext, 'unknown')

    def traverse_repository(self, repo_id: str) -> list[dict]:
        repo_path = self.get_repo_path(repo_id)
        files_data = []

        for root, dirs, files in os.walk(repo_path):
            # Mutate dirs in-place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in self.IGNORED_DIRS]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in self.IGNORED_EXTENSIONS:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_path)
                
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Skip extremely large files or empty files
                    if not content.strip() or len(content) > 1000000:
                        continue
                        
                    files_data.append({
                        "filePath": rel_path,
                        "language": self.get_file_language(file),
                        "content": content,
                        "size": len(content)
                    })
                except UnicodeDecodeError:
                    # Skip binary files that don't match ignored extensions
                    continue
                except Exception as e:
                    print(f"Error reading {rel_path}: {e}")

        return files_data

ingestion_service = IngestionService()
