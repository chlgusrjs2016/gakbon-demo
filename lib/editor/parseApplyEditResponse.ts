/**
 * AI 응답에서 apply_edit 도구 호출 JSON을 추출합니다.
 * 코드블록(```json ... ```) 또는 앞뒤 텍스트가 있어도 파싱할 수 있도록 합니다.
 */

export type ApplyEditParams = {
  search?: string;
  replace?: string;
  edits?: { search: string; replace: string }[];
};

export type ApplyEditPayload = {
  tool: "apply_edit";
  params: ApplyEditParams;
};

function tryParse(raw: string): ApplyEditPayload | null {
  try {
    const parsed = JSON.parse(raw) as { tool?: string; params?: ApplyEditParams };
    if (parsed?.tool === "apply_edit" && parsed?.params) return parsed as ApplyEditPayload;
  } catch {
    // ignore
  }
  return null;
}

/**
 * JSON 문자열 값 안의 실제 줄바꿈(\n)을 이스케이프(\\n)로 바꿔 유효한 JSON으로 만듦.
 * AI가 "search":"...\n..." 처럼 줄바꿈을 이스케이프 없이 보낼 때 파싱 실패를 방지.
 */
function normalizeNewlinesInJsonString(str: string): string {
  let result = "";
  let i = 0;
  const len = str.length;
  while (i < len) {
    const ch = str[i];
    if (ch === '"' && (i === 0 || str[i - 1] !== "\\")) {
      result += ch;
      i++;
      while (i < len) {
        const c = str[i];
        if (c === "\\") {
          result += str[i++] + (str[i] ?? "");
          i++;
          continue;
        }
        if (c === '"') {
          result += c;
          i++;
          break;
        }
        if (c === "\n") result += "\\n";
        else if (c === "\r") result += "\\r";
        else result += c;
        i++;
      }
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

/**
 * 응답 문자열에서 apply_edit JSON을 찾아 파싱합니다.
 * - 전체가 JSON이면 그대로 파싱
 * - ```json ... ``` 또는 ``` ... ``` 블록이 있으면 그 내용 파싱
 * - 그 외에는 첫 번째 { 부터 마지막 } 까지 추출 후 파싱
 */
export function parseApplyEditResponse(rawContent: string): ApplyEditPayload | null {
  const trimmed = rawContent.trim();
  if (!trimmed) return null;

  const direct = tryParse(trimmed);
  if (direct) return direct;

  // 마크다운 코드블록: ```json ... ``` 또는 ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    let inner = codeBlockMatch[1].trim();
    let fromBlock = tryParse(inner);
    if (!fromBlock) {
      inner = normalizeNewlinesInJsonString(inner);
      fromBlock = tryParse(inner);
    }
    if (fromBlock) return fromBlock;
  }

  // 첫 { 부터 마지막 } 까지 추출
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    let extracted = trimmed.slice(firstBrace, lastBrace + 1);
    let fromExtract = tryParse(extracted);
    if (!fromExtract) {
      extracted = normalizeNewlinesInJsonString(extracted);
      fromExtract = tryParse(extracted);
    }
    if (fromExtract) return fromExtract;
  }

  return null;
}

/** params에서 단일/복수 수정 목록을 항상 배열로 반환 */
export function getEditsList(payload: ApplyEditPayload): { search: string; replace: string }[] {
  const { params } = payload;
  if (params.edits && Array.isArray(params.edits)) {
    return params.edits.filter(
      (e): e is { search: string; replace: string } =>
        typeof e?.search === "string" && typeof e?.replace === "string"
    );
  }
  if (typeof params.search === "string" && typeof params.replace === "string") {
    return [{ search: params.search, replace: params.replace }];
  }
  return [];
}
