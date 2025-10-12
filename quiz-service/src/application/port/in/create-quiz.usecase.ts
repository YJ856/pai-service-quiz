// 컨트롤러가 호출할 계약 (구현X)

/**
 * 절대 하면 안 되는 것
 * 여기서 DB/Prisma/외부 API import X
 * 여기서 로직/조건분기/날짜계산 등 구현 X
 * 여기서 Nest 데코레이터(@Ingectable 등) 사용 X - 그냥 타입 계약만
 */

// 여기서는 type만 필요
import type { CreateQuizCommand } from '../../command/create-quiz.command';
import type { Quiz } from '../../../domain/model/quiz';

/**
 * 부모가 퀴즈를 생성하는 유즈케이스의 "계약"
 * 컨트롤러는 이 인터페이스만 알고, 구현은 application/use-cases에 둔다.
 */

export interface CreateQuizUseCase { // 컨트롤러 -> 유즈케이스(피호출자)의 계약에 의존
    execute(command: CreateQuizCommand): Promise<Quiz>;
    /** 약속
     * execute라는 이름의 함수가 반드시 존재하고, 
     * 입력은 CreateQuizCommand 1개,
     * 출력은 Promise<Quiz> (도메인 객체)
     */
}

