require "rails_helper"

RSpec.describe "Place visits", type: :request do
  let(:user) { create(:user) }
  let(:place) { create(:place, user: user, updated_at: 1.week.ago) }

  def visit_place(place_id, visited_on: nil, headers: auth_headers(user))
    post "/api/places/#{place_id}/visit", params: { visited_on: visited_on }.compact.to_json, headers: headers
  end

  describe "POST /api/places/:place_id/visit" do
    it "marks the place visited today without touching updated_at" do
      expect { visit_place(place.id) }.not_to(change { place.reload.updated_at })

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("id" => place.id, "visited" => true, "visited_on" => Date.current.iso8601)
      expect(place.reload.visited_on).to eq(Date.current)
    end

    it "uses the given visited_on" do
      visit_place(place.id, visited_on: "2026-01-02")

      expect(response).to have_http_status(:ok)
      expect(place.reload.visited_on).to eq(Date.new(2026, 1, 2))
    end

    it "accepts tomorrow, so a user ahead of UTC can send their local today" do
      visit_place(place.id, visited_on: Date.tomorrow.iso8601)

      expect(response).to have_http_status(:ok)
      expect(place.reload.visited_on).to eq(Date.tomorrow)
    end

    it "returns 422 for a date past tomorrow and stores nothing" do
      visit_place(place.id, visited_on: (Date.current + 2).iso8601)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Visited on can't be in the future" ])
      expect(place.reload.visited_on).to be_nil
    end

    it "returns 422 for an unparseable date and keeps the existing visit" do
      place.update_columns(visited_on: Date.new(2026, 3, 4))

      visit_place(place.id, visited_on: "junk")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Visited on is not a valid date" ])
      expect(place.reload.visited_on).to eq(Date.new(2026, 3, 4))
    end

    it "returns 422, not 500, for a number or an array" do
      [ 20260101, [ "2026-01-02" ] ].each do |value|
        visit_place(place.id, visited_on: value)

        expect(response).to have_http_status(:unprocessable_content), "expected 422 for #{value.inspect}"
        expect(response.parsed_body).to eq("errors" => [ "Visited on is not a valid date" ])
      end
      expect(place.reload.visited_on).to be_nil
    end

    it "returns 404 for another user's place and leaves it unvisited" do
      foreign = create(:place)

      visit_place(foreign.id)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq("errors" => [ "Place not found" ])
      expect(foreign.reload.visited_on).to be_nil
    end

    it "returns 401 without a token" do
      visit_place(place.id, headers: AuthHelpers::JSON_HEADERS)

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/places/:place_id/visit" do
    before { place.update_columns(visited_on: Date.new(2026, 3, 4)) }

    it "clears the visit without touching updated_at" do
      expect {
        delete "/api/places/#{place.id}/visit", headers: auth_headers(user)
      }.not_to(change { place.reload.updated_at })

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("visited" => false, "visited_on" => nil)
      expect(place.reload.visited_on).to be_nil
    end

    it "returns 404 for another user's place and keeps its visit" do
      foreign = create(:place, visited_on: Date.new(2026, 3, 4))

      delete "/api/places/#{foreign.id}/visit", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(foreign.reload.visited_on).to eq(Date.new(2026, 3, 4))
    end

    it "returns 401 without a token" do
      delete "/api/places/#{place.id}/visit", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
