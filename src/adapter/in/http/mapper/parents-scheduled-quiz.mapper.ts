import { Injectable } from '@nestjs/common';
import { ParentsScheduledQueryParam } from 'src/adapter/in/http/dto/request/parents-scheduled-quiz-request.dto';
import type { ParentsScheduledResponseData } from 'pai-shared-types';
import type { ParentsScheduledResponseResult } from 'src/application/port/in/result/parents-scheduled-quiz-result.dto';
import { ParentsScheduledQuizCommand } from 'src/application/command/parents-scheduled-quiz.command';

@Injectable()
export class ParentsScheduledMapper {
  toCommand(
    query: ParentsScheduledQueryParam,
    parentProfileId: number,
  ): ParentsScheduledQuizCommand {
    return new ParentsScheduledQuizCommand(
      parentProfileId, // number -> bigint 변환
      query.limit ?? 20,
      query.cursor,
    );
  }

  toResponse(
    result: ParentsScheduledResponseResult,
  ): ParentsScheduledResponseData {
    return {
      items: result.items.map((item) => ({
        quizId: item.quizId.toString(), // bigint -> string
        publishDate: item.publishDate,
        question: item.question,
        answer: item.answer,
        hint: item.hint,
        reward: item.reward,
        authorParentProfileId: item.authorParentProfileId,
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId:
          item.authorParentAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
        isEditable: item.isEditable,
      })),
      nextCursor: result.nextCursor ?? null,
      hasNext: result.hasNext,
    };
  }
}
