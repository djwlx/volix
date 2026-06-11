# Format Convert Ops Plan

## Task 7: Update Docker/docs and run end-to-end verification

**Files:**
- Modify: `Dockerfile`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/docker.md`
- Modify: `docs/docker.zh-CN.md`

- [ ] Add the Docker runtime dependency change.
- [ ] Update docs with format-convert, `ffmpeg`, `ffprobe`, cache path, and recovery behavior.
- [ ] Run focused verification commands.
- [ ] Run a manual local smoke conversion.

Reference sketch:

```dockerfile
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*
```

```md
## Format Convert

Volix includes a new format-convert tool for local uploads and OpenList-backed cloud conversion.

Runtime requirements:

- `ffmpeg`
- `ffprobe`

Temporary workspaces are stored in `data/cache/media/format-convert/`.
```

Verification commands:

```bash
pnpm test test/api/openlist-sdk-full-surface.test.ts test/api/format-convert-option.service.test.ts test/api/format-convert-runtime.service.test.ts test/api/format-convert-runner.service.test.ts test/api/format-convert-queue.service.test.ts test/api/format-convert-controller.test.ts apps/web-pc/src/apps/format-convert/preset-options.test.ts apps/web-pc/src/apps/format-convert/task-status.test.tsx
pnpm --filter @volix/api typecheck
pnpm --filter @volix/web-pc typecheck
pnpm build
ffmpeg -version
ffprobe -version
```

Manual smoke check:

```bash
mkdir -p /tmp/volix-plan-check
ffmpeg -y -v error -i '/Users/bendong/Downloads/test.mp4' -t 5 -c:v libx264 -preset veryfast -crf 28 -c:a aac '/tmp/volix-plan-check/test-converted.mp4'
ffprobe -v error -show_entries format=duration,size,format_name -show_entries stream=codec_name,codec_type,width,height -of json '/tmp/volix-plan-check/test-converted.mp4'
```

## Acceptance Focus

- Container/runtime docs explicitly state `ffmpeg` and `ffprobe` are required.
- Cache path uses `data/cache/media/format-convert/`.
- Verification includes both automated tests and a real ffmpeg smoke conversion.
