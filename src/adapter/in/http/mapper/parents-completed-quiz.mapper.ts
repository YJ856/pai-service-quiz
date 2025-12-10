import { Injectable } from "@nestjs/common";
import { ParentsCompletedQueryParam } from "src/adapter/in/http/dto/request/parents-completed-quiz-request.dto";
import type { ParentsCompletedResponseData } from "pai-shared-types";
import type { ParentsCompletedResponseResult } from "src/application/port/in/result/parents-completed-quiz-result.dto";
import { ParentsCompletedQuizCommand } from "src/application/command/parents-completed-quiz.command";

@Injectable()
export class ParentsCompletedMapper {
  toCommand(query: ParentsCompletedQueryParam, parentProfileId: number): ParentsCompletedQuizCommand {
    return new ParentsCompletedQuizCommand(
      parentProfileId, 
      query.limit ?? 20,
      query.cursor,
    );
  }

  toResponse(result: ParentsCompletedResponseResult): ParentsCompletedResponseData {
    return {
      items: result.items.map(item => ({
        quizId: item.quizId.toString(), // bigint -> string
        publishDate: item.publishDate,
        question: item.question,
        answer: item.answer,
        reward: item.reward,
        authorParentProfileId: item.authorParentProfileId,
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId: item.authorParentAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
        children: item.children.map(child => ({
          childProfileId: child.childProfileId,
          childName: child.childName,
          childAvatarMediaId: child.childAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
          isSolved: child.isSolved,
          rewardGranted: child.rewardGranted,
        })),
      })),
      nextCursor: result.nextCursor ?? null,
      hasNext: result.hasNext,
    };
  }
}