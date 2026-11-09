require 'rails_helper'

RSpec.describe "Users", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  describe "GET /api/users/me" do
    let(:user) { create(:user, email: "me@example.com") }

it "accepts a token just before it expires" do
  headers = auth_headers(user)

  travel 1.day - 1.minute do
    get "/api/users/me", headers: headers
  end

  expect(response).to have_http_status(:ok)
end

it "returns 401 for an expired token" do
      headers = auth_headers(user)

      travel 1.day + 1.second do
        get "/api/users/me", headers: headers
      end

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 for a revoked token" do
      headers = auth_headers(user)
      payload = Warden::JWTAuth::TokenDecoder.new.call(headers["Authorization"].split.last)
      JwtDenylist.create!(jti: payload["jti"], exp: Time.zone.at(payload["exp"]))

      get "/api/users/me", headers: headers

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns the signed-in user" do
      get "/api/users/me", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("id" => user.id, "email" => "me@example.com", "first_name" => "Map")
    end

    it "returns exactly the serialized user keys" do
      get "/api/users/me", headers: auth_headers(user)

      expect(response.parsed_body.keys).to match_array(%w[id email first_name last_name])
    end

    it "returns 401 without a token" do
      get "/api/users/me", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
