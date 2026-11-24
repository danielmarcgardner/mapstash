require "rails_helper"

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
#  visited_on      :date
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
RSpec.describe PlaceSerializer do
  it "serializes missing lat/lng as null, not a placeholder string" do
    json = described_class.new(build(:place, lat: nil, lng: nil)).as_json

    expect(json).to include(lat: nil, lng: nil)
  end

  it "serializes an unvisited place as visited: false with no date" do
    json = described_class.new(build(:place)).as_json

    expect(json).to include(visited: false, visited_on: nil)
  end
end
