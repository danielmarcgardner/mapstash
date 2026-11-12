# frozen_string_literal: true

require "rails_helper"

RSpec.describe "db/seeds.rb", type: :request do
  let(:expected_places) do
    {
      "Suwanee Playground" => { list: "Child Activities", tags: [ "Family Friendly", "Urban Exploration" ] },
      "Luxury Cabin" => { list: "AirBnbs", tags: [ "Airbnb", "Hotel" ] },
      "Winter Trip Guide Greenville" => { list: "Destinations", tags: [ "Cultural Experience", "Adventure", "Relaxation", "Urban Exploration" ] },
      "Trip to Dahlonega" => { list: "Destinations", tags: [ "Urban Exploration", "Cultural Experience", "Adventure" ] },
      "Sammys Sandwich Shop" => { list: "Restaurants", tags: [ "Foodie", "Restaurant" ] }
    }
  end

  def seed
    expect { Rails.application.load_seed }.to output.to_stdout
  end

  def counts
    [ User, Tag, List, Place, ListPlace, PlaceTag ].map(&:count)
  end

  let(:seed_user) { User.find_by!(email: "test@example.com") }

  it "leaves the same row counts when run twice" do
    seed
    first = counts
    seed

    expect(counts).to eq(first)
  end

  it "gives the seed user 5 places with coordinates, 4 lists and 25 tags" do
    seed

    expect(seed_user.places.count).to eq(5)
    expect(seed_user.places.where(lat: nil).or(seed_user.places.where(lng: nil))).to be_empty
    expect(seed_user.lists.count).to eq(4)
    expect(seed_user.tags.count).to eq(25)
  end

  it "puts each place in its list with the tags its data names" do
    seed

    actual = seed_user.places.includes(:lists, :tags).to_h do |place|
      [ place.title, { list: place.lists.map(&:title).sole, tags: place.tags.map(&:name) } ]
    end
    expect(actual.keys).to match_array(expected_places.keys)
    expected_places.each do |title, expected|
      expect(actual[title][:list]).to eq(expected[:list])
      expect(actual[title][:tags]).to match_array(expected[:tags])
    end
  end

  it "only uses the seed user's own tags and lists when another user has the same names" do
    other = create(:user)
    other.tags.create!(name: "Family Friendly")
    other.lists.create!(title: "Restaurants")

    seed

    expect(PlaceTag.joins(:tag).where.not(tags: { user_id: seed_user.id })).to be_empty
    expect(ListPlace.joins(:list).where.not(lists: { user_id: seed_user.id })).to be_empty
  end

  it "lets the seed user log in and see their places and lists" do
    seed

    post "/api/login", params: { user: { email: "test@example.com", password: "12345678" } }.to_json,
                       headers: AuthHelpers::JSON_HEADERS
    expect(response).to have_http_status(:ok)
    headers = AuthHelpers::JSON_HEADERS.merge("Authorization" => "Bearer #{response.parsed_body['token']}")

    get "/api/places", headers: headers
    expect(response.parsed_body.size).to eq(5)
    get "/api/lists", headers: headers
    expect(response.parsed_body.size).to eq(4)
  end

  it "seeds nothing in production, where the seed user's known password would be a real account" do
    allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))
    expect { Rails.application.load_seed }.not_to change { counts }
  end
end
