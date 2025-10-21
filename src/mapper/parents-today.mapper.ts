import { Injectable } from "@nestjs/common";
import { ParentsTodayQueryDto } from "src/adapter/in/http/dto/request/parents-today.query.dto";
import { ParentsTodayResponseData } from "pai-shared-types";
import { ParentsTodayCommand } from "src/application/command/parents-today.command";

@Injectable()
export class ParentsTodayMapper {
  toCommand(query: ParentsTodayQueryDto, parentProfileId: number): ParentsTodayCommand {
    return new ParentsTodayCommand(
      parentProfileId,
      query.limit ?? 20,
      query.cursor,
    );
  }

  toResponse(result: ParentsTodayResponseData): ParentsTodayResponseData {
    return {
      ...result,
      nextCursor: result.nextCursor ?? null,
    };
  }
}