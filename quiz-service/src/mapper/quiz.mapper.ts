import { Injectable } from '@nestjs/common';
import type { CreateQuizRequest, CreateQuizResponse } from '@your-scope/shared-type';
import { CreateQuizCommand } from '../application/command/create-quiz.command';
import type { Quiz } from '../domain/model/quiz';

/**
 * DTO(shared-type) <-> Command <-> Domain 변환 담당
 * - 외부 계약 변경의 파급을 여기서 흡수
 * - Controller/UseCase/Domain은 계약 변화로부터 보호됨
 * - 날짜: 'yyyy-MM-dd'는 **형식 유효성만 체크**하고 문자열 그대로 전달
 */
@Injectable()
export class QuizMapper {
    toCreateCommand(req: CreateQuizRequest, parentProfileId: string): CreateQuizCommand {
        const norm = (v: unknown) => (v == null ? null : String(v).trim());
        
        // 유효성 검사 후 문자열(yyyy-MM-dd) 그대로 사용
        const ymd = toYmdOrUndefined(req.publishDate ?? undefined);

        return new CreateQuizCommand(
            String(req.question ?? '').trim(),
            String(req.answer ?? '').trim(),
            norm(req.hint),
            norm(req.reward), 
            parentProfileId, 
            ymd,
        );
    }

    toCreateResponse(saved: Quiz): CreateQuizResponse {
        return {
            success: true,
            data: { quizId: (saved as any).id, },
        };
    }
}

/** 내부 헬퍼(필요 시 별도 util로 분리 가능) */

/** 'yyyy-MM-dd' 형식 유효성만 체크. 유효하면 원문 문자열, 아니면 undefined */
function toYmdOrUndefined(ymd?: string | null): string | undefined {
    if (!ymd) return undefined;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return undefined;
    const y = +m[1], mo = +m[2], d = +m[3];
    // 달력 유효성 체크 (예: 2025-02-31 방지)
    const dt = new Date(Date.UTC(y, mo - 1, d));
    const ok = dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
    return ok ? ymd : undefined;
}