const LIST_PARAM = /[?&]list=([A-Za-z0-9_-]+)/;
const RAW_ID = /^(PL|UU|LL|FL|OL|RD)[A-Za-z0-9_-]{10,}$/;

export function extractPlaylistId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const match = LIST_PARAM.exec(raw);
  if (match) return match[1];
  if (RAW_ID.test(raw)) return raw;
  return null;
}
