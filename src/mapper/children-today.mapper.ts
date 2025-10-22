import { Injectable } from "@nestjs/common";
import { ChildrenTodayQueryDto } from "src/adapter/in/http/dto/request/children-today.query.dto";
import type { ChildrenTodayResponseData } from "pai-shared-types";
import type { ChildrenTodayResponseResult } from "src/application/port/in/result/children-today.result.dto";
import { ChildrenTodayCommand } from "src/application/command/children-today.command";

@Injectable()
export class ChildrenTodayMapper {
  toCommand(query: ChildrenTodayQueryDto, childProfileId: number): ChildrenTodayCommand {
    return new ChildrenTodayCommand(
      BigInt(childProfileId),
      query.limit ?? 20,
      query.cursor
    );
  }

  toResponse(result: ChildrenTodayResponseResult): ChildrenTodayResponseData {
    return {
      items: result.items.map(item => ({
        quizId: item.quizId.toString(), // bigint -> string
        question: item.question,
        hint: item.hint,
        reward: item.reward,
        authorParentProfileId: item.authorParentProfileId.toString(), // number -> string
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId: item.authorParentAvatarMediaId?.toString() ?? null, // number | null -> string | null
        isSolved: item.isSolved,
      })),
      nextCursor: result.nextCursor ?? null,
      hasNext: result.hasNext,
    };
  }
}