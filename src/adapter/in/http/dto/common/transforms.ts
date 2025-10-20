import { Transform } from 'class-transformer';

// 문자열이면 trim만 수행
export const TrimString = () =>
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

// 문자열이면 trim, 키 값이 안 들어오면 undefined로
export const TrimToUndefined = () => 
    Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        const t = value.trim();
        return t === '' ? undefined : t;
    });

// 문자열이면 trim, 결과가 빈 문자열이면 null
export const TrimToNull = () => 
    Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        const t = value.trim();
        return t === '' ? null : t;
    })

// 쿼리/바디에 들어온 값을 number로 (null/undefined/'' -> undefined)
export const ToNumber = () => 
    Transform(({ value }) => {
        // null/undefined -> undefined
        if (value == null) return undefined;

        // 문자열이면 trim 후 빈값 체크
        if (typeof value === 'string') {
            const t = value.trim();
            if (t === '') return undefined;
            const n = Number(t);
            return Number.isFinite(n) ? n : undefined;
        }

        // 그 외 타입(숫자 등)
        const n = Number(value)
        return Number.isFinite(n) ? n : undefined;
    });

// ToNumber + 클램프(min ~ max 범위로)
export const ToNumberClamped = ( defaultValue = 20, min = 1, max = 50, ) => 
    Transform(({ value }) => {
        // 기본값 처리
        const fallback = defaultValue;

        // null/undefined는 바로 기본값
        if (value == null) return fallback;

        // 문자열이면 trim 후 빈값 체크
        let raw = value;
        if (typeof raw === 'string') {
            raw = raw.trim();
            if (raw === '') return fallback;
        }

        // 숫자 변환
        const n = Number(raw);
        if (!Number.isFinite(n)) return fallback;

        // 클램프
        if (n < min) return min;
        if (n > max) return max;
        return n;
    });


// 쿼리/바디의 “형 변환·검증(문자열→number, trim, 빈값 처리)”은 DTO(+ValidationPipe)에서 하고, 
// 매퍼는 “레이어 간 모델 변환”만 하기!

/**
 * 쿼리에서 옵션 값(예: cursor): TrimToUndefined
 * -> ?cursor= 같은 빈값도 “미지정”으로 통일 → 첫 페이지 처리 쉬움
 * 바디에서 “비울 수 있는” 필드(예: hint, reward): TrimToNull
 * -> ''를 null로 통일 → PATCH에서 “비우기” 의미를 명확히
 * 필수 텍스트(예: answer): TrimToUndefined + @IsNotEmpty()
 * -> 공백을 undefined로 만들어 “필수값 누락”으로 400
 */