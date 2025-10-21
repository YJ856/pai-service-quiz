import { Injectable } from "@nestjs/common";
import { ParentsScheduledQueryDto } from "src/adapter/in/http/dto/request/parents-scheduled.query.dto";
import { ParentsScheduledResponseData } from "pai-shared-types";
import { ParentsScheduledCommand } from "src/application/command/parents-scheduled.command";

@Injectable()
export class ParentsScheduledMapper {
  toCommand(query: ParentsScheduledQueryDto, parentProfileId: number): ParentsScheduledCommand {
    return new ParentsScheduledCommand(
      parentProfileId,
      query.limit ?? 20,
      query.cursor,
    );
  }

  toResponse(result: ParentsScheduledResponseData): ParentsScheduledResponseData {
    return {
      ...result,
      nextCursor: result.nextCursor ?? null,
    };
  }
}