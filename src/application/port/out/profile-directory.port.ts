
export interface ParentProfileSummary {
  profileId: number;
  name: string;
  avatarMediaId: bigint | null;
}

export interface ChildProfileSummary {
  profileId: number;
  name: string;
  avatarMediaId: bigint | null;
}

export interface FamilyProfileSummary {
  parents: ParentProfileSummary[];
  children: ChildProfileSummary[];
}

export interface ProfileDirectoryPort {
  getFamilyProfileWithScopeAll(): Promise<FamilyProfileSummary>;
  getFamilyProfileWithScopeParents(): Promise<{ parents: ParentProfileSummary[] }>;
}

