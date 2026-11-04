require 'rails_helper'

RSpec.describe "Users", type: :request do
  describe "GET /api/users/me" do
    let(:user) { User.create!(email: "me@example.com", password: "password123", first_name: "Map", last_name: "Stasher") }

    it "returns the signed-in user" do
      get "/api/users/me", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("id" => user.id, "email" => "me@example.com", "first_name" => "Map")
    end

    it "returns 401 without a token" do
      get "/api/users/me", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
