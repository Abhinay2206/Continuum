from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from workspaces.sandbox_manager import sandbox_manager
import asyncio
import docker
import socket

router = APIRouter()

@router.websocket("/{repo_id}/terminal")
async def terminal_endpoint(websocket: WebSocket, repo_id: str):
    await websocket.accept()
    
    container = sandbox_manager.get_container(repo_id)
    if not container:
        await websocket.send_text("Error: Sandbox not running.\r\n")
        await websocket.close()
        return

    try:
        # Create an exec instance attached to a tty
        exec_id = container.client.api.exec_create(
            container.id,
            cmd="/bin/bash",
            stdin=True,
            tty=True,
            workdir="/workspace",
        )["Id"]
        
        # Start the exec instance and get the raw socket
        sock = container.client.api.exec_start(exec_id, socket=True, tty=True)._sock
        sock.setblocking(False)

        # Bridge Docker socket to WebSocket
        async def read_from_docker():
            loop = asyncio.get_running_loop()
            while True:
                try:
                    data = await loop.sock_recv(sock, 1024)
                    if not data:
                        break
                    await websocket.send_text(data.decode('utf-8', errors='replace'))
                except Exception as e:
                    break

        async def read_from_ws():
            while True:
                try:
                    data = await websocket.receive_text()
                    loop = asyncio.get_running_loop()
                    await loop.sock_sendall(sock, data.encode('utf-8'))
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    break

        # Run both loops concurrently
        await asyncio.gather(
            read_from_docker(),
            read_from_ws()
        )
    except Exception as e:
        await websocket.send_text(f"Terminal error: {str(e)}\r\n")
    finally:
        try:
            sock.close()
        except:
            pass
        if websocket.client_state.name != "DISCONNECTED":
            await websocket.close()

@router.websocket("/{repo_id}/ai")
async def ai_endpoint(websocket: WebSocket, repo_id: str):
    await websocket.accept()
    # Placeholder for streaming AI orchestrator messages
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await websocket.send_text(f"AI Agent received: {data}")
    except WebSocketDisconnect:
        pass
