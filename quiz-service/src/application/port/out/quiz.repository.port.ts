import type { Quiz } from '../../../domain/model/quiz';

export interface QuizRepositoryPort {
    save(quiz: Quiz): Promise<Quiz>;
    findLastScheduledDateByFamily(parentProfileId: number | string): Promise<string | null>;
    findById(id: number): Promise<Quiz | null>;
}