require "rails_helper"

RSpec.describe PlaceSerializer do
  it "serializes missing lat/lng as null, not a placeholder string" do
    json = described_class.new(build(:place, lat: nil, lng: nil)).as_json

    expect(json).to include(lat: nil, lng: nil)
  end
end
