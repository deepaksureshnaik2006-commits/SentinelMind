import React from 'react';

/**
 * Clean HUD Markdown Renderer
 * Parses markdown headers, bold spans, bullet points, inline code, and tables
 * without leaving raw asterisks or unformatted ascii pipe tables.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');
  const elements = [];
  let currentTable = null;
  let inCodeBlock = false;
  let codeBlockLines = [];

  const formatInlineText = (text) => {
    if (!text) return '';
    // Format bold `**text**` and `__text__`
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="text-white font-semibold font-sans">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded-sm bg-[#070D18] border border-[#168DCE]/40 text-[#38BDF8] font-mono text-[11px]"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="text-[#8BA8C2] italic">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }
    return parts.length > 0 ? parts : text;
  };

  const flushTable = (key) => {
    if (!currentTable || currentTable.rows.length === 0) return null;
    const table = currentTable;
    currentTable = null;
    return (
      <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-sm border border-[#168DCE]/35 bg-[#070D18]">
        <table className="w-full text-left text-xs font-mono">
          {table.headers && (
            <thead className="bg-[#0A1320] text-[#38BDF8] border-b border-[#168DCE]/40">
              <tr>
                {table.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 font-semibold tracking-wider text-[11px] uppercase">
                    {formatInlineText(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[#168DCE]/20 text-[#E2F3FF]">
            {table.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#168DCE]/10 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2">
                    {formatInlineText(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div key={`code-${i}`} className="my-2 p-3 rounded-sm bg-[#070D18] border border-[#168DCE]/40 font-mono text-xs text-[#38BDF8] overflow-x-auto">
            <pre>{codeBlockLines.join('\n')}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Check table rows: starts and ends with `|`
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      // Skip separator row like `|---|---|`
      if (cells.every((c) => /^[-:\s]+$/.test(c))) {
        continue;
      }
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else if (currentTable) {
      const tbl = flushTable(i);
      if (tbl) elements.push(tbl);
    }

    // Empty lines
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Headings (###, ##, #)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#38BDF8] rounded-none shadow-[0_0_6px_#38BDF8]" />
          <span>{trimmed.slice(4)}</span>
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const title = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h3 key={`h2-${i}`} className="text-sm font-mono font-bold text-[#E2F3FF] tracking-wide mt-3.5 mb-1.5 pb-1 border-b border-[#168DCE]/30">
          {title}
        </h3>
      );
      continue;
    }

    // Bullet points (* or -)
    if (/^[\*\-•]\s+/.test(trimmed)) {
      const cleanBullet = trimmed.replace(/^[\*\-•]\s+/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#E2F3FF] my-1 pl-1">
          <span className="text-[#38BDF8] font-mono text-sm leading-none shrink-0 mt-0.5">•</span>
          <div className="flex-1">{formatInlineText(cleanBullet)}</div>
        </div>
      );
      continue;
    }

    // Numbered list (1. , 2. )
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#E2F3FF] my-1 pl-1">
          <span className="text-[#38BDF8] font-mono text-xs font-bold shrink-0 mt-0.5">{numMatch[1]}.</span>
          <div className="flex-1">{formatInlineText(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${i}`} className="text-xs leading-relaxed text-[#E2F3FF] my-1">
        {formatInlineText(trimmed)}
      </p>
    );
  }

  // Flush any lingering table
  if (currentTable) {
    const tbl = flushTable('end');
    if (tbl) elements.push(tbl);
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

