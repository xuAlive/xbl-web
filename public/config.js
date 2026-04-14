// 运行时配置文件
// 使用相对路径，通过 Nginx 代理转发到后端
window.__APP_CONFIG__ = {
  // 本地直连测试地址（不走 Nginx）:
  // BLOG_API_URL: "http://127.0.0.1:6101/blog",
  // SCHEDULE_API_URL: "http://127.0.0.1:6101/schedule",
  // CALENDAR_API_URL: "http://127.0.0.1:6101/calendar",
  // TIMESHEET_API_URL: "http://127.0.0.1:6101/timesheet",
  BLOG_API_URL: "/blog",
  SCHEDULE_API_URL: "/schedule",
  CALENDAR_API_URL: "/calendar",
  TIMESHEET_API_URL: "/timesheet",
  LOGIN_BG_INDEX: 2,
  LOGIN_BG_IMAGES: [
    "/images/blog20260114210536_53_43.jpg",
    "/images/blog20260114210537_54_43.jpg"
  ]
};
