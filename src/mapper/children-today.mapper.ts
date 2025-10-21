import { Injectable } from "@nestjs/common";
import { ChildrenTodayQueryDto } from "src/adapter/in/http/dto/request/children-today.query.dto";
import type { ChildrenTodayResponseData } from "pai-shared-types";
import { ChildrenTodayCommand } from "src/application/command/children-today.command";

@Injectable()
export class ChildrenTodayMapper {
  toCommand(query: ChildrenTodayQueryDto, childProfileId: number): ChildrenTodayCommand {
    return new ChildrenTodayCommand(
      childProfileId,
      query.limit ?? 20,
      query.cursor
    );
  }

  toResponse(result: ChildrenTodayResponseData): 
  ChildrenTodayResponseData {
    return { 
      ...result, 
      nextCursor: result.nextCursor ?? null };
  }
}