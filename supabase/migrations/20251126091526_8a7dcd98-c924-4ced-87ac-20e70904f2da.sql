-- Add loading_bar_color setting if it doesn't exist
INSERT INTO settings (key, value)
VALUES ('loading_bar_color', '5 100% 66%')
ON CONFLICT (key) DO NOTHING;