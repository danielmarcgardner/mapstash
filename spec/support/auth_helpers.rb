# frozen_string_literal: true

require "devise/jwt/test_helpers"

# Request-spec helpers for JWT auth. Usage: get "/api/users/me", headers: auth_headers(user)
module AuthHelpers
  JSON_HEADERS = { "Accept" => "application/json", "Content-Type" => "application/json" }.freeze

  def auth_headers(user)
    Devise::JWT::TestHelpers.auth_headers(JSON_HEADERS.dup, user)
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
