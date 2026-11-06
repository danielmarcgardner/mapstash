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

  describe "database constraints" do
    let(:user) { create(:user) }

    before { create(:tag, user: user, name: "Coffee") }

    it "rejects the same name twice for one user" do
      expect { create(:tag, user: user, name: "Coffee") }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    it "rejects the same name in a different case for one user" do
      expect { create(:tag, user: user, name: "COFFEE") }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    it "lets two users each have a tag with the same name" do
      expect { create(:tag, user: create(:user), name: "Coffee") }.to change(Tag, :count).by(1)
    end

    it "rejects a tag with no user" do
      expect { build(:tag, user: nil).save(validate: false) }.to raise_error(ActiveRecord::NotNullViolation)
    end
  end
end
