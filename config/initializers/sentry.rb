# Error monitoring, tracing and logs (on by default in sentry-ruby 7). Nothing is sent without SENTRY_DSN.
Sentry.init do |config|
  config.dsn = ENV["SENTRY_DSN"]
  # The test container loads .env too, so keep specs from reporting.
  config.enabled_environments = %w[development production]
  config.breadcrumbs_logger = [ :active_support_logger, :http_logger ]
  # Every trace locally so they show up while developing; a sample in production.
  config.traces_sample_rate = Rails.env.production? ? 0.1 : 1.0
end
