require "rails_helper"

RSpec.describe "Tags", type: :request do
  let(:user) { create(:user) }
  let(:other) { create(:user) }

  def tag_place(tag)
    create(:place, user: tag.user).tags << tag
  end

  describe "GET /api/tags" do
    it "returns only the current user's tags, ordered by name, with places counts" do
      coffee = create(:tag, user: user, name: "coffee")
      beach = create(:tag, user: user, name: "Beach")
      create(:tag, user: other, name: "Another")
      2.times { tag_place(coffee) }

      get "/api/tags", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([
        { "id" => beach.id, "name" => "Beach", "color" => beach.color, "places_count" => 0 },
        { "id" => coffee.id, "name" => "coffee", "color" => coffee.color, "places_count" => 2 }
      ])
    end

    it "doesn't add a query per tag" do
      tag_place(create(:tag, user: user))
      baseline = query_count { get "/api/tags", headers: auth_headers(user) }

      2.times { tag_place(create(:tag, user: user)) }

      expect(query_count { get "/api/tags", headers: auth_headers(user) }).to eq(baseline)
      expect(response.parsed_body.size).to eq(3)
    end

    it "returns 401 without a token" do
      get "/api/tags", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/tags" do
    def create_tag(attrs)
      post "/api/tags", params: { tag: attrs }.to_json, headers: auth_headers(user)
    end

    it "creates a tag with the default color and no places" do
      create_tag(name: "Coffee")

      expect(response).to have_http_status(:created)
      expect(response.parsed_body).to include("name" => "Coffee", "color" => "#c1d5f5", "places_count" => 0)
      expect(user.tags.pluck(:name)).to eq([ "Coffee" ])
    end

    it "returns 422 for a name the user already has in another case" do
      create(:tag, user: user, name: "Coffee")

      create_tag(name: "coffee")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Name has already been taken" ])
    end

    it "returns 422 for a bad color" do
      create_tag(name: "Coffee", color: "red")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include(a_string_starting_with("Color must be a hex color"))
    end
  end

  describe "PATCH /api/tags/:id" do
    let(:tag) { create(:tag, user: user, name: "Coffee") }

    def update_tag(id, attrs)
      patch "/api/tags/#{id}", params: { tag: attrs }.to_json, headers: auth_headers(user)
    end

    it "renames and recolors the tag" do
      tag_place(tag)

      update_tag(tag.id, name: "Espresso", color: "#112233")

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq("id" => tag.id, "name" => "Espresso", "color" => "#112233", "places_count" => 1)
    end

    it "returns 422 when renaming to a name the user already has" do
      create(:tag, user: user, name: "Hike")

      update_tag(tag.id, name: "HIKE")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Name has already been taken" ])
      expect(tag.reload.name).to eq("Coffee")
    end

    it "returns 404 for another user's tag and leaves it unchanged" do
      foreign = create(:tag, user: other, name: "Theirs")

      update_tag(foreign.id, name: "Mine")

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq("errors" => [ "Tag not found" ])
      expect(foreign.reload.name).to eq("Theirs")
    end
  end

  describe "DELETE /api/tags/:id" do
    it "deletes the tag and its place links but keeps the places" do
      tag = create(:tag, user: user)
      place = create(:place, user: user)
      place.tags << tag

      delete "/api/tags/#{tag.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:no_content)
      expect(Tag.exists?(tag.id)).to be(false)
      expect(PlaceTag.where(tag_id: tag.id)).to be_empty
      expect(Place.exists?(place.id)).to be(true)
    end

    it "returns 404 for another user's tag and keeps it" do
      foreign = create(:tag, user: other)

      delete "/api/tags/#{foreign.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(Tag.exists?(foreign.id)).to be(true)
    end
  end
end
