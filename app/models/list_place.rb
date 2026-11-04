# == Schema Information
#
# Table name: list_places
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  list_id    :bigint           not null
#  place_id   :bigint           not null
#
# Indexes
#
#  index_list_places_on_list_id               (list_id)
#  index_list_places_on_list_id_and_place_id  (list_id,place_id) UNIQUE
#  index_list_places_on_place_id              (place_id)
#
# Foreign Keys
#
#  fk_rails_...  (list_id => lists.id)
#  fk_rails_...  (place_id => places.id)
#
class ListPlace < ApplicationRecord
  belongs_to :list
  belongs_to :place
end
