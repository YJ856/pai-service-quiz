// src/adapter/in/http/mapper/children-completed.mapper.ts
import { Injectable } from '@nestjs/common';
import { ChildrenCompletedQueryDto } from 'src/adapter/in/http/dto/request/children-completed.query.dto'; // 로컬 DTO 클래스
import { ChildrenCompletedCommand } from 'src/application/command/children-completed.command';
import type { ChildrenCompletedResponseData } from 'pai-shared-types'; // 출력은 shared 타입으로 계약 고정
import type { ChildrenCompletedResponseResult } from 'src/application/port/in/result/children-completed.result.dto';

@Injectable()
export class ChildrenCompletedMapper {
  // 입력: 로컬 DTO 클래스(검증 통과한 값이 들어옴)
  toCommand(query: ChildrenCompletedQueryDto, childProfileId: number): ChildrenCompletedCommand {
    return new ChildrenCompletedCommand(
      BigInt(childProfileId),   // BigInt로 전달
      query.limit ?? 20,        // 기본값만 보조
      query.cursor              // undefined | base64 string
    );
  }

  toResponse(result: ChildrenCompletedResponseResult): ChildrenCompletedResponseData {
    return {
      items: result.items.map(item => ({
        quizId: item.quizId.toString(), // bigint -> string
        publishDate: item.publishDate,
        question: item.question,
        answer: item.answer,
        reward: item.reward,
        authorParentProfileId: item.authorParentProfileId.toString(), // number -> string
        authorParentName: item.authorParentName,
        authorParentAvatarMediaId: item.authorParentAvatarMediaId?.toString() ?? null, // number | null -> string | null
      })),
      nextCursor: result.nextCursor ?? null,
      hasNext: result.hasNext,
    };
  }
}
