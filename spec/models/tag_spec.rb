# == Schema Information
#
# Table name: tags
#
#  id         :bigint           not null, primary key
#  color      :string           default("#c1d5f5"), not null
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_tags_on_user_id                 (user_id)
#  index_tags_on_user_id_and_lower_name  (user_id, lower((name)::text)) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe Tag, type: :model do
  it "has a valid factory" do
    expect(build(:tag)).to be_valid
  end

  it "returns the places it's tagged on" do
    tag = create(:tag)
    place = create(:place, user: tag.user)
    PlaceTag.create!(place: place, tag: tag)

    expect(tag.places).to eq([ place ])
  end

  describe "validations" do
    let(:user) { create(:user) }

    it "requires a name" do
      tag = build(:tag, name: "")

      expect(tag).not_to be_valid
      expect(tag.errors[:name]).to be_present
    end

    it "rejects a duplicate name for the same user, in any case" do
      create(:tag, user: user, name: "Coffee")

      expect(build(:tag, user: user, name: "Coffee")).not_to be_valid
      expect(build(:tag, user: user, name: "COFFEE")).not_to be_valid
    end

    it "allows the same name for another user" do
      create(:tag, user: user, name: "Coffee")

      expect(build(:tag, name: "Coffee")).to be_valid
    end

    it "accepts a 6-digit hex color" do
      expect(build(:tag, color: "#A1b2C3")).to be_valid
    end

    it "rejects a color that isn't a 6-digit hex value" do
      %w[blue #abc abcdef #abcdeg].each do |color|
        expect(build(:tag, color: color)).not_to be_valid, "expected #{color} to be invalid"
      end
    end
  end

  # These bypass validations to prove the database enforces the same rules.
  describe "database constraints" do
    let(:user) { create(:user) }

    before { create(:tag, user: user, name: "Coffee") }

    it "rejects the same name twice for one user" do
      expect { build(:tag, user: user, name: "Coffee").save(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    it "rejects the same name in a different case for one user" do
      expect { build(:tag, user: user, name: "COFFEE").save(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    it "lets two users each have a tag with the same name" do
      expect { create(:tag, user: create(:user), name: "Coffee") }.to change(Tag, :count).by(1)
    end

    it "rejects a tag with no user" do
      expect { build(:tag, user: nil).save(validate: false) }.to raise_error(ActiveRecord::NotNullViolation)
    end
  end
end
