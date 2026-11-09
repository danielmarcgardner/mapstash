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

  describe "password length" do
    it "rejects a password shorter than 6 characters" do
      user = build(:user, password: "abcde")

      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "accepts a 6-character password" do
      expect(build(:user, password: "abcdef")).to be_valid
    end

    it "doesn't require the password when updating other fields" do
      user = User.find(create(:user).id)

      expect(user.update(first_name: "New")).to be(true)
    end
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
      expect([ Place.where(id: place.id), List.where(id: list.id), Tag.where(id: tag.id), ListPlace.where(list_id: list.id), PlaceTag.where(place_id: place.id) ]).to all(be_empty)
    end

    it "keeps other users' data" do
      other_place = create(:place, user: other_user)
      other_tag = create(:tag, user: other_user)
      PlaceTag.create!(place: other_place, tag: other_tag)

      user.destroy!

      expect(Place.exists?(other_place.id)).to be(true)
      expect(Tag.exists?(other_tag.id)).to be(true)
      expect(PlaceTag.where(place: other_place).count).to eq(1)
    end

    it "removes a tag the user owns from another user's place" do
      other_place = create(:place, user: other_user)
      PlaceTag.create!(place: other_place, tag: user.tags.create!(name: "Coffee"))

      user.destroy!

      expect(Place.exists?(other_place.id)).to be(true)
      expect(PlaceTag.where(place: other_place)).to be_empty
    end
  end
end
