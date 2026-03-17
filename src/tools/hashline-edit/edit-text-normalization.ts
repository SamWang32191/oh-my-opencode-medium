import { HASH_ALPHABET } from './constants';

const HASHLINE_PREFIX_RE = new RegExp(
  `^\\s*(?:>>>|>>)?\\s*\\d+\\s*#\\s*[${HASH_ALPHABET}]{2}\\|`,
);
const DIFF_PLUS_RE = /^[+](?![+])/;

export function stripLinePrefixes(lines: string[]): string[] {
  let hashPrefixCount = 0;
  let diffPlusCount = 0;
  let nonEmpty = 0;

  for (const line of lines) {
    if (line.length === 0) continue;
    nonEmpty += 1;
    if (HASHLINE_PREFIX_RE.test(line)) hashPrefixCount += 1;
    if (DIFF_PLUS_RE.test(line)) diffPlusCount += 1;
  }

  if (nonEmpty === 0) {
    return lines;
  }

  const stripHash = hashPrefixCount > 0 && hashPrefixCount >= nonEmpty * 0.5;
  const stripPlus =
    !stripHash && diffPlusCount > 0 && diffPlusCount >= nonEmpty * 0.5;

  if (!stripHash && !stripPlus) {
    return lines;
  }

  return lines.map((line) => {
    if (stripHash) return line.replace(HASHLINE_PREFIX_RE, '');
    if (stripPlus) return line.replace(DIFF_PLUS_RE, '');
    return line;
  });
}

export function toNewLines(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return stripLinePrefixes(input);
  }
  return stripLinePrefixes(input.split('\n'));
}
