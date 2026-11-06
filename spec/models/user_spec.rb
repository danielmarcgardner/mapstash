# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  first_name             :string
#  jti                    :string
#  last_name              :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_jti                   (jti)
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
require 'rails_helper'

RSpec.describe User, type: :model do
  it "has a valid factory" do
    expect(build(:user)).to be_valid
  end

  describe "#destroy" do
    let(:user) { create(:user) }
    let(:other_user) { create(:user) }

    it "removes the user with their places, lists, tags and join rows" do
      place = create(:place, user: user)
      list = create(:list, user: user)
      tag = user.tags.create!(name: "Coffee")
      ListPlace.create!(list: list, place: place)
      PlaceTag.create!(place: place, tag: tag)

      user.destroy!

      expect(User.exists?(user.id)).to be(false)
      expect([ Place, List, Tag, ListPlace, PlaceTag ].map(&:count)).to all(eq(0))
    end

    it "keeps other users' data and unowned tags" do
      other_place = create(:place, user: other_user)
      unowned_tag = create(:tag)
      PlaceTag.create!(place: other_place, tag: unowned_tag)

      user.destroy!

      expect(Place.exists?(other_place.id)).to be(true)
      expect(Tag.exists?(unowned_tag.id)).to be(true)
      expect(PlaceTag.count).to eq(1)
    end

    it "removes a tag the user owns from another user's place" do
      other_place = create(:place, user: other_user)
      PlaceTag.create!(place: other_place, tag: user.tags.create!(name: "Coffee"))

      user.destroy!

      expect(Place.exists?(other_place.id)).to be(true)
      expect(PlaceTag.count).to eq(0)
    end
  end
end
