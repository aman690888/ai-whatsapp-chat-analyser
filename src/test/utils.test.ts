import { describe, it, expect } from 'vitest';
import { escapeHtml, formatSimpleMarkdown } from '../lib/utils';

describe('utils formatting & security', () => {
  it('escapes dangerous HTML characters', () => {
    const malicious = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&quot;xss&quot;');
    expect(escaped).toContain('&lt;img');
  });

  it('safely formats bold, italic, and newlines without unescaped HTML', () => {
    const raw = 'Hello **world**! Check *this* out.\n<script>bad()</script>';
    const formatted = formatSimpleMarkdown(raw);
    expect(formatted).toContain('<strong>world</strong>');
    expect(formatted).toContain('<em>this</em>');
    expect(formatted).toContain('<br/>');
    expect(formatted).toContain('&lt;script&gt;bad()&lt;/script&gt;');
    expect(formatted).not.toContain('<script>');
  });
});
