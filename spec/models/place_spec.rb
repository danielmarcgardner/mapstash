# == Schema Information
#
# Table name: places
#
#  id            :bigint           not null, primary key
#  address       :string
#  description   :string
#  image_url     :string
#  lat           :decimal(, )
#  link_url      :string
#  lng           :decimal(, )
#  location_name :string
#  notes         :text
#  title         :string
#  visited       :boolean
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  user_id       :bigint           not null
#
# Indexes
#
#  index_places_on_user_id  (user_id)
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
end
