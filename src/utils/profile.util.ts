/**
 * 프로필 조회 헬퍼 유틸리티
 * - 모든 ID는 bigint 타입 사용
 */

import type {
  ProfileDirectoryPort,
  ParentProfileSummary,
  ChildProfileSummary,
} from '../application/port/out/profile-directory.port';

/**
 * 부모 프로필 안전 조회 (단일)
 */
export async function getParentProfileSafe(
  profiles: ProfileDirectoryPort,
  id: number
): Promise<ParentProfileSummary | null> {
  try {
    return await profiles.getParentProfile(id);
  } catch {
    return null;
  }
}

/**
 * 자녀 프로필 안전 조회 (배치)
 * Record<string, ...>로 반환 (키는 profileId.toString())
 */
export async function getChildProfilesSafe(
  profiles: ProfileDirectoryPort,
  ids: number[]
): Promise<Record<string, ChildProfileSummary>> {
  try {
    return await profiles.getChildProfiles(ids);
  } catch {
    return {};
  }
}

/**
 * 부모 프로필 안전 조회 (배치)
 * Record<string, ...>로 반환 (키는 profileId.toString())
 */
export async function getParentProfilesSafe(
  profiles: ProfileDirectoryPort,
  ids: number[]
): Promise<Record<string, ParentProfileSummary>> {
  try {
    if (ids.length === 0) return {};
    const results = await Promise.all(
      ids.map(async (id: number) => {
        try {
          const profile = await profiles.getParentProfile(id);
          return profile ? ([id.toString(), profile] as const) : null;
        } catch {
          return null;
        }
      })
    );
    return Object.fromEntries(
      results.filter((r): r is [string, ParentProfileSummary] => r !== null)
    );
  } catch {
    return {};
  }
}

/**
 * 아이템에서 자녀 프로필 ID 수집
 */
export function collectChildProfileIds(items: Array<{ children: Array<{ childProfileId: number }> }>): number[] {
  const set = new Set<number>();
  for (const item of items) {
    for (const child of item.children) {
      set.add(child.childProfileId);
    }
  }
  return Array.from(set);
}

/**
 * 아이템에서 부모 프로필 ID 수집
 */
export function collectParentProfileIds(items: Array<{ authorParentProfileId: number }>): number[] {
  const set = new Set<number>();
  for (const item of items) {
    set.add(item.authorParentProfileId);
  }
  return Array.from(set);
}
