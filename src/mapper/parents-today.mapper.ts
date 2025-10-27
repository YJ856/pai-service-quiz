import { Injectable } from "@nestjs/common";
import { ParentsTodayQueryDto } from "src/adapter/in/http/dto/request/parents-today-quiz-request.dto";
import type { ParentsTodayResponseData } from "pai-shared-types";
import type { ParentsTodayResponseResult } from "src/application/port/in/result/parents-today.result.dto";
import { ParentsTodayCommand } from "src/application/command/parents-today.command";

@Injectable()
export class ParentsTodayMapper {
  toCommand(query: ParentsTodayQueryDto, parentProfileId: number): ParentsTodayCommand {
    return new ParentsTodayCommand(
      BigInt(parentProfileId), // number -> bigint 변환
      query.limit ?? 20,
      query.cursor,
    );
  }

  toResponse(result: ParentsTodayResponseResult): ParentsTodayResponseData {
    return {
      items: result.items.map(item => ({
        quizId: item.quizId.toString(), // bigint -> string
        question: item.question,
        answer: item.answer,
        hint: item.hint,
        reward: item.reward,
        authorParentProfileId: item.authorParentProfileId.toString(), // bigint -> string
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId: item.authorParentAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
        children: item.children.map(child => ({
          childProfileId: child.childProfileId.toString(), // bigint -> string
          childName: child.childName,
          childAvatarMediaId: child.childAvatarMediaId?.toString() ?? null, // bigint | null -> string | null
          isSolved: child.isSolved,
        })),
      })),
      nextCursor: result.nextCursor ?? null,
      hasNext: result.hasNext,
    };
  }
}