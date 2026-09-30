/**
 * Protected Span Detector
 * 
 * Identifies content that must be preserved during transformations
 */

import type { ProtectedSpan } from '@riri/types';
import { PROTECTED_PATTERNS } from './patterns.js';

export class ProtectedSpanDetector {
  /**
   * Detect all protected spans in text
   */
  detect(text: string): ProtectedSpan[] {
    const spans: ProtectedSpan[] = [];
    
    // Sort patterns by priority (highest first)
    const sortedPatterns = [...PROTECTED_PATTERNS].sort((a, b) => b.priority - a.priority);
    
    // Track already protected ranges to avoid overlaps
    const protectedRanges: Array<{ start: number; end: number }> = [];
    
    for (const { type, pattern } of sortedPatterns) {
      // Reset regex state
      pattern.lastIndex = 0;
      
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        // Skip if this range overlaps with an existing protected range
        if (this.overlapsWithProtected(start, end, protectedRanges)) {
          continue;
        }
        
        // Add span
        spans.push({
          type,
          value: match[0],
          text: match[0],
          start,
          end,
          metadata: {},
        });
        
        // Mark range as protected
        protectedRanges.push({ start, end });
      }
    }
    
    // Sort by start position
    spans.sort((a, b) => a.start - b.start);
    
    return spans;
  }
  
  /**
   * Check if a range overlaps with any protected range
   */
  private overlapsWithProtected(
    start: number,
    end: number,
    protectedRanges: Array<{ start: number; end: number }>
  ): boolean {
    for (const range of protectedRanges) {
      // Check for any overlap
      if (
        (start >= range.start && start < range.end) ||
        (end > range.start && end <= range.end) ||
        (start <= range.start && end >= range.end)
      ) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if a position is within any protected span
   */
  isProtected(position: number, spans: ProtectedSpan[]): boolean {
    for (const span of spans) {
      if (position >= span.start && position < span.end) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get protected span at position
   */
  getSpanAt(position: number, spans: ProtectedSpan[]): ProtectedSpan | null {
    for (const span of spans) {
      if (position >= span.start && position < span.end) {
        return span;
      }
    }
    return null;
  }
  
  /**
   * Get all protected spans in a range
   */
  getSpansInRange(start: number, end: number, spans: ProtectedSpan[]): ProtectedSpan[] {
    return spans.filter(span => {
      return (
        (span.start >= start && span.start < end) ||
        (span.end > start && span.end <= end) ||
        (span.start <= start && span.end >= end)
      );
    });
  }
  
  /**
   * Validate that all protected spans are present in transformed text
   */
  validatePreservation(
    originalSpans: ProtectedSpan[],
    transformedText: string
  ): {
    valid: boolean;
    missing: ProtectedSpan[];
    mismatches: Array<{ span: ProtectedSpan; found?: string }>;
  } {
    const missing: ProtectedSpan[] = [];
    const mismatches: Array<{ span: ProtectedSpan; found?: string }> = [];
    
    for (const span of originalSpans) {
      const found = transformedText.includes(span.value);
      
      if (!found) {
        missing.push(span);
      }
    }
    
    return {
      valid: missing.length === 0 && mismatches.length === 0,
      missing,
      mismatches,
    };
  }
}

/**
 * Create a new protected span detector
 */
export function createProtectedSpanDetector(): ProtectedSpanDetector {
  return new ProtectedSpanDetector();
}
