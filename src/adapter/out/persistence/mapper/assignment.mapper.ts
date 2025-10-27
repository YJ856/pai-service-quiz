import type { Assignment as AssignmentRow } from "@prisma/client";
import { Assignment } from "src/domain/model/assignment";

export const AssignmentMapper = {
    toDomain(row: AssignmentRow): Assignment {
        return Assignment.rehydrate({
            id: row.id,
            quizId: row.quizId,
            childProfileId: row.childProfileId,
            isSolved: row.isSolved,
            rewardGranted: row.rewardGranted,
        });
    },

    toPersistenceData(e: Assignment) {
        return {
            quizId: e.quizId,
            childProfileId: e.childProfileId,
            isSolved: e.isSolved,
            rewardGranted: e.rewardGranted,
        };
    },
};