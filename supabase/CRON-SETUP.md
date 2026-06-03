# Telegram Cron Jobs Setup

The `pg_cron` extension is enabled on the Supabase project. Two cron jobs
are scheduled to send Telegram summaries during Saudi trading hours.

## Schedule (UTC)

- **`telegram-daily-summary`** — `5 12 * * 0-4` (3:05 PM Saudi time, Sun-Thu)
- **`telegram-weekly-summary`** — `5 12 * * 4` (3:05 PM Saudi time, Thursday)

## Helper Function

`public.trigger_telegram_summary(p_function_name text)` calls the named
edge function via `pg_net.http_post`. Used by the cron jobs above.

## Manual Trigger

You can manually trigger a summary from SQL Editor:

```sql
SELECT public.trigger_telegram_summary('telegram-daily-summary');
```

## Re-running This SQL

If you need to recreate the cron jobs (e.g., on a fresh database):

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the helper function
CREATE OR REPLACE FUNCTION public.trigger_telegram_summary(p_function_name text)
RETURNS void AS $body$
DECLARE
  v_url text;
  v_request_id bigint;
BEGIN
  v_url := 'https://ithqdnjaephznzeegvue.supabase.co/functions/v1/' || p_function_name;
  SELECT net.http_post(url := v_url, body := '{}'::jsonb) INTO v_request_id;
  RAISE NOTICE 'Triggered %', p_function_name;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron jobs
SELECT cron.schedule(
  'telegram-daily-summary',
  '5 12 * * 0-4',
  $job$SELECT public.trigger_telegram_summary('telegram-daily-summary');$job$
);

SELECT cron.schedule(
  'telegram-weekly-summary',
  '5 12 * * 4',
  $job$SELECT public.trigger_telegram_summary('telegram-weekly-summary');$job$
);
```

## Trading Hours Logic

Both the `telegram-notify` and `telegram-daily-summary` edge functions check
Saudi trading hours before sending:
- Skip Friday and Saturday (weekend)
- Sunday-Thursday: 10:00-15:00 Saudi time (UTC+3)

So the cron is configured for the right time window — outside that, the
edge function will skip the send and log a `skipped_off_hours` status.

## Verifying

```sql
-- List all cron jobs
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;

-- See recent telegram messages
SELECT message_type, status, created_at
FROM telegram_messages
ORDER BY created_at DESC
LIMIT 10;
```
