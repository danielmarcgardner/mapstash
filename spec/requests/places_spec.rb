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

  describe "PATCH /api/places/:id errors" do
    let(:user) { create(:user) }
    let(:place) { create(:place, user: user) }

    it "returns 404 errors for another user's place" do
      patch "/api/places/#{create(:place).id}", params: { place: { title: "x" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq("errors" => [ "Place not found" ])
    end

    it "returns 422 errors for an out-of-range lat" do
      patch "/api/places/#{place.id}", params: { place: { lat: 100 } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Lat must be in -90..90" ])
    end

    it "returns 400 errors without a place param" do
      patch "/api/places/#{place.id}", params: { foo: true }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["errors"]).to be_present
    end
  end
end
