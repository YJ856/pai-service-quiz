import { Transform } from 'class-transformer';

// 문자열이면 trim, 공백만 있으면 undefined로
export const TrimToUndefined = () => 
    Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        const t = value.trim();
        return t === '' ? undefined : t;
    });

// 쿼리/바디에 들어온 값을 number로 (null/undefined/'' -> undefined)
export const ToNumber = () => 
    Transform(({ value }) => 
        value === undefined || value === null || value === '' ? undefined : Number(value),
    );

// ToNumber + 클램프(min ~ max 범위로)
export const ToNumberClamped = (
    defaultValue = 20,
    min = 1,
    max = 50,
) => 
    Transform(({ value }) => {
        // 기본값 처리
        const fallback = defaultValue;

        // 빈값 처리
        if (value === undefined || value === null || value === '') return fallback;

        // 숫자 변환
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;

        // 클램프
        if (n < min) return min;
        if (n > max) return max;
        return n;
    });

// 쿼리/바디의 “형 변환·검증(문자열→number, trim, 빈값 처리)”은 DTO(+ValidationPipe)에서 하고, 
// 매퍼는 “레이어 간 모델 변환”만 하기!