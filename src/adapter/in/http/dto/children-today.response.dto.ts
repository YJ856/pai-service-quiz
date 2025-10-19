import { Expose, Type } from 'class-transformer';
import type { 
    ChildrenTodayItemDto as SharedItem,
    ChildrenTodayResponseData as SharedResp,
 } from 'pai-shared-types';

 export class ChildrenTodayItemDto implements SharedItem {
    @Expose() quizId!: string;
    @Expose() question!: string;
    @Expose() hint!: string | null;
    @Expose() reward!: string | null;
    @Expose() authorParentProfileId!: string;
    @Expose() authorParentName: string;
    @Expose() authorParentAvatarMediaId!: string | null;
    @Expose() isSolved!: boolean;
 }

 export class ChildrenTodayResponseData implements SharedResp {
    @Expose() @Type(() => ChildrenTodayItemDto)
    items!: ChildrenTodayItemDto[];

    @Expose() nextCursor!: string | null;
    @Expose() hasNext!: boolean;
 }