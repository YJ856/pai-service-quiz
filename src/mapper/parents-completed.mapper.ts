import { Injectable } from "@nestjs/common";
import { ParentsCompletedQueryDto } from "src/adapter/in/http/dto/request/parents-completed.query.dto";
import { ParentsCompletedResponseData } from "pai-shared-types";
import { ParentsCompletedCommand } from "src/application/command/parents-completed.command";

@Injectable()
export class ParentsCompletedMapper {
  toCommand(query: ParentsCompletedQueryDto, parentProfileId: number): ParentsCompletedCommand {
    return new ParentsCompletedCommand(
      parentProfileId,
      query.limit ?? 20,
      query.cursor,
    );
  }

  toResponse(result: ParentsCompletedResponseData): ParentsCompletedResponseData {
    return {
      ...result,
      nextCursor: result.nextCursor ?? null,
    };
  }
}