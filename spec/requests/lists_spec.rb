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

    it "returns 404 errors for another user's list" do
      get "/api/lists/#{create(:list).id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq("errors" => [ "List not found" ])
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

  describe "nested places" do
    let(:user) { create(:user) }

    def add_tagged_place(list, tag)
      place = create(:place, user: user)
      place.tags << tag
      list.places << place
    end

    def query_count(&block)
      count = 0
      counter = ->(*, payload) { count += 1 unless payload[:name].in?(%w[SCHEMA TRANSACTION]) }
      ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &block)
      count
    end

    it "includes each place's tags without a query per list or place" do
      tag = user.tags.create!(name: "Coffee")
      add_tagged_place(user.lists.create!(title: "One"), tag)
      baseline = query_count { get "/api/lists", headers: auth_headers(user) }

      expect(response.parsed_body.first["places"].first["tags"].map { |t| t["name"] }).to eq([ "Coffee" ])

      second = user.lists.create!(title: "Two")
      2.times { add_tagged_place(second, tag) }

      expect(query_count { get "/api/lists", headers: auth_headers(user) }).to eq(baseline)
    end

    it "includes the tags on GET /api/lists/:id" do
      list = user.lists.create!(title: "One")
      add_tagged_place(list, user.tags.create!(name: "Coffee"))

      get "/api/lists/#{list.id}", headers: auth_headers(user)

      expect(response.parsed_body["places"].first["tags"].map { |t| t["name"] }).to eq([ "Coffee" ])
    end
  end
end
