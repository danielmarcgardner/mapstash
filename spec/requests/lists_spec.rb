require 'rails_helper'

RSpec.describe "Lists", type: :request do
  describe "GET /api/lists" do
    let(:user) { create(:user) }

    it "returns only the current user's lists" do
      mine = create(:list, user: user)
      create(:list) # another user's

      get "/api/lists", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |l| l["id"] }).to eq([ mine.id ])
    end

    it "returns 401 without a token" do
      get "/api/lists", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "errors" do
    let(:user) { create(:user) }

    it "returns 404 errors for another user's list on show and update" do
      foreign = create(:list, title: "Theirs")

      get "/api/lists/#{foreign.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq("errors" => [ "List not found" ])

      patch "/api/lists/#{foreign.id}", params: { list: { title: "Mine" } }.to_json, headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
      expect(foreign.reload.title).to eq("Theirs")
    end

    it "returns 422 errors for a blank title" do
      post "/api/lists", params: { list: { title: "" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Title can't be blank" ])
    end

    it "returns 400 errors without a list param" do
      post "/api/lists", params: { foo: "x" }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["errors"]).to be_present
    end
  end

  describe "list shape" do
    let(:user) { create(:user) }

    def list_with(title, places: 0)
      user.lists.create!(title: title).tap do |list|
        places.times { list.places << create(:place, user: user) }
      end
    end

    it "returns each list's place ids and count instead of nested places, ordered by title" do
      cherry = list_with("cherry")
      apple = list_with("apple", places: 2)
      banana = list_with("Banana")

      get "/api/lists", headers: auth_headers(user)

      expect(response.parsed_body.map { |l| l["title"] }).to eq(%w[apple Banana cherry])
      expect(response.parsed_body.first).to eq(
        "id" => apple.id, "title" => "apple", "description" => nil,
        "places_count" => 2, "place_ids" => apple.place_ids
      )
      expect(response.parsed_body.map { |l| l["places_count"] }).to eq([ 2, 0, 0 ])
      expect([ banana, cherry ].map(&:id)).to eq(response.parsed_body.drop(1).map { |l| l["id"] })
    end

    it "doesn't add a query per list or place" do
      list_with("One", places: 1)
      baseline = query_count { get "/api/lists", headers: auth_headers(user) }

      list_with("Two", places: 2)
      list_with("Three", places: 3)

      expect(query_count { get "/api/lists", headers: auth_headers(user) }).to eq(baseline)
    end

    it "returns the same shape on GET /api/lists/:id" do
      list = list_with("One", places: 1)

      get "/api/lists/#{list.id}", headers: auth_headers(user)

      expect(response.parsed_body).to eq(
        "id" => list.id, "title" => "One", "description" => nil, "places_count" => 1, "place_ids" => list.place_ids
      )
    end

    it "creates a list with no places" do
      post "/api/lists", params: { list: { title: "New", description: "Fresh" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body).to include("title" => "New", "description" => "Fresh", "places_count" => 0, "place_ids" => [])
    end

    it "updates the title" do
      list = list_with("Old")

      patch "/api/lists/#{list.id}", params: { list: { title: "New" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("New")
      expect(list.reload.title).to eq("New")
    end
  end

  describe "DELETE /api/lists/:id" do
    let(:user) { create(:user) }

    it "deletes the list and its memberships but keeps the places" do
      list = user.lists.create!(title: "Gone")
      kept = user.lists.create!(title: "Kept")
      only_here = create(:place, user: user)
      shared = create(:place, user: user)
      list.places << [ only_here, shared ]
      kept.places << shared

      delete "/api/lists/#{list.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:no_content)
      expect(List.exists?(list.id)).to be(false)
      expect(ListPlace.where(list_id: list.id)).to be_empty
      expect(Place.where(id: [ only_here.id, shared.id ]).count).to eq(2)
      expect(kept.reload.places).to eq([ shared ])
    end

    it "returns 404 for another user's list and keeps it" do
      foreign = create(:list)

      delete "/api/lists/#{foreign.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(List.exists?(foreign.id)).to be(true)
    end
  end
end
