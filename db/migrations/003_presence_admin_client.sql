-- 003_presence_admin_client.sql: thêm cột on_admin để Web Admin hiển thị đủ loại client (web/mobile/admin).
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Giữ nguyên định nghĩa "đang hoạt động": phiên chưa đóng + nhịp tim trong 60 giây (PRD v3.0, mục 3.7, Phụ lục C).
CREATE OR ALTER VIEW dbo.v_active_users AS
SELECT s.user_id, u.full_name, u.email, u.role,
       MAX(s.last_seen_at) AS last_seen_at,
       MIN(s.connected_at) AS online_since,
       COUNT(*)            AS open_sessions,
       MAX(CASE WHEN s.client_type = 'mobile' THEN 1 ELSE 0 END) AS on_mobile,
       MAX(CASE WHEN s.client_type = 'web'    THEN 1 ELSE 0 END) AS on_web,
       MAX(CASE WHEN s.client_type = 'admin'  THEN 1 ELSE 0 END) AS on_admin
FROM dbo.user_sessions s
JOIN dbo.users u ON u.id = s.user_id
WHERE s.disconnected_at IS NULL
  AND s.last_seen_at > DATEADD(SECOND, -60, SYSUTCDATETIME())
GROUP BY s.user_id, u.full_name, u.email, u.role;
GO
