import type { Quiz as QuizRow } from '@prisma/client';
import { Quiz } from '../../../../domain/model/quiz';
import { toYmdFromDate, ymdToUtcDate } from 'src/utils/date.util';

export const QuizMapper = {
    // Prisma Row -> 도메인 엔티티
    toDomain(row: QuizRow): Quiz {
        return Quiz.rehydrate({
            id: row.id,
            parentProfileId: row.parentProfileId,
            question: row.question,
            answer: row.answer,
            publishDate: toYmdFromDate(row.publishDate),
            hint: row.hint ?? null,
            reward: row.reward ?? null,
        });
    },

    // 도메인 -> Prisma create/update data
    toPersistenceData(entity: Quiz) {
        const publishDateVO = entity.getPublishDate();
        const ymd = publishDateVO.ymd;
        return {
            parentProfileId: entity.getParentProfileId(),
            question: entity.getQuestion(),
            answer: entity.getAnswer(),
            hint: entity.getHint(),
            reward: entity.getReward(),
            publishDate: ymdToUtcDate(ymd), // 'yyyy-MM-dd' -> Date(UTC 자정)
        };
    },
};