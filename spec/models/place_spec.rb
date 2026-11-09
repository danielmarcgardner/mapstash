# == Schema Information
#
# Table name: places
#
#  id              :bigint           not null, primary key
#  address         :string
#  description     :string
#  image_url       :string
#  lat             :decimal(10, 6)
#  link_url        :string
#  lng             :decimal(10, 6)
#  location_name   :string
#  notes           :text
#  title           :string
#  visited         :boolean
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  google_place_id :string
#  user_id         :bigint           not null
#
# Indexes
#
#  index_places_on_google_place_id  (google_place_id)
#  index_places_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe Place, type: :model do
  it "has a valid factory" do
    expect(build(:place)).to be_valid
  end

  it "returns its tags" do
    place = create(:place)
    tag = create(:tag, user: place.user)
    PlaceTag.create!(place: place, tag: tag)

    expect(place.tags).to eq([ tag ])
  end

  it "stores coordinates at 6 decimal places" do
    place = create(:place, lat: 34.0595312, lng: -84.0699531).reload

    expect(place.lat).to eq(BigDecimal("34.059531"))
    expect(place.lng).to eq(BigDecimal("-84.069953"))
  end

  it "stores a google_place_id that two places can share" do
    places = create_list(:place, 2, google_place_id: "ChIJ-shared-id")

    expect(places.map { |place| place.reload.google_place_id }).to all(eq("ChIJ-shared-id"))
  end

  describe "validations" do
    %i[title lat lng].each do |attr|
      it "requires #{attr}" do
        place = build(:place, attr => nil)

        expect(place.save).to be(false)
        expect(place.errors[attr]).to be_present
      end
    end

    it "rejects coordinates out of range" do
      [ { lat: 90.1 }, { lat: -90.1 }, { lng: 180.1 }, { lng: -180.1 }, { lat: 10_000 } ].each do |coords|
        expect(build(:place, coords)).not_to be_valid, "expected #{coords} to be invalid"
      end
    end

    it "accepts coordinates on the boundary" do
      expect(build(:place, lat: 90, lng: -180)).to be_valid
      expect(build(:place, lat: -90, lng: 180)).to be_valid
    end

    it "accepts a blank or http(s) link_url" do
      [ nil, "", "http://example.com", "https://www.instagram.com/reel/abc/?igsh=x==" ].each do |url|
        expect(build(:place, link_url: url)).to be_valid, "expected #{url.inspect} to be valid"
      end
    end

    it "rejects a link_url that isn't an http(s) URL" do
      [ "ftp://example.com", "not a url", "javascript:alert(1)", "https://", "junk http://example.com" ].each do |url|
        place = build(:place, link_url: url)

        expect(place).not_to be_valid, "expected #{url.inspect} to be invalid"
        expect(place.errors[:link_url]).to be_present
      end
    end
  end
end
