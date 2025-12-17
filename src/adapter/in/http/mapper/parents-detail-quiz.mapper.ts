import { Injectable } from '@nestjs/common';
import { ParentsQuizDetailResponseData } from 'pai-shared-types';
import { ParentsQuizDetailResponseResult } from 'src/application/port/in/result/parents-detail-quiz-result.dto';
import { ParentsDetailQuizCommand } from 'src/application/command/parents-detail-quiz.command';
import { Quiz } from 'src/domain/model/quiz';
import { todayYmdKST } from 'src/utils/date.util';

const isEditable = (
  publishDate: string,
  currentParentProfileId: number,
  authorParentProfileId: number,
  today: string,
): boolean => {
  // 작성자만 수정 가능
  if (currentParentProfileId !== authorParentProfileId) {
    return false;
  }
  // publishDate가 오늘 이후인 경우에만 수정 가능
  if (publishDate > today) {
    return true;
  }
  return false;
};

@Injectable()
export class DetailQuizMapper {
  toCommand(quizId: string, parentProfileId: number): ParentsDetailQuizCommand {
    return new ParentsDetailQuizCommand(
      BigInt(quizId), // string -> bigint 변환
      parentProfileId,
    );
  }

  // Controller용 - Result를 shared-types로 변환
  toResponse(
    result: ParentsQuizDetailResponseResult,
  ): ParentsQuizDetailResponseData {
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

  // Service용 - Result DTO 사용
  toResponseResult(
    quiz: Quiz,
    currentParentProfileId: number,
  ): ParentsQuizDetailResponseResult {
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
}
