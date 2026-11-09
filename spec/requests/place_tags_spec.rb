require "rails_helper"

RSpec.describe "Place tags", type: :request do
  let(:user) { create(:user) }
  let(:other) { create(:user) }
  let(:place) { create(:place, user: user) }
  let(:tag) { create(:tag, user: user, name: "Coffee") }

  def add_tag(place_id, tag_id, headers: auth_headers(user))
    post "/api/places/#{place_id}/tags", params: { tag_id: tag_id }.to_json, headers: headers
  end

  def tag_names
    response.parsed_body["tags"].map { |t| t["name"] }
  end

  describe "POST /api/places/:place_id/tags" do
    it "adds the tag and returns the place" do
      add_tag(place.id, tag.id)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(place.id)
      expect(tag_names).to eq([ "Coffee" ])
    end

    it "is idempotent: adding twice leaves one join row" do
      2.times do
        add_tag(place.id, tag.id)
        expect(response).to have_http_status(:ok)
      end

      expect(PlaceTag.where(place: place, tag: tag).count).to eq(1)
      expect(tag_names).to eq([ "Coffee" ])
    end

    it "returns 404 for another user's place or tag and creates nothing" do
      foreign_place = create(:place, user: other)
      foreign_tag = create(:tag, user: other)

      expect {
        add_tag(foreign_place.id, tag.id)
        expect(response.parsed_body).to eq("errors" => [ "Place not found" ])
        add_tag(place.id, foreign_tag.id)
        expect(response.parsed_body).to eq("errors" => [ "Tag not found" ])
      }.not_to change(PlaceTag, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "returns 400 without a tag_id" do
      post "/api/places/#{place.id}/tags", params: { foo: 1 }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:bad_request)
    end

    it "returns 401 without a token" do
      add_tag(place.id, tag.id, headers: AuthHelpers::JSON_HEADERS)

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/places/:place_id/tags/:id" do
    before { place.tags << tag }

    it "removes only the join row and returns the place" do
      delete "/api/places/#{place.id}/tags/#{tag.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(tag_names).to eq([])
      expect(PlaceTag.where(place: place, tag: tag)).to be_empty
      expect(Place.exists?(place.id) && Tag.exists?(tag.id)).to be(true)
    end

    it "returns 200 when the tag isn't on the place" do
      other_tag = create(:tag, user: user, name: "Hike")

      delete "/api/places/#{place.id}/tags/#{other_tag.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(tag_names).to eq([ "Coffee" ])
    end

    it "returns 404 for another user's place or tag and keeps the row" do
      foreign_place = create(:place, user: other)
      foreign_tag = create(:tag, user: other)
      foreign_place.tags << foreign_tag

      delete "/api/places/#{foreign_place.id}/tags/#{foreign_tag.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
      delete "/api/places/#{place.id}/tags/#{foreign_tag.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)

      expect(PlaceTag.where(place: foreign_place, tag: foreign_tag)).to exist
    end
  end
end
