import { deriveStatus, type QuizStatus } from '../policy/quiz.policy';
import { todayYmd } from '../../utils/date.util';

export class Quiz {
    constructor(
        public question: string,
        public answer: string,
        public publishDate: string, // yyyy-MM-dd(문자열)
        public authorParentProfileId: bigint,
        public hint?: string | null,
        public reward?: string | null,
        public id?: bigint, // 저장 전엔 없음, 저장 후 채워짐
    ) {}


    static create(args: {
        question: string;
        answer: string;
        publishDate: string;
        authorParentProfileId: bigint;
        hint?: string | null;
        reward?: string | null;
    }): Quiz {
        const question = (args.question ?? '').trim();
        const answer = (args.answer ?? '').trim();

        if (!question) throw new Error('VALIDATION_ERROR: question required');
        if (!answer) throw new Error('VALIDATION_ERROR: answer required');
        if (!isValidYmd(args.publishDate)) {
            throw new Error('VALIDATION_ERROR: publishDate must be yyyy-MM-dd');
        }

        return new Quiz(
            question,
            answer,
            args.publishDate,
            args.authorParentProfileId,
            args.hint ?? null,
            args.reward ?? null,
        );
    }
}

/** 내부 헬퍼: yyyy-MM-dd 유효성 */
function isValidYmd(ymd: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return false;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}