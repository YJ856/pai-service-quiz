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
  id: bigint | number
): Promise<ParentProfileSummary | null> {
  try {
    const bigintId = typeof id === 'bigint' ? id : BigInt(id);
    return await profiles.getParentProfile(bigintId);
  } catch {
    return null;
  }
}

/**
 * 자녀 프로필 안전 조회 (배치)
 */
export async function getChildProfilesSafe(
  profiles: ProfileDirectoryPort,
  ids: bigint[] | number[]
): Promise<Record<string, ChildProfileSummary>> {
  try {
    const bigintIds = ids.map((id: bigint | number) => typeof id === 'bigint' ? id : BigInt(id));
    return await profiles.getChildProfiles(bigintIds);
  } catch {
    return {};
  }
}

/**
 * 부모 프로필 안전 조회 (배치)
 */
export async function getParentProfilesSafe(
  profiles: ProfileDirectoryPort,
  ids: bigint[] | number[]
): Promise<Record<string, ParentProfileSummary>> {
  try {
    if (ids.length === 0) return {};
    const results = await Promise.all(
      ids.map(async (id: bigint | number) => {
        try {
          const bigintId = typeof id === 'bigint' ? id : BigInt(id);
          const profile = await profiles.getParentProfile(bigintId);
          return profile ? ([bigintId.toString(), profile] as const) : null;
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
