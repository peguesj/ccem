# Docker Socket Repair

CCEM includes a built-in Docker socket repair utility (`/docksock`) that automatically diagnoses and fixes broken Docker Desktop socket connections on macOS.

## The Problem

Docker Desktop on macOS uses the `desktop-linux` context, which expects a socket at `~/.docker/run/docker.sock`. This socket is a symlink to the raw socket inside Docker's container data:

```
~/.docker/run/docker.sock -> ~/Library/Containers/com.docker.docker/Data/docker.raw.sock
```

After a crash or forced quit, this symlink disappears while the raw socket remains valid. The result: `docker info` fails, Docker Desktop UI shows errors, and all Docker commands stop working.

## Symptoms

| What You See | What It Means |
|-------------|---------------|
| `docker info` returns "Cannot connect to the Docker daemon" | Socket symlink missing |
| Docker Desktop shows "Engine running" but containers show "Error" | Socket broken, engine OK |
| Docker Desktop shows "--.-- GB" for disk | VM state corrupted |
| `ls ~/.docker/run/docker.sock` returns "No such file" | Symlink missing |

## Solutions

### Claude Code Skill

```
/docksock                  # Auto-detect and repair
/docksock status           # Check socket health
/docksock repair           # Repair symlink
/docksock restart          # Full Docker restart + repair
/docksock nuke --force     # Factory reset (destructive!)
```

### CCEMAgent Menu

The CCEMAgent menubar app shows Docker socket status:
- **"Docker: OK"** — socket is healthy (dimmed, informational)
- **"Repair Docker Socket"** — socket is broken; click to auto-repair

### CLI

```bash
ccem docksock status       # Check health
ccem docksock repair       # Auto-repair
ccem docksock restart      # Full restart
ccem docksock nuke --force # Factory reset
```

### Manual Fix

If automated tools aren't available:

```bash
# Create the symlink manually
ln -sf ~/Library/Containers/com.docker.docker/Data/docker.raw.sock ~/.docker/run/docker.sock

# Verify
docker info
```

If the raw socket is also missing, restart Docker Desktop first:

```bash
pkill -f "Docker Desktop"
sleep 3
open -a Docker
# Wait ~30 seconds for engine to start, then create symlink
```

## How It Works

1. **Status check**: Verify `~/.docker/run/docker.sock` exists and `docker info` succeeds
2. **Symlink repair**: If missing, symlink from `~/Library/Containers/com.docker.docker/Data/docker.raw.sock`
3. **Docker restart**: If raw socket is also missing, kill Docker processes, relaunch, wait for raw socket, then symlink
4. **Validation**: Confirm `docker info` succeeds after repair

## Switches

| Switch | Description |
|--------|-------------|
| `--force` | Skip confirmation prompts (required for `nuke`) |
| `--verbose` | Show diagnostic paths, process IDs, timing |
| `--no-restart` | Only create symlink, don't restart Docker |
