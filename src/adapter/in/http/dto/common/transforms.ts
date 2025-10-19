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

// 쿼리/바디의 “형 변환·검증(문자열→number, trim, 빈값 처리)”은 DTO(+ValidationPipe)에서 하고, 
// 매퍼는 “레이어 간 모델 변환”만 하기!