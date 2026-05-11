# Hermes cost tuning

`optimize-hermes-config.sh` applies three cost-saving tweaks to a Hermes
agent's `config.yaml`. Cache-related spend (the dominant cost on most
Hermes instances) drops sharply after these changes.

## What it changes

| Setting                              | Before (typical)      | After                |
| ------------------------------------ | --------------------- | -------------------- |
| `compression.threshold`              | `0.50`                | `0.85`               |
| `auxiliary.compression.provider`     | `auto` (falls back to main = Opus) | `anthropic` |
| `auxiliary.compression.model`        | `''` (uses main model)             | `claude-sonnet-4-6` |
| `prompt_caching.cache_ttl`           | `5m` *(usually already correct — verified, set if missing)* | `5m` |

**Why these three:**
- Compression fires whenever a session crosses `threshold × context_size`.
  At 0.50 on a 1M-context Opus model, it fires constantly. 0.85 keeps the
  hygiene safety net but lets sessions run further before compacting.
- Compression itself is a big LLM call. By default Hermes runs it on the
  *main* chat model (Opus). Routing it to Sonnet drops the per-call cost
  ~5× with no meaningful quality loss — it's a summarization task.
- `cache_ttl: 5m` is Anthropic's cost-efficient cache tier; the 1h tier
  charges 2× for cache writes. Already the default in current Hermes, but
  the script asserts it in case an older config set it to `1h`.

## Usage

```bash
# Dry-run — show current settings, print target, exit. No changes.
./optimize-hermes-config.sh

# Apply changes (creates a timestamped backup first):
./optimize-hermes-config.sh --apply

# Apply and restart the gateway:
./optimize-hermes-config.sh --apply --restart

# Non-interactive (e.g. when piped over SSH):
./optimize-hermes-config.sh --apply --restart --yes

# Override config path if it's not in a standard location:
./optimize-hermes-config.sh --apply --config /opt/hermes-data/config.yaml
```

### Running against a remote client instance

The script supports being piped over SSH. Run from your local machine:

```bash
# Dry-run a client's Hermes:
ssh root@CLIENT_IP 'bash -s' < optimize-hermes-config.sh

# Apply + restart on a client (non-interactive):
ssh root@CLIENT_IP 'bash -s -- --apply --restart --yes' < optimize-hermes-config.sh
```

## What gets backed up

Every `--apply` run creates `<config>.bak-<YYYYMMDD-HHMMSS>` next to the
original. If no changes were needed (already optimized) the backup is
removed automatically.

## Safety / idempotency

- Re-running on an already-optimized instance is a clean no-op.
- The editor only rewrites the three target lines, preserving comments,
  ordering, indentation, and blank lines elsewhere in the file.
- Restart is auto-detected: `docker restart hermes` for Docker installs,
  `systemctl --user restart hermes-gateway` for systemd. Tells you what
  to run manually if neither is detected.

## Verifying after restart

The new compression model only logs when compression actually fires.
Tail the agent log and watch for the next compression event:

```bash
tail -F ~/.hermes/logs/agent.log | grep 'Auxiliary compression'
```

You should see `using anthropic (claude-sonnet-4-6)` instead of
`using auto (claude-opus-4-7)`.

## Rollback

```bash
# Restore from the most recent backup:
cp ~/.hermes/config.yaml.bak-<TIMESTAMP> ~/.hermes/config.yaml
docker restart hermes   # or: systemctl --user restart hermes-gateway
```
