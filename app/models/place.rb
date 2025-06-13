# == Schema Information
#
# Table name: places
#
#  id            :bigint           not null, primary key
#  address       :string
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
#  lists_id      :bigint           not null
#  user_id       :bigint           not null
#
# Indexes
#
#  index_places_on_lists_id  (lists_id)
#  index_places_on_user_id   (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (lists_id => lists.id)
#  fk_rails_...  (user_id => users.id)
#
class Place < ApplicationRecord
  belongs_to :user
  belongs_to :list
end
