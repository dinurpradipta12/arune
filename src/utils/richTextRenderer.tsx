import React from 'react';
import type { TextCanvasElement } from '../types/studio';

/**
 * Parses *italic* segments into <em> nodes in Italic Serif
 */
export function renderAsteriskItalics(
  text: string,
  serifFallback = "'Cormorant Garamond', Georgia, serif"
): React.ReactNode[] {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <em
          key={idx}
          style={{
            fontStyle: 'italic',
            fontFamily: serifFallback,
            fontWeight: 'inherit',
          }}
        >
          {inner}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function renderEditorialTextContent(
  element: TextCanvasElement,
  defaultAccentColor: string
): React.ReactNode {
  const raw = element.content || '';
  const trimmed = raw.trimStart();

  // Check if starts with [X] bracketed letter or has dropCap enabled
  const bracketMatch = trimmed.match(/^\[([A-Za-z])\]\s*(.*)$/s);
  const shouldDropCap = Boolean(bracketMatch) || element.dropCap;

  if (shouldDropCap && trimmed.length > 0) {
    const firstLetter = bracketMatch ? bracketMatch[1] : trimmed.charAt(0);
    const restText = bracketMatch ? bracketMatch[2] : trimmed.slice(1);
    const accentColor = element.dropCapColor || defaultAccentColor;

    return (
      <>
        <span
          className="editorial-dropcap-letter"
          style={{
            color: accentColor,
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          }}
        >
          {firstLetter}
        </span>
        {restText.split('\n').map((line, lineIdx, arr) => (
          <React.Fragment key={lineIdx}>
            {renderAsteriskItalics(line)}
            {lineIdx < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  }

  const lines = raw.split('\n');
  return lines.map((line, lineIdx) => (
    <React.Fragment key={lineIdx}>
      {renderAsteriskItalics(line)}
      {lineIdx < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}
