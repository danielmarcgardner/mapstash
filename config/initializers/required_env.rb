# Fail on boot, with a clear message, rather than on the first request that needs these.
if Rails.env.production?
  missing = %w[JWT_SECRET_KEY DATABASE_URL].select { |key| ENV[key].blank? }
  raise "Missing required environment variables: #{missing.join(', ')}" if missing.any?
end
