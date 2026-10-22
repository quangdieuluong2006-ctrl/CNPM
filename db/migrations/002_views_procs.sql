-- 002_views_procs.sql: view và stored procedure phục vụ presence và dashboard (PRD v3.0, mục 3.7, 9.3).
-- Filtered index và view yêu cầu các tùy chọn SET này (sqlcmd mặc định tắt QUOTED_IDENTIFIER).
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Người dùng đang hoạt động: còn phiên chưa đóng và có nhịp tim trong 60 giây gần nhất.
-- Một user mở nhiều tab/thiết bị chỉ là MỘT dòng (GROUP BY user).
CREATE OR ALTER VIEW dbo.v_active_users AS
SELECT s.user_id, u.full_name, u.email, u.role,
       MAX(s.last_seen_at) AS last_seen_at,
       MIN(s.connected_at) AS online_since,
       COUNT(*)            AS open_sessions,
       MAX(CASE WHEN s.client_type = 'mobile' THEN 1 ELSE 0 END) AS on_mobile,
       MAX(CASE WHEN s.client_type = 'web'    THEN 1 ELSE 0 END) AS on_web
FROM dbo.user_sessions s
JOIN dbo.users u ON u.id = s.user_id
WHERE s.disconnected_at IS NULL
  AND s.last_seen_at > DATEADD(SECOND, -60, SYSUTCDATETIME())
GROUP BY s.user_id, u.full_name, u.email, u.role;
GO

-- Hạn mức đã dùng trong tháng hiện tại (phút xử lý = thời lượng nguồn x số ngôn ngữ hoàn tất).
CREATE OR ALTER VIEW dbo.v_monthly_usage AS
SELECT j.user_id,
       SUM(CEILING(ISNULL(up.duration_sec, 0) / 60.0)) AS used_min
FROM dbo.job_targets t
JOIN dbo.jobs j     ON j.id = t.job_id
JOIN dbo.uploads up ON up.id = j.upload_id
WHERE t.status = 'COMPLETED'
  AND j.created_at >= DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
GROUP BY j.user_id;
GO

-- Thống kê cho Admin Dashboard; "hôm nay" tính theo giờ Việt Nam.
CREATE OR ALTER PROCEDURE dbo.sp_admin_dashboard_stats AS
BEGIN
  SET NOCOUNT ON;
  -- 00:00 hôm nay theo giờ Việt Nam, đổi về UTC để so với dữ liệu lưu UTC
  DECLARE @todayLocal DATE = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC'
          AT TIME ZONE 'SE Asia Standard Time' AS DATE);
  DECLARE @todayUtc DATETIME2(0) = CAST(CAST(@todayLocal AS DATETIME2(0))
          AT TIME ZONE 'SE Asia Standard Time' AT TIME ZONE 'UTC' AS DATETIME2(0));
  SELECT
    (SELECT COUNT(*) FROM dbo.users WHERE role = 'user') AS total_users,
    (SELECT COUNT(*) FROM dbo.v_active_users WHERE role = 'user') AS active_users,
    (SELECT COUNT(DISTINCT s.user_id)
       FROM dbo.user_sessions s JOIN dbo.users u ON u.id = s.user_id
      WHERE u.role = 'user' AND s.last_seen_at >= @todayUtc) AS daily_active_users,
    (SELECT COUNT(*) FROM dbo.jobs
      WHERE created_at >= @todayUtc AND deleted_at IS NULL) AS jobs_today,
    (SELECT COUNT(*) FROM dbo.jobs
      WHERE status IN ('QUEUED', 'TRANSCRIBING', 'PROCESSING') AND deleted_at IS NULL) AS jobs_processing,
    (SELECT COUNT(*) FROM dbo.jobs
      WHERE status = 'FAILED' AND updated_at >= @todayUtc) AS jobs_failed_today;
END;
GO
