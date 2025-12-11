import type { Assignment as AssignmentRow } from '@prisma/client';
import { Assignment } from 'src/domain/model/assignment';

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

  toPersistenceData(assignment: Assignment) {
    return {
      quizId: assignment.getQuizId(),
      childProfileId: assignment.getChildProfileId(),
      isSolved: assignment.getIsSolved(),
      rewardGranted: assignment.getRewardGranted(),
    };
  },
};
