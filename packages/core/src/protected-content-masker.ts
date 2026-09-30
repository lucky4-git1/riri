import type { ProtectedSpan } from '@riri/types';

export interface MaskedText {
  text: string;
  restore(text: string): string;
}

/** Keeps immutable values opaque to transformations and restores byte-for-byte values afterwards. */
export function maskProtectedContent(text: string, spans: ProtectedSpan[]): MaskedText {
  if (!spans || spans.length === 0 || !text) {
    return { text, restore: (t: string) => t };
  }

  // Filter valid spans that match text at their reported offsets
  const validSpans: ProtectedSpan[] = [];
  for (const s of spans) {
    if (!s.value || s.value.length === 0) continue;
    // Check if start/end matches text directly
    if (s.start !== undefined && s.end !== undefined && s.start >= 0 && s.end <= text.length && text.slice(s.start, s.end) === s.value) {
      validSpans.push(s);
    } else {
      // Find all exact occurrences in text if offsets are not exact
      let pos = 0;
      while ((pos = text.indexOf(s.value, pos)) !== -1) {
        validSpans.push({
          ...s,
          start: pos,
          end: pos + s.value.length,
        });
        pos += s.value.length;
      }
    }
  }

  // Sort by start ascending and filter out overlaps
  validSpans.sort((a, b) => a.start - b.start || (b.end - a.end));
  const nonOverlapping: Array<{ start: number; end: number; value: string; token: string }> = [];
  let lastEnd = -1;

  for (let i = 0; i < validSpans.length; i++) {
    const s = validSpans[i];
    if (s.start >= lastEnd) {
      // Use distinct Unicode delimiters that cannot match regular word tokens or numbers
      const token = `⟦PROTECTED_${nonOverlapping.length}⟧`;
      nonOverlapping.push({ start: s.start, end: s.end, value: s.value, token });
      lastEnd = s.end;
    }
  }

  // Replace from end to start so offsets remain valid
  let masked = text;
  for (let i = nonOverlapping.length - 1; i >= 0; i--) {
    const item = nonOverlapping[i];
    masked = masked.slice(0, item.start) + item.token + masked.slice(item.end);
  }

  return {
    text: masked,
    restore(candidate: string): string {
      let output = candidate;
      // Replace every token back to original value
      for (const item of nonOverlapping) {
        output = output.split(item.token).join(item.value);
      }
      // Cleanup safety net: clean up any legacy __RIRI_PROTECTED_\d+__ if present
      output = output.replace(/__RIRI_PROTECTED_\d+__/g, '');
      output = output.replace(/⟦PROTECTED_\d+⟧/g, '');
      return output;
    },
  };
}

