interface PreviewOptions {
  maxChars?: number;
  maxLines?: number;
}

const DEFAULT_OPTIONS: Required<PreviewOptions> = {
  maxChars: 1200,
  maxLines: 16,
};

export const createResponsePreview = (raw: string, options: PreviewOptions = {}): string => {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  let value = raw;
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      value = JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      value = raw;
    }
  }

  const lines = value.split(/\r?\n/);
  let sliced = lines.slice(0, settings.maxLines).join("\n");
  let truncated = lines.length > settings.maxLines;

  if (sliced.length > settings.maxChars) {
    sliced = sliced.slice(0, settings.maxChars);
    truncated = true;
  }

  if (truncated) {
    sliced = `${sliced}\n… 已截断`;
  }

  return sliced;
};
