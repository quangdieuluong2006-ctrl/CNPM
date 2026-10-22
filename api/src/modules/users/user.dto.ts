import type { UserRow } from "../auth/auth.repository.js";

// Dữ liệu người dùng trả cho client – không bao giờ chứa password_hash.
export function toUserDto(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    avatarUrl: u.avatar_url,
    role: u.role,
    status: u.status,
    locale: u.locale,
    createdAt: u.created_at,
    plan: {
      id: u.plan_id,
      name: u.plan_name,
      maxFileSizeMb: u.max_file_size_mb,
      maxDurationMin: u.max_duration_min,
      monthlyQuotaMin: u.monthly_quota_min,
      maxTargetLanguages: u.max_target_languages,
    },
  };
}
export type UserDto = ReturnType<typeof toUserDto>;
