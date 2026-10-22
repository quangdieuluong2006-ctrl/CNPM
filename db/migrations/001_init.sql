-- 001_init.sql: tạo toàn bộ bảng của ThuyetMinhDB (PRD v3.0, mục 9).
-- Quy ước: thời gian lưu UTC (SYSUTCDATETIME), khóa chính INT/BIGINT IDENTITY,
-- ràng buộc đặt tên rõ ràng để dễ đọc thông báo lỗi.
-- Filtered index và view yêu cầu các tùy chọn SET này (sqlcmd mặc định tắt QUOTED_IDENTIFIER).
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Chỉ các bảng con trực tiếp, một đường tham chiếu mới dùng ON DELETE CASCADE
-- (SQL Server không cho nhiều đường cascade cùng dẫn tới một bảng).

CREATE TABLE dbo.plans (
  id                   INT IDENTITY(1,1) CONSTRAINT PK_plans PRIMARY KEY,
  name                 NVARCHAR(50) NOT NULL CONSTRAINT UQ_plans_name UNIQUE,
  max_file_size_mb     INT NOT NULL,
  max_duration_min     INT NOT NULL,
  monthly_quota_min    INT NOT NULL,
  max_target_languages TINYINT NOT NULL
);
GO

CREATE TABLE dbo.users (
  id            INT IDENTITY(1,1) CONSTRAINT PK_users PRIMARY KEY,
  email         NVARCHAR(255) NOT NULL CONSTRAINT UQ_users_email UNIQUE,
  password_hash NVARCHAR(255) NULL,
  full_name     NVARCHAR(100) NOT NULL,
  avatar_url    NVARCHAR(500) NULL,
  role          VARCHAR(10) NOT NULL CONSTRAINT DF_users_role DEFAULT 'user'
                CONSTRAINT CK_users_role CHECK (role IN ('user', 'admin')),
  status        VARCHAR(10) NOT NULL CONSTRAINT DF_users_status DEFAULT 'active'
                CONSTRAINT CK_users_status CHECK (status IN ('active', 'locked')),
  locale        VARCHAR(5) NOT NULL CONSTRAINT DF_users_locale DEFAULT 'vi'
                CONSTRAINT CK_users_locale CHECK (locale IN ('vi', 'en')),
  plan_id       INT NOT NULL CONSTRAINT FK_users_plans REFERENCES dbo.plans(id),
  created_at    DATETIME2(0) NOT NULL CONSTRAINT DF_users_created DEFAULT SYSUTCDATETIME(),
  updated_at    DATETIME2(0) NULL
);
GO

CREATE TABLE dbo.refresh_tokens (
  id         INT IDENTITY(1,1) CONSTRAINT PK_refresh_tokens PRIMARY KEY,
  user_id    INT NOT NULL CONSTRAINT FK_refresh_tokens_users
             REFERENCES dbo.users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL CONSTRAINT UQ_refresh_tokens_hash UNIQUE,
  expires_at DATETIME2(0) NOT NULL,
  revoked_at DATETIME2(0) NULL,
  created_at DATETIME2(0) NOT NULL CONSTRAINT DF_refresh_tokens_created DEFAULT SYSUTCDATETIME()
);
GO

-- Nguồn dữ liệu presence: mỗi dòng là một kết nối (tab/ứng dụng) của một user.
CREATE TABLE dbo.user_sessions (
  id              BIGINT IDENTITY(1,1) CONSTRAINT PK_user_sessions PRIMARY KEY,
  user_id         INT NOT NULL CONSTRAINT FK_sessions_users
                  REFERENCES dbo.users(id) ON DELETE CASCADE,
  client_type     VARCHAR(10) NOT NULL
                  CONSTRAINT CK_sessions_client CHECK (client_type IN ('web', 'admin', 'mobile')),
  socket_id       VARCHAR(64) NULL,
  ip_address      VARCHAR(45) NULL,
  user_agent      NVARCHAR(300) NULL,
  connected_at    DATETIME2(0) NOT NULL CONSTRAINT DF_sessions_conn DEFAULT SYSUTCDATETIME(),
  last_seen_at    DATETIME2(0) NOT NULL CONSTRAINT DF_sessions_seen DEFAULT SYSUTCDATETIME(),
  disconnected_at DATETIME2(0) NULL
);
GO
-- Filtered index: chỉ chứa phiên đang mở nên đếm người đang hoạt động rất nhanh.
CREATE INDEX IX_sessions_open ON dbo.user_sessions(last_seen_at)
  INCLUDE (user_id, client_type) WHERE disconnected_at IS NULL;
CREATE INDEX IX_sessions_user ON dbo.user_sessions(user_id, connected_at DESC);
GO

-- Nhật ký chỉ thêm, không sửa/xóa qua API.
CREATE TABLE dbo.activity_logs (
  id          BIGINT IDENTITY(1,1) CONSTRAINT PK_activity_logs PRIMARY KEY,
  user_id     INT NULL CONSTRAINT FK_activity_users REFERENCES dbo.users(id),
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(30) NULL,
  entity_id   INT NULL,
  ip_address  VARCHAR(45) NULL,
  detail      NVARCHAR(MAX) NULL CONSTRAINT CK_activity_detail_json CHECK (detail IS NULL OR ISJSON(detail) = 1),
  created_at  DATETIME2(0) NOT NULL CONSTRAINT DF_activity_created DEFAULT SYSUTCDATETIME()
);
GO
CREATE INDEX IX_activity_created ON dbo.activity_logs(created_at DESC);
CREATE INDEX IX_activity_user ON dbo.activity_logs(user_id, created_at DESC);
CREATE INDEX IX_activity_action ON dbo.activity_logs(action);
GO

CREATE TABLE dbo.languages (
  code            VARCHAR(10) NOT NULL CONSTRAINT PK_languages PRIMARY KEY,
  name_native     NVARCHAR(50) NOT NULL,
  supports_source BIT NOT NULL CONSTRAINT DF_languages_source DEFAULT 1,
  supports_target BIT NOT NULL CONSTRAINT DF_languages_target DEFAULT 1
);
GO

CREATE TABLE dbo.voices (
  id            INT IDENTITY(1,1) CONSTRAINT PK_voices PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL CONSTRAINT FK_voices_languages REFERENCES dbo.languages(code),
  name          VARCHAR(80) NOT NULL,
  gender        VARCHAR(10) NOT NULL CONSTRAINT CK_voices_gender CHECK (gender IN ('female', 'male')),
  CONSTRAINT UQ_voices_lang_gender UNIQUE (language_code, gender)
);
GO

CREATE TABLE dbo.uploads (
  id           INT IDENTITY(1,1) CONSTRAINT PK_uploads PRIMARY KEY,
  user_id      INT NOT NULL CONSTRAINT FK_uploads_users REFERENCES dbo.users(id),
  file_name    NVARCHAR(255) NOT NULL,
  size_bytes   BIGINT NOT NULL CONSTRAINT CK_uploads_size CHECK (size_bytes > 0),
  mime_type    VARCHAR(100) NOT NULL,
  duration_sec INT NULL,
  chunk_size   INT NOT NULL,
  total_chunks INT NOT NULL,
  status       VARCHAR(20) NOT NULL CONSTRAINT DF_uploads_status DEFAULT 'UPLOADING'
               CONSTRAINT CK_uploads_status CHECK (status IN ('UPLOADING', 'COMPLETED', 'CANCELED', 'EXPIRED')),
  storage_path NVARCHAR(500) NULL,
  expires_at   DATETIME2(0) NOT NULL,
  created_at   DATETIME2(0) NOT NULL CONSTRAINT DF_uploads_created DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.upload_chunks (
  upload_id   INT NOT NULL CONSTRAINT FK_chunks_uploads REFERENCES dbo.uploads(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  sha256      CHAR(64) NOT NULL,
  received_at DATETIME2(0) NOT NULL CONSTRAINT DF_chunks_received DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_upload_chunks PRIMARY KEY (upload_id, chunk_index)
);
GO

CREATE TABLE dbo.jobs (
  id                INT IDENTITY(1,1) CONSTRAINT PK_jobs PRIMARY KEY,
  user_id           INT NOT NULL CONSTRAINT FK_jobs_users REFERENCES dbo.users(id),
  upload_id         INT NOT NULL CONSTRAINT FK_jobs_uploads REFERENCES dbo.uploads(id),
  source_language   VARCHAR(10) NOT NULL,          -- 'auto' hoặc mã ngôn ngữ
  detected_language VARCHAR(10) NULL CONSTRAINT FK_jobs_detected REFERENCES dbo.languages(code),
  media_type        VARCHAR(10) NOT NULL CONSTRAINT CK_jobs_media CHECK (media_type IN ('video', 'audio')),
  voice_gender      VARCHAR(10) NOT NULL CONSTRAINT CK_jobs_voice CHECK (voice_gender IN ('female', 'male')),
  keep_background   BIT NOT NULL CONSTRAINT DF_jobs_keep_bg DEFAULT 1,
  subtitle          BIT NOT NULL CONSTRAINT DF_jobs_subtitle DEFAULT 1,
  status            VARCHAR(25) NOT NULL CONSTRAINT DF_jobs_status DEFAULT 'QUEUED'
                    CONSTRAINT CK_jobs_status CHECK (status IN ('QUEUED', 'TRANSCRIBING', 'PROCESSING',
                      'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELED')),
  idempotency_key   VARCHAR(64) NULL,
  created_at        DATETIME2(0) NOT NULL CONSTRAINT DF_jobs_created DEFAULT SYSUTCDATETIME(),
  updated_at        DATETIME2(0) NOT NULL CONSTRAINT DF_jobs_updated DEFAULT SYSUTCDATETIME(),
  deleted_at        DATETIME2(0) NULL
);
GO
-- Cùng một user gửi lại cùng Idempotency-Key thì không tạo Job mới.
CREATE UNIQUE INDEX UX_jobs_idempotency ON dbo.jobs(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
-- Hàng đợi: Worker lấy Job QUEUED cũ nhất.
CREATE INDEX IX_jobs_queue ON dbo.jobs(created_at) WHERE status = 'QUEUED';
CREATE INDEX IX_jobs_user ON dbo.jobs(user_id, created_at DESC);
GO

CREATE TABLE dbo.job_targets (
  id            INT IDENTITY(1,1) CONSTRAINT PK_job_targets PRIMARY KEY,
  job_id        INT NOT NULL CONSTRAINT FK_targets_jobs REFERENCES dbo.jobs(id),
  language_code VARCHAR(10) NOT NULL CONSTRAINT FK_targets_languages REFERENCES dbo.languages(code),
  status        VARCHAR(20) NOT NULL CONSTRAINT DF_targets_status DEFAULT 'QUEUED'
                CONSTRAINT CK_targets_status CHECK (status IN ('QUEUED', 'TRANSLATING', 'SYNTHESIZING',
                  'MIXING', 'COMPLETED', 'FAILED', 'SKIPPED', 'CANCELED')),
  progress      TINYINT NOT NULL CONSTRAINT DF_targets_progress DEFAULT 0
                CONSTRAINT CK_targets_progress CHECK (progress BETWEEN 0 AND 100),
  attempt       TINYINT NOT NULL CONSTRAINT DF_targets_attempt DEFAULT 1,
  sequence      INT NOT NULL CONSTRAINT DF_targets_sequence DEFAULT 0,
  error_code    VARCHAR(50) NULL,
  updated_at    DATETIME2(0) NOT NULL CONSTRAINT DF_targets_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_targets_job_lang UNIQUE (job_id, language_code)
);
GO

CREATE TABLE dbo.outputs (
  id            INT IDENTITY(1,1) CONSTRAINT PK_outputs PRIMARY KEY,
  job_target_id INT NOT NULL CONSTRAINT FK_outputs_targets REFERENCES dbo.job_targets(id),
  format        VARCHAR(5) NOT NULL CONSTRAINT CK_outputs_format CHECK (format IN ('mp4', 'mp3', 'srt')),
  storage_path  NVARCHAR(500) NOT NULL,
  size_bytes    BIGINT NOT NULL,
  created_at    DATETIME2(0) NOT NULL CONSTRAINT DF_outputs_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_outputs_target_format UNIQUE (job_target_id, format)
);
GO

CREATE TABLE dbo.notifications (
  id         INT IDENTITY(1,1) CONSTRAINT PK_notifications PRIMARY KEY,
  user_id    INT NOT NULL CONSTRAINT FK_notifications_users REFERENCES dbo.users(id),
  job_id     INT NOT NULL CONSTRAINT FK_notifications_jobs REFERENCES dbo.jobs(id),
  type       VARCHAR(30) NOT NULL CONSTRAINT CK_notifications_type CHECK (type IN ('job.completed', 'job.failed')),
  read_at    DATETIME2(0) NULL,
  created_at DATETIME2(0) NOT NULL CONSTRAINT DF_notifications_created DEFAULT SYSUTCDATETIME()
);
GO
CREATE INDEX IX_notifications_user ON dbo.notifications(user_id, read_at, created_at DESC);
GO

CREATE TABLE dbo.devices (
  id         INT IDENTITY(1,1) CONSTRAINT PK_devices PRIMARY KEY,
  user_id    INT NOT NULL CONSTRAINT FK_devices_users REFERENCES dbo.users(id) ON DELETE CASCADE,
  push_token VARCHAR(255) NOT NULL CONSTRAINT UQ_devices_token UNIQUE,
  platform   VARCHAR(10) NOT NULL CONSTRAINT CK_devices_platform CHECK (platform IN ('ios', 'android')),
  locale     VARCHAR(5) NOT NULL CONSTRAINT DF_devices_locale DEFAULT 'vi',
  created_at DATETIME2(0) NOT NULL CONSTRAINT DF_devices_created DEFAULT SYSUTCDATETIME()
);
GO
