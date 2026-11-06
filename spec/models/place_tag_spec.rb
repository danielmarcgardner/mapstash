# == Schema Information
#
# Table name: place_tags
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  place_id   :bigint           not null
#  tag_id     :bigint           not null
#
# Indexes
#
#  index_place_tags_on_place_id             (place_id)
#  index_place_tags_on_place_id_and_tag_id  (place_id,tag_id) UNIQUE
#  index_place_tags_on_tag_id               (tag_id)
#
# Foreign Keys
#
#  fk_rails_...  (place_id => places.id)
#  fk_rails_...  (tag_id => tags.id)
#
require 'rails_helper'

RSpec.describe PlaceTag, type: :model do
  it "joins a tag to a place" do
    expect { PlaceTag.create!(place: create(:place), tag: create(:tag)) }.to change(PlaceTag, :count).by(1)
  end

  describe "database constraints" do
    let(:place) { create(:place) }
    let(:tag) { create(:tag) }

    before { PlaceTag.create!(place: place, tag: tag) }

    it "rejects the same tag on a place twice" do
      expect { PlaceTag.create!(place: place, tag: tag) }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    it "allows the same tag on two different places" do
      expect { PlaceTag.create!(place: create(:place), tag: tag) }.to change(PlaceTag, :count).by(1)
    end
  end
end
