require 'rails_helper'

RSpec.describe "Places", type: :request do
  describe "GET /api/places" do
    let(:user) { create(:user) }

    it "returns only the current user's places, newest first" do
      older = create(:place, user: user, created_at: 2.days.ago)
      newer = create(:place, user: user, created_at: 1.day.ago)
      create(:place) # another user's

      get "/api/places", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |p| p["id"] }).to eq([ newer.id, older.id ])
    end

    it "returns 401 without a token" do
      get "/api/places", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
