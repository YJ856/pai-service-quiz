import { Injectable } from "@nestjs/common";
import type { NextPublishDateData } from "pai-shared-types";

@Injectable()
export class NextPublishDateMapper {
    toResponseData(ymd: string): NextPublishDateData {
        return { defaultPublishDate: ymd };
    }
}