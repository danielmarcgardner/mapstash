require 'rails_helper'

RSpec.describe "Users", type: :request do
  describe "GET /api/users/me" do
    let(:user) { create(:user, email: "me@example.com") }

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
