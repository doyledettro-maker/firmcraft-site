# Hermes agent upgrade

`upgrade-hermes.sh` upgrades a Hermes install to the latest upstream code
without losing the tuned `config.yaml` and without leaving the agent
stuck in the well-known skill-sync mkdir bug.

It is designed to be pipe-able over SSH so we can sweep an entire fleet
in one loop.

## What it does

| Step | Action                          | Detail                                                                                          |
| ---- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1    | Pre-flight checks               | Verifies `docker`, `docker compose`, `git`. Locates the Hermes repo and config.                 |
| 2    | Shows current state             | Version (from `pyproject.toml`), git commit, container status, running image digests.           |
| 3    | Checks upstream                 | `git fetch --all --tags`, compares HEAD against `origin/main` (or `--ref`).                     |
| 4    | Backs up config                 | Copies `~/.hermes/config.yaml` to `~/.hermes/config.yaml.bak-upgrade-<TIMESTAMP>`.               |
| 5    | Stashes local repo edits        | Anything dirty in the repo (e.g. our `docker-compose.yml` SkillCalibrate mount) is stashed.     |
| 6    | Pulls / checks out target ref   | `git pull --ff-only origin main`, or `git checkout <ref>` if `--ref` was supplied.              |
| 7    | Pops the stash                  | Re-applies the local edits on top of the new code.                                              |
| 8    | Rebuilds & restarts             | `docker compose build --pull` then `docker compose up -d`.                                      |
| 9    | Fixes the skill-sync mkdir bug  | Scans early logs for missing skill dirs, pre-creates them under `~/.hermes/skills/`, restarts.  |
| 10   | Verifies config preservation    | Byte-compares the live config against the pre-upgrade backup. Restores automatically if drifted. |
| 11   | Prints summary                  | Old → new version, commit, container status, anything created/restored.                          |

Dry-run mode (no `--apply`) does only steps 1–3 — safe to run anywhere,
including a live production agent.

## Usage

```bash
# Dry-run — show current vs. upstream, exit. No changes.
./upgrade-hermes.sh

# Apply the upgrade (default repo path, default config path):
./upgrade-hermes.sh --apply

# Upgrade to a specific tag or branch instead of origin/main:
./upgrade-hermes.sh --apply --ref v1.4.0
./upgrade-hermes.sh --apply --ref feature/some-branch

# Non-interactive (e.g. when piped over SSH):
./upgrade-hermes.sh --apply --yes

# Override paths (repo not in /opt/flex-pattern/hermes-agent, etc.):
./upgrade-hermes.sh --apply --repo /home/me/hermes-agent --config /home/me/.hermes/config.yaml
```

### Running against a remote client instance

The script is meant to be piped over SSH — no need to copy it to the
target machine first:

```bash
# Dry-run a client's Hermes:
ssh root@CLIENT_IP 'bash -s' < upgrade-hermes.sh

# Apply + restart on a client (non-interactive, safe inside scripts):
ssh root@CLIENT_IP 'bash -s -- --apply --yes' < upgrade-hermes.sh
```

### Fleet sweep

```bash
while read -r ip; do
    echo "=== Upgrading $ip ==="
    ssh root@$ip 'bash -s -- --apply --yes' < upgrade-hermes.sh
done < inventory.txt
```

Each run is independent and idempotent — re-running on an already-upgraded
host is a clean no-op (steps 1–3 confirm parity, steps 4–11 only fire if
HEAD is behind `--ref`).

## The skill-sync mkdir workaround

There is a known bug in current Hermes where the skill-sync worker
expects subdirectories under `~/.hermes/skills/` to exist before it tries
to write into them, but does not `mkdir -p` first. Fresh upgrades that
introduce new skill bundles often trip this — you see lines like:

```
FileNotFoundError: [Errno 2] No such file or directory: '/root/.hermes/skills/<bundle>/<file>.md'
```

in the container logs and the agent loses access to those skills until
you create the dir by hand and restart.

After `docker compose up -d` the script:

1. Sleeps 10s so the initial skill sync has time to run and fail.
2. Reads `docker compose logs --since 30s` and greps for
   `No such file or directory` paths mentioning `.hermes/skills/`.
3. Strips the container-side prefix (`/root/.hermes/skills/...`) and
   maps it to the host bind-mount (`~/.hermes/skills/...`).
4. `mkdir -p`s the parent directory of each missing file.
5. `docker compose restart`s once so the worker picks them up.

The fix is silent if no failures are detected. Pass `--skip-skill-fix`
to disable it once upstream finally ships the `mkdir -p`.

## Config preservation guarantees

This is the single most important property of the script. Client agents
have hand-tuned configs (compression model, cache TTL, threshold —
applied by `optimize-hermes-config.sh`) that must survive every upgrade.

1. Before any change is made, `~/.hermes/config.yaml` is copied to a
   timestamped backup in the same directory.
2. After the rebuild + restart cycle, the live config is byte-compared
   against that backup with `cmp -s`.
3. If they differ (because an upgrade shipped a new bundled config that
   clobbered the user's, or anything else), the script:
   - Prints a unified diff of what changed.
   - Copies the backup back over the live file.
   - `docker compose restart`s to make the restore active.

So the worst case is "upgraded, then immediately restored your tuned
config" — not "silently lost your tuned config".

## What gets backed up, and where

| File                             | Backup location                                        |
| -------------------------------- | ------------------------------------------------------ |
| `~/.hermes/config.yaml`          | `~/.hermes/config.yaml.bak-upgrade-<YYYYMMDD-HHMMSS>`  |
| Local repo edits (if any)        | `git stash` entry tagged `upgrade-hermes <TIMESTAMP>`  |

Backups are **not** auto-deleted — keep them around until you've watched
the agent run for a day or two, then `rm` the old ones manually.

## Rollback

If something goes wrong, rollback is two steps — code, then config:

```bash
# 1. Roll the repo back to the pre-upgrade commit (the script printed
#    the old commit hash in its 'upgraded:' summary):
cd /opt/flex-pattern/hermes-agent
git checkout <OLD_COMMIT_HASH>
docker compose build --pull
docker compose up -d

# 2. (Only if step 11 reported a config restore failed, or you tuned
#    the new config before noticing the problem.) Restore the backup:
cp ~/.hermes/config.yaml.bak-upgrade-<TIMESTAMP> ~/.hermes/config.yaml
docker compose restart
```

If you stashed local edits and the pop conflicted, they're still safe in
`git stash list` — resolve and `git stash drop` once happy.

## Safety / idempotency

- Dry-run is the default; you have to pass `--apply` to change anything.
- Pre-flight checks fail fast if docker / compose / git is missing, or
  the repo path isn't a git repo with a remote.
- If HEAD already matches the target ref, the script exits cleanly
  without rebuilding (unless you explicitly pass `--apply`, in which
  case it will rebuild + restart to refresh container state).
- All log output is captured and indented, so SSH-piped output stays
  readable when you're sweeping a fleet.
- Output is colored on a TTY and plain on a pipe, so it logs cleanly
  into a transcript file.
