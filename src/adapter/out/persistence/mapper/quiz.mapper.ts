import type { Quiz as QuizRow } from '@prisma/client';
import { Quiz } from '../../../../domain/model/quiz';

export const QuizMapper = {
    // Prisma Row -> 도메인 엔티티
    toDomain(row: QuizRow): Quiz {
        return Quiz.rehydrate({
            id: row.id,
            parentProfileId: row.parentProfileId,
            question: row.question,
            answer: row.answer,
            publishDate: row.publishDate.toISOString().slice(0, 10),
            hint: row.hint ?? null,
            reward: row.reward ?? null,
        });
    },

    // 도메인 -> Prisma create/update data
    toPersistenceData(entity: Quiz) {
        return {
            parentProfileId: entity.parentProfileId,
            question: entity.question,
            answer: entity.answer,
            hint: entity.hint,
            reward: entity.reward,
            publishDate: new Date(entity.publishDate.ymd), // 'yyyy-MM-dd' -> Date(UTC 자정)
        };
    },
};