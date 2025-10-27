import { Injectable } from "@nestjs/common";
import { ParentsCompletedQueryDto } from "src/adapter/in/http/dto/request/parents-completed-quiz-request.dto";
import type { ParentsCompletedResponseData } from "pai-shared-types";
import type { ParentsCompletedResponseResult } from "src/application/port/in/result/parents-completed.result.dto";
import { ParentsCompletedCommand } from "src/application/command/parents-completed.command";

@Injectable()
export class ParentsCompletedMapper {
  toCommand(query: ParentsCompletedQueryDto, parentProfileId: number): ParentsCompletedCommand {
    return new ParentsCompletedCommand(
      BigInt(parentProfileId), // number -> bigint 변환
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
        authorParentProfileId: item.authorParentProfileId.toString(), // bigint -> string
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId: item.authorParentAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
        children: item.children.map(child => ({
          childProfileId: child.childProfileId.toString(), // bigint -> string
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