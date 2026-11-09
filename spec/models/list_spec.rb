# == Schema Information
#
# Table name: lists
#
#  id          :bigint           not null, primary key
#  description :text
#  title       :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  user_id     :bigint           not null
#
# Indexes
#
#  index_lists_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe List, type: :model do
  it "has a valid factory" do
    expect(build(:list)).to be_valid
  end

  describe "validations" do
    let(:user) { create(:user) }

    it "requires a title" do
      list = build(:list, title: "")

      expect(list).not_to be_valid
      expect(list.errors[:title]).to be_present
    end

    it "rejects a duplicate title for the same user" do
      create(:list, user: user, title: "Restaurants")

      expect(build(:list, user: user, title: "Restaurants")).not_to be_valid
    end

    it "allows the same title for another user" do
      create(:list, user: user, title: "Restaurants")

      expect(build(:list, title: "Restaurants")).to be_valid
    end
  end
end
