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

  it "stores coordinates at 6 decimal places" do
    place = create(:place, lat: 34.0595312, lng: -84.0699531).reload

    expect(place.lat).to eq(BigDecimal("34.059531"))
    expect(place.lng).to eq(BigDecimal("-84.069953"))
  end

  it "stores a google_place_id that two places can share" do
    places = create_list(:place, 2, google_place_id: "ChIJ-shared-id")

    expect(places.map { |place| place.reload.google_place_id }).to all(eq("ChIJ-shared-id"))
  end
end
