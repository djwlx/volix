import { useRef, useState } from 'react';
import { Button, Card, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { useI18n } from '@/i18n';
import { useIsMobile } from '@/hooks';

interface EyeDropperConstructor {
  new (): {
    open: () => Promise<{ sRGBHex: string }>;
  };
}

interface WindowWithEyeDropper extends Window {
  EyeDropper?: EyeDropperConstructor;
}

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
}

const getEyeDropperUnavailableReason = (t: (key: string, values?: Record<string, unknown>) => string) => {
  if (!window.isSecureContext) {
    return t('colorPicker.unavailable.insecureContext');
  }

  if (window.top !== window.self) {
    return t('colorPicker.unavailable.inIframe');
  }

  if (!('EyeDropper' in window)) {
    return t('colorPicker.unavailable.eyeDropperMissing');
  }

  return t('colorPicker.unavailable.fallback');
};

const pageStyle = {
  width: '100%',
  height: '100%',
  background: 'var(--app-page-warm-bg)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
} as const;

const contentStyle = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: 16,
  maxWidth: 1220,
  margin: '0 auto',
  display: 'grid',
  gap: 16,
  width: '100%',
  boxSizing: 'border-box',
} as const;

const cardStyle = {
  width: '100%',
  borderRadius: 16,
} as const;

const cardBodyStyle = {
  display: 'grid',
  gap: 16,
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.2,
  color: 'var(--app-text)',
} as const;

const getColorInfo = (r: number, g: number, b: number): ColorInfo => {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  const rgb = `rgb(${r}, ${g}, ${b})`;

  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    switch (max) {
      case rn:
        hue = 60 * (((gn - bn) / delta) % 6);
        break;
      case gn:
        hue = 60 * ((bn - rn) / delta + 2);
        break;
      default:
        hue = 60 * ((rn - gn) / delta + 4);
        break;
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const hsl = `hsl(${Math.round(hue)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`;

  return { hex, rgb, hsl };
};

const copyText = async (value: string, label: string, t: (key: string, values?: Record<string, unknown>) => string) => {
  try {
    await navigator.clipboard.writeText(value);
    Toast.success(t('colorPicker.copySuccess', { label }));
  } catch {
    Toast.error(t('colorPicker.error.copyFailed'));
  }
};

function ColorPickerApp() {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [colorInfo, setColorInfo] = useState<ColorInfo>({
    hex: '#14B8A6',
    rgb: 'rgb(20, 184, 166)',
    hsl: 'hsl(173, 80%, 40%)',
  });
  const [imageName, setImageName] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const openEyeDropper = async () => {
    const EyeDropperApi = (window as WindowWithEyeDropper).EyeDropper;

    if (!EyeDropperApi) {
      const reason = getEyeDropperUnavailableReason(t);
      console.warn('[ColorPicker] EyeDropper unavailable', {
        isSecureContext: window.isSecureContext,
        isTopLevel: window.top === window.self,
        hasEyeDropper: 'EyeDropper' in window,
        userAgent: navigator.userAgent,
      });
      Toast.warning(reason);
      return;
    }

    try {
      const eyeDropper = new EyeDropperApi();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex.toUpperCase();
      const numeric = Number.parseInt(hex.slice(1), 16);
      const r = (numeric >> 16) & 255;
      const g = (numeric >> 8) & 255;
      const b = numeric & 255;
      setColorInfo(getColorInfo(r, g, b));
    } catch {
      Toast.warning(t('colorPicker.status.cancelled'));
    }
  };

  const drawImageToCanvas = (src: string, name: string) => {
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const maxWidth = 960;
      const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));

      const context = canvas.getContext('2d');
      if (!context) {
        Toast.error(t('colorPicker.error.imageUnavailable'));
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setImageName(name);
      setImageLoaded(true);
    };

    image.onerror = () => {
      Toast.error(t('colorPicker.error.imageLoadFailed'));
    };

    image.src = src;
  };

  const onUploadImage = (file?: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        drawImageToCanvas(reader.result, file.name);
      }
    };
    reader.onerror = () => Toast.error(t('colorPicker.error.imageReadFailed'));
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onPickImageColor = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      Toast.error(t('colorPicker.error.canvasReadFailed'));
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    const pixel = context.getImageData(x, y, 1, 1).data;
    setColorInfo(getColorInfo(pixel[0] || 0, pixel[1] || 0, pixel[2] || 0));
  };

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(280px, 340px) minmax(0, 1fr)',
          }}
        >
          <Card shadows="hover" style={cardStyle} bodyStyle={{ display: 'grid', gap: 14 }}>
            <div style={sectionTitleStyle}>{t('colorPicker.section.colorInfo')}</div>
            <div
              style={{
                height: 120,
                borderRadius: 14,
                background: colorInfo.hex,
                boxShadow: 'inset 0 0 0 1px rgba(15, 23, 42, 0.08)',
              }}
            />
            <div style={{ display: 'grid', gap: 10 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid var(--app-border-strong)',
                  cursor: 'pointer',
                  background: 'var(--app-surface)',
                }}
                onClick={() => copyText(colorInfo.hex, t('colorPicker.copyLabel.hex'), t)}
              >
                <Typography.Text style={{ color: 'var(--app-text-muted)' }}>
                  {t('colorPicker.copyLabel.hex')}
                </Typography.Text>
                <Typography.Text strong style={{ display: 'block', color: 'var(--app-text)' }}>
                  {colorInfo.hex}
                </Typography.Text>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid var(--app-border-strong)',
                  cursor: 'pointer',
                  background: 'var(--app-surface)',
                }}
                onClick={() => copyText(colorInfo.rgb, t('colorPicker.copyLabel.rgb'), t)}
              >
                <Typography.Text style={{ color: 'var(--app-text-muted)' }}>
                  {t('colorPicker.copyLabel.rgb')}
                </Typography.Text>
                <Typography.Text strong style={{ display: 'block', color: 'var(--app-text)' }}>
                  {colorInfo.rgb}
                </Typography.Text>
              </div>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid var(--app-border-strong)',
                  cursor: 'pointer',
                  background: 'var(--app-surface)',
                }}
                onClick={() => copyText(colorInfo.hsl, t('colorPicker.copyLabel.hsl'), t)}
              >
                <Typography.Text style={{ color: 'var(--app-text-muted)' }}>
                  {t('colorPicker.copyLabel.hsl')}
                </Typography.Text>
                <Typography.Text strong style={{ display: 'block', color: 'var(--app-text)' }}>
                  {colorInfo.hsl}
                </Typography.Text>
              </div>
            </div>
          </Card>

          <Card shadows="hover" style={cardStyle} bodyStyle={cardBodyStyle}>
            <div style={sectionTitleStyle}>{t('colorPicker.section.pickMode')}</div>
            <Space wrap>
              <Button theme="solid" type="primary" onClick={openEyeDropper}>
                {t('colorPicker.action.pickFromPage')}
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>{t('colorPicker.action.pickFromImage')}</Button>
              {imageLoaded ? (
                <Button
                  type="tertiary"
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      const context = canvas.getContext('2d');
                      context?.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    setImageLoaded(false);
                    setImageName('');
                  }}
                >
                  {t('colorPicker.action.clearImage')}
                </Button>
              ) : null}
            </Space>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={event => onUploadImage(event.target.files?.[0])}
            />

            <div
              style={{
                minHeight: isMobile ? 280 : 420,
                borderRadius: 14,
                border: '1px dashed var(--app-border-strong)',
                background: 'var(--app-surface-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <canvas
                ref={canvasRef}
                onClick={onPickImageColor}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  cursor: imageLoaded ? 'crosshair' : 'default',
                  display: imageLoaded ? 'block' : 'none',
                }}
              />
              {imageLoaded ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: 'var(--app-overlay)',
                    color: '#fff',
                    fontSize: 12,
                  }}
                >
                  {imageName || t('colorPicker.hint.clickToPick')}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {t('colorPicker.hint.imageUpload')}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--app-text-muted)' }}>
                    {t('colorPicker.hint.pagePick')}
                  </Typography.Text>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ColorPickerApp;
