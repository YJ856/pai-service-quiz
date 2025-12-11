import { Injectable } from '@nestjs/common';
import { UpdateQuizRequestDto } from 'src/adapter/in/http/dto/request/parents-update-quiz-request.dto';
import { UpdateQuizResponseData } from 'pai-shared-types';
import { UpdateQuizResponseResult } from 'src/application/port/in/result/parents-update-quiz-result.dto';
import { ParentsUpdateQuizCommand } from 'src/application/command/parents-update-quiz.command';
import { Quiz } from 'src/domain/model/quiz';
import { todayYmdKST } from 'src/utils/date.util';

const hasKey = <T extends object>(o: T, k: keyof any): k is keyof T =>
  o != null && Object.prototype.hasOwnProperty.call(o, k);

const isEditable = (
  publishDate: string | null,
  currentParentProfileId: number,
  authorParentProfileId: number | null,
  today: string,
): boolean => {
  // 작성자만 수정 가능
  if (currentParentProfileId !== authorParentProfileId) {
    return false;
  }
  // publishDate가 없거나 오늘 이후인 경우에만 수정 가능
  if (!publishDate || publishDate > today) {
    return true;
  }
  return false;
};

@Injectable()
export class UpdateQuizMapper {
  toCommand(
    quizId: string,
    parentProfileId: number,
    dto: UpdateQuizRequestDto,
  ): ParentsUpdateQuizCommand {
    const question = hasKey(dto, 'question') ? dto.question : undefined;
    const answer = hasKey(dto, 'answer') ? dto.answer : undefined;
    const hint = hasKey(dto, 'hint') ? dto.hint : undefined;
    const reward = hasKey(dto, 'reward') ? dto.reward : undefined;
    const publishDate = hasKey(dto, 'publishDate')
      ? dto.publishDate
      : undefined;

    return new ParentsUpdateQuizCommand(
      BigInt(quizId), // string -> bigint 변환
      parentProfileId,
      question,
      answer,
      hint,
      reward,
      publishDate,
    );
  }

  // Service용 - Result DTO 사용
  toResponseResult(
    quiz: Quiz,
    currentParentProfileId: number,
  ): UpdateQuizResponseResult {
    const today = todayYmdKST();
    const publishDate = quiz.getPublishDate();

    return {
      quizId: quiz.getId()!,
      question: quiz.getQuestion(),
      answer: quiz.getAnswer(),
      hint: quiz.getHint(),
      reward: quiz.getReward(),
      publishDate: publishDate.ymd,
      isEditable: isEditable(
        publishDate.ymd,
        currentParentProfileId,
        quiz.getParentProfileId(),
        today,
      ),
    };
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(result: UpdateQuizResponseResult): UpdateQuizResponseData {
    return {
      quizId: result.quizId.toString(), // bigint -> string 변환
      question: result.question,
      answer: result.answer,
      hint: result.hint,
      reward: result.reward,
      publishDate: result.publishDate,
      isEditable: result.isEditable,
    };
  }
}
