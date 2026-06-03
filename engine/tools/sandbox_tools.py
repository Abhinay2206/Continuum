from langchain_core.tools import tool
from workspaces.sandbox_manager import sandbox_manager

def get_active_repo_id() -> str:
    # This is a stub. In a real system, the repo_id context would be passed 
    # through the LangChain agent's runtime context.
    # For now we'll assume there's one active sandbox or use the first one.
    keys = list(sandbox_manager.active_sandboxes.keys())
    return keys[0] if keys else None

@tool
def execute_sandbox_command(command: str) -> str:
    """Executes a shell command inside the isolated repository sandbox."""
    repo_id = get_active_repo_id()
    if not repo_id:
        return "Error: No active sandbox."
    return sandbox_manager.execute_command(repo_id, command)

@tool
def read_sandbox_file(filepath: str) -> str:
    """Reads a file from the repository sandbox."""
    return execute_sandbox_command(f"cat {filepath}")

@tool
def write_sandbox_file(filepath: str, content: str) -> str:
    """Writes content to a file in the repository sandbox."""
    # Write using a simple python script execution inside the container to avoid shell escaping issues
    import base64
    b64_content = base64.b64encode(content.encode()).decode()
    cmd = f'python3 -c "import base64; open(\'{filepath}\', \'w\').write(base64.b64decode(\'{b64_content}\').decode())"'
    return execute_sandbox_command(cmd)

SANDBOX_TOOLS = [execute_sandbox_command, read_sandbox_file, write_sandbox_file]
