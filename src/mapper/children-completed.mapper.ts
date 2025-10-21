// src/adapter/in/http/mapper/children-completed.mapper.ts
import { Injectable } from '@nestjs/common';
import { ChildrenCompletedQueryDto } from 'src/adapter/in/http/dto/children-completed.query.dto'; // 로컬 DTO 클래스
import { ChildrenCompletedCommand } from 'src/application/command/children-completed.command';
import type { ChildrenCompletedResponseData, } from 'pai-shared-types'; // 출력은 shared 타입으로 계약 고정

@Injectable()
export class ChildrenCompletedMapper {
  // 입력: 로컬 DTO 클래스(검증 통과한 값이 들어옴)
  toCommand(query: ChildrenCompletedQueryDto, childProfileId: number): ChildrenCompletedCommand {
    return new ChildrenCompletedCommand(
      childProfileId,           // number로 전달
      query.limit ?? 20,        // 기본값만 보조
      query.cursor              // undefined | base64 string
    );
  }

  toResponse(result: ChildrenCompletedResponseData): 
  ChildrenCompletedResponseData {
      return { 
        ...result, 
        nextCursor: result.nextCursor ?? null };
    }
}
