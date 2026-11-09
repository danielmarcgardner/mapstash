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

  describe "GET /api/places serialization" do
    let(:user) { create(:user) }

    it "returns lat/lng as numbers and nests the place's tags" do
      place = create(:place, user: user)
      tag = user.tags.create!(name: "Coffee", color: "#aabbcc")
      place.tags << tag

      get "/api/places", headers: auth_headers(user)

      body = response.parsed_body.first
      expect(body["lat"]).to be_a(Float).and eq(place.lat.to_f)
      expect(body["lng"]).to be_a(Float).and eq(place.lng.to_f)
      expect(body["tags"]).to eq([ { "id" => tag.id, "name" => "Coffee", "color" => "#aabbcc" } ])
    end
  end

  describe "GET /api/places/:id" do
    let(:user) { create(:user) }

    it "returns the place" do
      place = create(:place, user: user, google_place_id: "ChIJ123")

      get "/api/places/#{place.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("id" => place.id, "title" => place.title, "google_place_id" => "ChIJ123")
    end

    it "returns 404 errors for another user's place" do
      get "/api/places/#{create(:place).id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq("errors" => [ "Place not found" ])
    end

    it "returns 401 without a token" do
      get "/api/places/#{create(:place, user: user).id}", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/places" do
    let(:user) { create(:user) }
    let(:attrs) do
      {
        title: "Sammys", description: "Sandwiches", notes: "Get the cuban", address: "565 Northside Dr SW",
        location_name: "Sammy's Sandwich Shop", lat: 33.7465, lng: -84.4078, google_place_id: "ChIJabc",
        link_url: "https://www.instagram.com/reel/abc", image_url: "https://example.com/a.jpg", visited: true
      }
    end

    it "creates a place for the current user and returns every permitted field" do
      expect {
        post "/api/places", params: { place: attrs }.to_json, headers: auth_headers(user)
      }.to change(user.places, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body).to include(attrs.stringify_keys)
    end

    it "ignores a user_id in the params" do
      other = create(:user)

      post "/api/places", params: { place: attrs.merge(user_id: other.id) }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      expect(Place.find(response.parsed_body["id"]).user).to eq(user)
    end

    it "returns 422 errors for a blank title and creates nothing" do
      expect {
        post "/api/places", params: { place: attrs.merge(title: "") }.to_json, headers: auth_headers(user)
      }.not_to change(Place, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Title can't be blank" ])
    end
  end

  describe "PATCH /api/places/:id" do
    let(:user) { create(:user) }

    it "updates the place" do
      place = create(:place, user: user)

      patch "/api/places/#{place.id}", params: { place: { notes: "Go early" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["notes"]).to eq("Go early")
      expect(place.reload.notes).to eq("Go early")
    end
  end

  describe "DELETE /api/places/:id" do
    let(:user) { create(:user) }

    it "deletes the place and its join rows but keeps the tag and list" do
      place = create(:place, user: user)
      tag = user.tags.create!(name: "Coffee")
      list = user.lists.create!(title: "Favorites")
      place.tags << tag
      list.places << place

      delete "/api/places/#{place.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:no_content)
      expect(Place.exists?(place.id)).to be(false)
      expect(PlaceTag.where(place_id: place.id)).to be_empty
      expect(ListPlace.where(place_id: place.id)).to be_empty
      expect(Tag.exists?(tag.id) && List.exists?(list.id)).to be(true)
    end

    it "returns 404 errors for another user's place and keeps it" do
      other_place = create(:place)

      delete "/api/places/#{other_place.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(Place.exists?(other_place.id)).to be(true)
    end
  end

  describe "tag_ids and list_ids" do
    let(:user) { create(:user) }
    let(:other) { create(:user) }
    let(:coffee) { user.tags.create!(name: "Coffee") }
    let(:hike) { user.tags.create!(name: "Hike") }
    let(:favorites) { user.lists.create!(title: "Favorites") }
    let(:weekend) { user.lists.create!(title: "Weekend") }
    let(:new_place) { { title: "Sammys", lat: 33.7, lng: -84.4 } }

    def save(method, path, place)
      send(method, path, params: { place: place }.to_json, headers: auth_headers(user))
    end

    it "creates a place with the given tags and lists" do
      save(:post, "/api/places", new_place.merge(tag_ids: [ coffee.id, hike.id ], list_ids: [ favorites.id ]))

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["tags"].map { |t| t["id"] }).to match_array([ coffee.id, hike.id ])
      expect(response.parsed_body["list_ids"]).to eq([ favorites.id ])
      place = Place.find(response.parsed_body["id"])
      expect(place.tags).to match_array([ coffee, hike ])
      expect(place.lists).to eq([ favorites ])
    end

    it "returns 422 for another user's tag and creates nothing" do
      foreign = other.tags.create!(name: "Coffee")

      expect {
        save(:post, "/api/places", new_place.merge(tag_ids: [ coffee.id, foreign.id ]))
      }.not_to change { [ Place.count, PlaceTag.count ] }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Tag ids must all belong to you" ])
    end

    it "returns 422 for a missing or non-numeric id" do
      expect {
        save(:post, "/api/places", new_place.merge(list_ids: [ 0 ]))
        expect(response).to have_http_status(:unprocessable_content)

        save(:post, "/api/places", new_place.merge(tag_ids: [ "abc" ]))
        expect(response).to have_http_status(:unprocessable_content)
      }.not_to change(Place, :count)
    end

    it "treats the same id sent as a number and a string as one id" do
      save(:post, "/api/places", new_place.merge(tag_ids: [ coffee.id, coffee.id.to_s ]))

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["tags"].map { |t| t["id"] }).to eq([ coffee.id ])
    end

    context "with an existing place" do
      let(:place) { create(:place, user: user, title: "Before") }

      before do
        place.tags << coffee
        place.lists << favorites
      end

      it "removes all tags with tag_ids: [] and leaves lists alone when list_ids is omitted" do
        save(:patch, "/api/places/#{place.id}", { tag_ids: [] })

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["tags"]).to eq([])
        expect(place.reload.tags).to be_empty
        expect(place.lists).to eq([ favorites ])
      end

      it "replaces the lists with the given set" do
        save(:patch, "/api/places/#{place.id}", { list_ids: [ weekend.id ] })

        expect(response.parsed_body["list_ids"]).to eq([ weekend.id ])
        expect(place.reload.lists).to eq([ weekend ])
      end

      it "returns 422 for another user's list and changes nothing" do
        foreign = other.lists.create!(title: "Favorites")

        save(:patch, "/api/places/#{place.id}", { title: "After", tag_ids: [ hike.id ], list_ids: [ foreign.id ] })

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body).to eq("errors" => [ "List ids must all belong to you" ])
        place.reload
        expect([ place.title, place.tags, place.lists ]).to eq([ "Before", [ coffee ], [ favorites ] ])
      end

      it "rolls back the new tags when the place itself is invalid" do
        save(:patch, "/api/places/#{place.id}", { title: "", tag_ids: [ hike.id ] })

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body).to eq("errors" => [ "Title can't be blank" ])
        expect(place.reload.tags).to eq([ coffee ])
      end
    end

    it "includes list_ids on index without a query per place" do
      add = lambda do
        place = create(:place, user: user)
        place.tags << coffee
        place.lists << favorites
      end
      add.call
      baseline = query_count { get "/api/places", headers: auth_headers(user) }
      expect(response.parsed_body.first["list_ids"]).to eq([ favorites.id ])

      2.times { add.call }

      expect(query_count { get "/api/places", headers: auth_headers(user) }).to eq(baseline)
    end
  end

  describe "GET /api/places filters" do
    let(:user) { create(:user) }
    let(:other) { create(:user) }
    let(:coffee) { user.tags.create!(name: "Coffee") }
    let(:hike) { user.tags.create!(name: "Hike") }
    let(:scenic) { user.tags.create!(name: "Scenic") }
    let(:favorites) { user.lists.create!(title: "Favorites") }

    def place_with(tags: [], lists: [], **attrs)
      create(:place, user: user, **attrs).tap do |place|
        place.tags << tags
        place.lists << lists
      end
    end

    def ids_for(query)
      get "/api/places?#{query}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      response.parsed_body.map { |p| p["id"] }
    end

    it "returns places with any of the given tags, newest first, without duplicates" do
      both = place_with(tags: [ coffee, hike ], created_at: 1.day.ago)
      hike_only = place_with(tags: [ hike ], created_at: 2.days.ago)
      coffee_only = place_with(tags: [ coffee ], created_at: 3.days.ago)
      place_with(tags: [ scenic ])

      expect(ids_for("tag_ids[]=#{coffee.id}&tag_ids[]=#{hike.id}")).to eq([ both.id, hike_only.id, coffee_only.id ])
    end

    it "still returns every tag on a place matched through one of them" do
      place_with(tags: [ coffee, scenic ])

      get "/api/places?tag_ids[]=#{coffee.id}", headers: auth_headers(user)

      expect(response.parsed_body.first["tags"].map { |t| t["name"] }).to match_array(%w[Coffee Scenic])
    end

    it "returns only the given list's places" do
      listed = place_with(lists: [ favorites ])
      place_with

      expect(ids_for("list_id=#{favorites.id}")).to eq([ listed.id ])
    end

    it "requires both when tag_ids and list_id are given" do
      match = place_with(tags: [ coffee ], lists: [ favorites ])
      place_with(tags: [ coffee ])
      place_with(lists: [ favorites ])

      expect(ids_for("tag_ids[]=#{coffee.id}&list_id=#{favorites.id}")).to eq([ match.id ])
    end

    it "returns no places for another user's tag or list" do
      place_with(tags: [ coffee ], lists: [ favorites ])
      foreign_tag = other.tags.create!(name: "Coffee")
      foreign_list = other.lists.create!(title: "Favorites")
      create(:place, user: other).tap { |p| p.tags << foreign_tag; p.lists << foreign_list }

      expect(ids_for("tag_ids[]=#{foreign_tag.id}")).to eq([])
      expect(ids_for("list_id=#{foreign_list.id}")).to eq([])
    end

    it "returns no places for an id that doesn't exist" do
      place_with(tags: [ coffee ])

      expect(ids_for("tag_ids[]=0")).to eq([])
    end

    it "doesn't add a query per place when filtering" do
      query = "tag_ids[]=#{coffee.id}&list_id=#{favorites.id}"
      place_with(tags: [ coffee ], lists: [ favorites ])
      baseline = query_count { get "/api/places?#{query}", headers: auth_headers(user) }
      expect(response.parsed_body.size).to eq(1)

      2.times { place_with(tags: [ coffee ], lists: [ favorites ]) }

      expect(query_count { get "/api/places?#{query}", headers: auth_headers(user) }).to eq(baseline)
      expect(response.parsed_body.size).to eq(3)
    end
  end
end
