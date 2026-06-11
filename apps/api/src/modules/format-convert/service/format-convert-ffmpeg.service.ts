import fs from 'fs';
import path from 'path';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import type { FormatConvertMediaInfo, FormatConvertOption } from '@volix/types';

const execFileAsync = promisify(execFile);
const MAX_FFMPEG_STDERR_TAIL_LENGTH = 16 * 1024;

export const appendFfmpegStderrTail = (current: string, chunk: string, maxLength = MAX_FFMPEG_STDERR_TAIL_LENGTH) => {
  return `${current}${chunk}`.slice(-maxLength);
};

export interface ProbePayload {
  streams: Array<{
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    avg_frame_rate?: string;
    r_frame_rate?: string;
    sample_rate?: string;
    channels?: number;
    channel_layout?: string;
    bit_rate?: string;
  }>;
  format?: {
    duration?: string;
    size?: string;
    format_name?: string;
    bit_rate?: string;
  };
}

export const resolveFfmpegBinary = () => String(process.env.FFMPEG_BIN || 'ffmpeg').trim() || 'ffmpeg';
export const resolveFfprobeBinary = () => String(process.env.FFPROBE_BIN || 'ffprobe').trim() || 'ffprobe';

const toBinaryError = (error: unknown, binary: string, envName: string) => {
  const err = error as NodeJS.ErrnoException;
  if (err?.code === 'ENOENT') {
    return new Error(`${binary} not found, install ${binary} or set ${envName}`);
  }
  return error;
};

const parseFfprobeRate = (value?: string) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return 0;
  }
  if (!raw.includes('/')) {
    return Number(raw || 0);
  }
  const [numeratorText, denominatorText] = raw.split('/');
  const numerator = Number(numeratorText || 0);
  const denominator = Number(denominatorText || 0);
  if (!numerator || !denominator) {
    return 0;
  }
  return Number((numerator / denominator).toFixed(3));
};

const toKbps = (value?: string) => {
  const bitsPerSecond = Number(value || 0);
  if (!bitsPerSecond) {
    return 0;
  }
  return Number((bitsPerSecond / 1000).toFixed(3));
};

export const parseProbeResult = (payload: ProbePayload): FormatConvertMediaInfo => {
  const video = payload.streams.find(item => item.codec_type === 'video');
  const audio = payload.streams.find(item => item.codec_type === 'audio');
  return {
    formatName: String(payload.format?.format_name || ''),
    durationSeconds: Number(payload.format?.duration || 0),
    sizeBytes: Number(payload.format?.size || 0),
    bitRateKbps: toKbps(payload.format?.bit_rate),
    hasVideo: Boolean(video),
    hasAudio: Boolean(audio),
    video: video
      ? {
          codecName: String(video.codec_name || ''),
          width: Number(video.width || 0),
          height: Number(video.height || 0),
          frameRate: parseFfprobeRate(video.avg_frame_rate || video.r_frame_rate),
          bitRateKbps: toKbps(video.bit_rate),
        }
      : undefined,
    audio: audio
      ? {
          codecName: String(audio.codec_name || ''),
          sampleRateHz: Number(audio.sample_rate || 0),
          channels: Number(audio.channels || 0),
          channelLayout: String(audio.channel_layout || ''),
          bitRateKbps: toKbps(audio.bit_rate),
        }
      : undefined,
  };
};

export const probeMediaFile = async (filePath: string) => {
  let stdout = '';
  try {
    ({ stdout } = await execFileAsync(resolveFfprobeBinary(), [
      '-v',
      'error',
      '-show_entries',
      'format=duration,size,format_name',
      '-show_entries',
      'stream=codec_name,codec_type,width,height',
      '-of',
      'json',
      filePath,
    ]));
  } catch (error) {
    throw toBinaryError(error, 'ffprobe', 'FFPROBE_BIN');
  }
  return parseProbeResult(JSON.parse(stdout || '{}') as ProbePayload);
};

export const buildFormatConvertArgs = (inputPath: string, outputPath: string, option: FormatConvertOption) => {
  const args = ['-y', '-i', inputPath];

  if (option.videoCodec) {
    const videoCodec =
      option.videoCodec === 'h264' ? 'libx264' : option.videoCodec === 'h265' ? 'libx265' : option.videoCodec;
    args.push('-c:v', videoCodec);
  }
  if (option.audioCodec) {
    const audioCodec = option.audioCodec === 'opus' ? 'libopus' : option.audioCodec;
    args.push('-c:a', audioCodec);
  }
  if (option.resolution && option.resolution !== 'source') {
    args.push('-vf', `scale=-2:${option.resolution.replace('p', '')}`);
  }
  if (typeof option.crf === 'number') {
    args.push('-crf', String(option.crf));
  }
  if (typeof option.videoBitrateKbps === 'number') {
    args.push('-b:v', `${option.videoBitrateKbps}k`);
  }
  if (typeof option.audioBitrateKbps === 'number') {
    args.push('-b:a', `${option.audioBitrateKbps}k`);
  }
  if (option.encodingPreset) {
    args.push('-preset', option.encodingPreset);
  }
  if (option.keepAudio === false) {
    args.push('-an');
  }
  if (option.extraArgs?.length) {
    args.push(...option.extraArgs);
  }
  args.push(outputPath);
  return args;
};

export interface RunFfmpegCommandOptions {
  logPath?: string;
}

export const runFfmpegCommand = async (args: string[], options?: RunFfmpegCommandOptions) => {
  const logPath = String(options?.logPath || '').trim();
  if (logPath) {
    await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
    await fs.promises.writeFile(logPath, `${new Date().toISOString()} ffmpeg ${args.join(' ')}\n`, 'utf8');
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(resolveFfmpegBinary(), args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const logStream = logPath ? fs.createWriteStream(logPath, { flags: 'a' }) : null;
    let stderrTail = '';
    child.stdout.on('data', chunk => {
      logStream?.write(String(chunk || ''));
    });
    child.stderr.on('data', chunk => {
      const text = String(chunk || '');
      stderrTail = appendFfmpegStderrTail(stderrTail, text);
      logStream?.write(text);
    });
    child.on('error', error => {
      logStream?.end();
      reject(toBinaryError(error, 'ffmpeg', 'FFMPEG_BIN'));
    });
    child.on('close', code => {
      logStream?.end();
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderrTail.trim() || `ffmpeg exited with code ${code}`));
    });
  });
};
