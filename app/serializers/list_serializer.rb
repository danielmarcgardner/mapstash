# frozen_string_literal: true

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
#  index_lists_on_user_id            (user_id)
#  index_lists_on_user_id_and_title  (user_id,title) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class ListSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :places_count, :place_ids

  # Read the preloaded join rows; the client already has the places from /api/places.
  def place_ids
    object.list_places.map(&:place_id)
  end

  def places_count
    object.list_places.size
  end
end
