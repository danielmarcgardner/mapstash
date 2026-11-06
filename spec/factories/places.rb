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
FactoryBot.define do
  factory :place do
    user
    sequence(:title) { |n| "Place #{n}" }
    address { "1 Main St" }
  end
end
